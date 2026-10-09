// supabase/functions/send-confirmation/index.ts
//
// Sends the "you're subscribed" confirmation email right after someone signs up.
//
// How it stays safe: the browser only sends the subscriber's secret unsubscribe TOKEN
// (the same one shown on the success screen). The function looks that token up and
// emails the address stored with it, so it can never be used to email an arbitrary
// address. Each subscription can only be confirmed once (confirmation_sent_at).
//
// Needs the column from sql/4-email-setup.sql (subscriptions.confirmation_sent_at).
//
// Secrets: same as notify-subscribers (RESEND_API_KEY, FROM_ADDRESS, SITE_URL, REPLY_TO).
//
// Deploy with: npx supabase functions deploy send-confirmation
// (add --no-verify-jwt if the browser gets a 401, same as your other functions)

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_API_URL = "https://api.resend.com/emails";

const SITE_URL = (Deno.env.get("SITE_URL") || "https://wwuaccessmap.xyz/user").replace(/\/+$/, "");
const FROM_ADDRESS = Deno.env.get("FROM_ADDRESS") || "WWU AccessMap <notifications@wwuaccessmap.xyz>";
const REPLY_TO = Deno.env.get("REPLY_TO") || "";

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
    if (!RESEND_API_KEY) return json({ sent: false, reason: "RESEND_API_KEY not set" });

    const { token } = await req.json();
    if (typeof token !== "string" || token.length < 8) return json({ sent: false, reason: "bad token" }, 400);

    // Claim the confirmation first (atomic), so double-clicks / retries can't send twice
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("subscriptions")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq("unsubscribe_token", token)
      .is("confirmation_sent_at", null)
      .select("email, buildings, categories, all_notifications, unsubscribe_token");
    if (claimError) throw claimError;
    if (!claimed || claimed.length === 0) return json({ sent: false, reason: "unknown token or already confirmed" });

    const sub = claimed[0];
    const unsubscribeUrl = `${SITE_URL}/unsubscribe.html?token=${encodeURIComponent(sub.unsubscribe_token)}`;
    const message = buildConfirmationEmail(sub, unsubscribeUrl);
    const ok = await sendEmail({ to: sub.email, unsubscribeUrl, ...message });

    if (!ok) {
      // Let a later retry try again
      await supabaseAdmin.from("subscriptions").update({ confirmation_sent_at: null }).eq("unsubscribe_token", token);
      return json({ sent: false, reason: "email provider rejected the message" }, 502);
    }
    return json({ sent: true });
  } catch (err) {
    console.error("send-confirmation error:", err);
    return json({ error: String(err) }, 500);
  }
});

// ---------------------------------------------------------------------------------
// Email content
// ---------------------------------------------------------------------------------
interface SubscriptionRow {
  email: string;
  buildings: string[] | null;
  categories: string[] | null;
  all_notifications: boolean | null;
}

function buildConfirmationEmail(sub: SubscriptionRow, unsubscribeUrl: string) {
  const buildings = sub.buildings || [];
  const categories = sub.categories || [];
  const mapUrl = `${SITE_URL}/map.html`;

  // Plain-English summary of what this person signed up for
  const lines: Array<[string, string]> = [];
  if (sub.all_notifications) {
    lines.push(["You'll hear about", "Every new accessibility report on campus"]);
  } else {
    lines.push(["Buildings", buildings.length ? listForEmail(buildings) : "Any building"]);
    lines.push(["Issue types", categories.length ? listForEmail(categories) : "Any issue type"]);
  }

  const summaryRows = lines.map(([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e9ef;font-size:13px;color:#64748b;width:120px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e9ef;font-size:15px;color:#1c2023;vertical-align:top;">${escapeHtml(value)}</td>
        </tr>`).join("");

  const content = `
        <p style="margin:0 0 6px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Subscription confirmed</p>
        <h1 style="margin:0 0 14px 0;font-size:22px;line-height:1.3;color:#003F87;">You're signed up for accessibility updates</h1>
        <p style="margin:0 0 20px 0;font-size:15px;line-height:1.55;color:#1c2023;">Thanks for subscribing. We'll email <strong>${escapeHtml(sub.email)}</strong> when a new report matches what you picked:</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e9ef;margin-bottom:24px;">${summaryRows}
        </table>

        <p style="margin:0 0 24px 0;font-size:14px;line-height:1.55;color:#475569;">Tip: if our emails land in your spam or junk folder, mark this one as &ldquo;not spam&rdquo; so you don't miss urgent updates.</p>

        ${button("Open the campus map", mapUrl)}`;

  const footer = `You received this because this email address was used to subscribe to WWU AccessMap notifications. If that wasn't you, you can
        <a href="${escapeAttr(unsubscribeUrl)}" style="color:#007AC8;">unsubscribe here</a> and you won't hear from us again.`;

  const html = layout({
    preheader: "You're subscribed to WWU AccessMap accessibility updates.",
    content,
    footer,
  });

  const text = [
    "SUBSCRIPTION CONFIRMED",
    "",
    "You're signed up for accessibility updates",
    "",
    `We'll email ${sub.email} when a new report matches what you picked:`,
    "",
    ...lines.map(([label, value]) => `${label}: ${value}`),
    "",
    "Tip: if our emails land in spam or junk, mark this one as \"not spam\" so you don't miss urgent updates.",
    "",
    `Open the campus map: ${mapUrl}`,
    "",
    "---",
    "You received this because this email address was used to subscribe to WWU AccessMap notifications.",
    `If that wasn't you, unsubscribe here: ${unsubscribeUrl}`,
  ].join("\n");

  return { subject: "You're subscribed to WWU AccessMap updates", html, text };
}

// "A, B and C" -- and if the list is huge (e.g. all 57 buildings) just say how many
function listForEmail(items: string[]): string {
  if (items.length > 8) return `${items.length} selected (${items.slice(0, 5).join(", ")} and more)`;
  if (items.length <= 2) return items.join(" and ");
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
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
