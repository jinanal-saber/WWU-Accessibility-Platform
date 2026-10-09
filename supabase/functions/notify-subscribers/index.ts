// supabase/functions/notify-subscribers/index.ts
//
// Called right after a report is submitted. Emails every subscriber whose building /
// category filters match that report.
//
// What changed from the first version:
//   * Sender + site URL come from secrets (FROM_ADDRESS / SITE_URL), so the emails come
//     from your own verified domain instead of Resend's shared sandbox address (the
//     sandbox address is the main reason mail was landing in spam or not arriving).
//   * The email content is read from the saved report in the database, NOT from the
//     request body. Before, anyone who knew the function URL could post any text and
//     have it emailed to every subscriber. Now the request is only used to FIND the
//     report that was just submitted, and each report can only be announced once.
//   * Every message has a plain-text version, a List-Unsubscribe header and a clean,
//     table-based layout that renders in Outlook / school mail as well as Gmail.
//
// Needs the columns from sql/4-email-setup.sql (reports.notified_at).
//
// Secrets (npx supabase secrets set NAME=value):
//   RESEND_API_KEY   (already set)
//   FROM_ADDRESS     e.g.  WWU AccessMap <notifications@wwuaccessmap.xyz>
//   SITE_URL         e.g.  https://wwuaccessmap.xyz/user     (no trailing slash)
//   REPLY_TO         optional, e.g. your own email address
//
// Deploy with: npx supabase functions deploy notify-subscribers
// (add --no-verify-jwt if the browser gets a 401, same as your other functions)

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_API_URL = "https://api.resend.com/emails";

const SITE_URL = (Deno.env.get("SITE_URL") || "https://wwuaccessmap.xyz/user").replace(/\/+$/, "");
const FROM_ADDRESS = Deno.env.get("FROM_ADDRESS") || "WWU AccessMap <notifications@wwuaccessmap.xyz>";
const REPLY_TO = Deno.env.get("REPLY_TO") || "";

// How recent a report must be to be announced. Stops old reports being re-sent.
const MAX_REPORT_AGE_MINUTES = 15;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) return json({ sent: 0, reason: "RESEND_API_KEY not set" });

    const body = await req.json();
    const report = await findRecentReport(body);
    if (!report) return json({ sent: 0, reason: "no matching recent report" }, 404);

    // Claim the report so it can only ever be announced once (also covers double-clicks)
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("reports")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", report.id)
      .is("notified_at", null)
      .select("id");
    if (claimError) throw claimError;
    if (!claimed || claimed.length === 0) return json({ sent: 0, reason: "already notified" });

    const { data: subscriptions, error } = await supabaseAdmin
      .from("subscriptions")
      .select("email, buildings, categories, all_notifications, unsubscribe_token");
    if (error) throw error;

    const matches = (subscriptions || []).filter((sub) => subscriberMatches(sub, report));
    if (matches.length === 0) return json({ sent: 0, matched: 0 });

    let sentCount = 0;
    // Sequential, not parallel: keeps well inside Resend's rate limits
    for (const sub of matches) {
      const unsubscribeUrl = `${SITE_URL}/unsubscribe.html?token=${encodeURIComponent(sub.unsubscribe_token)}`;
      const message = buildReportEmail(report, unsubscribeUrl);
      const ok = await sendEmail({ to: sub.email, unsubscribeUrl, ...message });
      if (ok) sentCount++;
    }

    return json({ sent: sentCount, matched: matches.length });
  } catch (err) {
    console.error("notify-subscribers error:", err);
    return json({ error: String(err) }, 500);
  }
});

// ---------------------------------------------------------------------------------
// Finding the report + matching subscribers
// ---------------------------------------------------------------------------------
interface ReportRow {
  id: string | number;
  title: string | null;
  description: string | null;
  building: string | null;
  category: string | null;
  severity: string | null;
  created_at: string | null;
}

async function findRecentReport(body: Record<string, string | null | undefined>): Promise<ReportRow | null> {
  const cutoff = new Date(Date.now() - MAX_REPORT_AGE_MINUTES * 60 * 1000).toISOString();

  let query = supabaseAdmin
    .from("reports")
    .select("id, title, description, building, category, severity, created_at")
    .gte("created_at", cutoff)
    .is("notified_at", null)
    // never announce something still waiting on moderation, or already closed
    .or("flag_status.is.null,flag_status.neq.pending")
    .or("status.is.null,status.not.in.(resolved,removed)");

  for (const column of ["title", "description", "building", "category"] as const) {
    const value = body?.[column];
    query = value === null || value === undefined ? query.is(column, null) : query.eq(column, value);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(1);
  if (error) throw error;
  return data && data.length > 0 ? (data[0] as ReportRow) : null;
}

function subscriberMatches(
  sub: { buildings: string[] | null; categories: string[] | null; all_notifications: boolean | null },
  report: ReportRow,
): boolean {
  if (sub.all_notifications) return true;

  const hasBuildingFilter = !!sub.buildings && sub.buildings.length > 0;
  const hasCategoryFilter = !!sub.categories && sub.categories.length > 0;
  const buildingMatches = hasBuildingFilter && sub.buildings!.includes(report.building ?? "");
  const categoryMatches = hasCategoryFilter && sub.categories!.includes(report.category ?? "");

  // Both filters set -> need both. One filter set -> that one alone decides.
  if (hasBuildingFilter && hasCategoryFilter) return buildingMatches && categoryMatches;
  if (hasBuildingFilter) return buildingMatches;
  if (hasCategoryFilter) return categoryMatches;
  return false;
}

// ---------------------------------------------------------------------------------
// Email content
// ---------------------------------------------------------------------------------
const SEVERITY_STYLES: Record<string, { label: string; color: string; background: string }> = {
  critical: { label: "Critical", color: "#9b1c1f", background: "#fde8e8" },
  medium: { label: "Medium", color: "#8a5a00", background: "#fff3d1" },
  low: { label: "Low", color: "#0a5c36", background: "#dff5e8" },
};

function buildReportEmail(report: ReportRow, unsubscribeUrl: string) {
  const title = clean(report.title) || "Accessibility report";
  const building = clean(report.building) || "Campus Grounds";
  const category = clean(report.category) || "Other";
  const severityKey = (report.severity || "medium").toLowerCase();
  const severity = SEVERITY_STYLES[severityKey] || SEVERITY_STYLES.medium;
  const description = truncate(clean(report.description) || "No description provided.", 700);
  const reported = formatDate(report.created_at);
  const mapUrl = `${SITE_URL}/map.html`;

  const subject = truncate(
    `${severityKey === "critical" ? "Critical: " : ""}${title} – ${building}`,
    110,
  );

  const rows: Array<[string, string]> = [
    ["Building", escapeHtml(building)],
    ["Issue type", escapeHtml(category)],
    ["Severity", `<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;color:${severity.color};background:${severity.background};">${severity.label}</span>`],
    ["Reported", escapeHtml(reported)],
  ];

  const detailRows = rows.map(([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e9ef;font-size:13px;color:#64748b;width:110px;vertical-align:top;">${label}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e9ef;font-size:15px;color:#1c2023;vertical-align:top;">${value}</td>
        </tr>`).join("");

  const content = `
        <p style="margin:0 0 6px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:700;">New accessibility report</p>
        <h1 style="margin:0 0 20px 0;font-size:22px;line-height:1.3;color:#003F87;">${escapeHtml(title)}</h1>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e9ef;margin-bottom:20px;">${detailRows}
        </table>

        <p style="margin:0 0 6px 0;font-size:13px;color:#64748b;font-weight:700;">Details</p>
        <div style="background:#f4f7fb;border-left:4px solid #007AC8;border-radius:4px;padding:14px 16px;margin-bottom:26px;font-size:15px;line-height:1.55;color:#1c2023;">${escapeHtml(description).replace(/\n/g, "<br>")}</div>

        ${button("View on the map", mapUrl)}`;

  const footer = `You're getting this because you subscribed to WWU AccessMap notifications.<br>
        <a href="${escapeAttr(unsubscribeUrl)}" style="color:#007AC8;">Unsubscribe</a> at any time.`;

  const html = layout({
    preheader: `${severity.label} · ${category} · ${building}`,
    content,
    footer,
  });

  const text = [
    "NEW ACCESSIBILITY REPORT",
    "",
    title,
    "",
    `Building:   ${building}`,
    `Issue type: ${category}`,
    `Severity:   ${severity.label}`,
    `Reported:   ${reported}`,
    "",
    "Details:",
    description,
    "",
    `View on the map: ${mapUrl}`,
    "",
    "---",
    "You're getting this because you subscribed to WWU AccessMap notifications.",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="background:#003F87;border-radius:6px;">
            <a href="${escapeAttr(url)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
          </td></tr></table>`;
}

// One shared shell: dark-blue header, white card, small grey footer. Tables + inline
// styles only, because Outlook (and therefore many school mailboxes) ignores most CSS.
function layout({ preheader, content, footer }: { preheader: string; content: string; footer: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>WWU AccessMap</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f6;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f6;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr><td style="background:#003F87;border-radius:10px 10px 0 0;padding:18px 28px;">
        <span style="font-size:18px;font-weight:700;color:#ffffff;">WWU AccessMap</span>
        <br><span style="font-size:13px;color:#b9d3f0;">Campus accessibility updates</span>
      </td></tr>
      <tr><td style="background:#ffffff;padding:28px;border-left:1px solid #dde3ea;border-right:1px solid #dde3ea;">${content}
      </td></tr>
      <tr><td style="background:#f8fafc;border:1px solid #dde3ea;border-top:none;border-radius:0 0 10px 10px;padding:18px 28px;font-size:12px;line-height:1.6;color:#64748b;">
        ${footer}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------------
async function sendEmail(
  { to, subject, html, text, unsubscribeUrl }:
    { to: string; subject: string; html: string; text: string; unsubscribeUrl: string },
): Promise<boolean> {
  const payload: Record<string, unknown> = {
    from: FROM_ADDRESS,
    to: [to],
    subject: subject.replace(/[\r\n]+/g, " "),
    html,
    text,
    headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
  };
  if (REPLY_TO) payload.reply_to = REPLY_TO;

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error(`Failed to email ${to}:`, response.status, await response.text());
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------
function clean(value: string | null | undefined): string {
  return (value ?? "").toString().trim();
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max - 1).trimEnd() + "…" : value;
}

function formatDate(iso: string | null): string {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const escapeAttr = escapeHtml;
