// Supabase Client Setup (shared across all admin pages)
const SUPABASE_URL = "https://tdhfysffpdczdnsikvrf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yz9UL8JKWSLXCCVLOjbJEg_2gusRAA5";

// The admin session lives in sessionStorage, so signing in only lasts until this browser
// tab is closed — the same behavior the old passcode screen had, and safer on a shared
// computer. (To stay signed in across restarts instead, delete the `storage` line below.)
let _supabase = null;
try {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            storage: window.sessionStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
        }
    });
} catch (err) {
    // Usually the Supabase script didn't load (offline, or blocked by an ad/content blocker).
    // initAdminGate() below shows a message instead of leaving a blank page.
    console.error("Couldn't start Supabase:", err);
}

// -----------------------------------------------------------------------------------
// How admin access works now
//
// Admins sign in with a real Supabase account (email + password). What actually protects
// the data is NOT this page: it's the database. Row Level Security only lets an account
// that is listed in the `admins` table change reports, so even someone who copies this
// code, or calls the API directly, gets nothing without an admin login.
//
// The check in this file (is this account in `admins`?) is only there so the page can show
// the right screen. It is a convenience, not the security.
//
// To add an admin: create the account in Supabase (Authentication -> Users), then run
// 2-add-admin.sql in the SQL editor.
// -----------------------------------------------------------------------------------

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatReportDate(timestamp) {
    if (!timestamp) return "Recently submitted";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

// The sign-in form. Built here (instead of repeated in each admin page's HTML) so there's
// one place to change it. The inline styles undo the centered, wide-letter-spacing look the
// old passcode box had, which doesn't suit an email address.
const ADMIN_LOGIN_FORM_HTML = `
    <i class="fa-solid fa-lock gate-icon"></i>
    <h2>Admin Sign In</h2>
    <p>Sign in with your admin account to continue.</p>
    <form id="admin-login-form" novalidate>
        <input type="email" id="admin-email-input" class="form-control" placeholder="Email"
               aria-label="Email address" autocomplete="username"
               style="text-align: left; letter-spacing: normal;">
        <input type="password" id="admin-passcode-input" class="form-control" placeholder="Password"
               aria-label="Password" autocomplete="current-password"
               style="text-align: left; letter-spacing: normal;">
        <button type="submit" id="admin-passcode-submit" class="submit-form-btn">Sign in</button>
    </form>
    <p id="admin-gate-error" class="gate-error" role="alert"></p>
`;

// -----------------------------------------------------------------------------------
// Sign-in gate — call initAdminGate(onUnlock) from each admin page's own script.
// onUnlock runs once each time access is granted (immediately if a valid admin session
// already exists in this tab, or right after a successful sign-in), so each page can load
// its own content only once the person is actually allowed to see it.
//
// Whatever goes wrong, this always ends up showing either the sign-in form (with a message)
// or the page content — never a blank page.
// -----------------------------------------------------------------------------------

// Separate function so it can be swapped out in tests (a real reload isn't possible there)
function reloadAdminPage() {
    window.location.reload();
}

function initAdminGate(onUnlock) {
    const gate = document.getElementById("admin-gate");
    const content = document.getElementById("admin-content");
    const logoutBtn = document.getElementById("admin-logout-btn");
    const card = gate.querySelector(".gate-card");

    card.innerHTML = ADMIN_LOGIN_FORM_HTML;

    const form = document.getElementById("admin-login-form");
    const emailInput = document.getElementById("admin-email-input");
    const passwordInput = document.getElementById("admin-passcode-input");
    const submitBtn = document.getElementById("admin-passcode-submit");
    const errorMsg = document.getElementById("admin-gate-error");

    let unlocked = false;

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.classList.add("visible");
    }

    function clearError() {
        errorMsg.textContent = "";
        errorMsg.classList.remove("visible");
    }

    function setBusy(isBusy) {
        submitBtn.disabled = isBusy;
        submitBtn.textContent = isBusy ? "Signing in..." : "Sign in";
    }

    function showGate() {
        content.classList.remove("active");
        gate.classList.add("active");
    }

    // The Supabase script never loaded, so nothing below can work. Say so, plainly.
    if (!_supabase) {
        submitBtn.disabled = true;
        showError("Couldn't load the sign-in service. Check your connection, turn off any ad or content blocker for this site, and reload the page.");
        showGate();
        return;
    }

    function grantAccess() {
        if (unlocked) return; // never run the page's loader twice for one sign-in
        unlocked = true;
        gate.classList.remove("active");
        content.classList.add("active");
        onUnlock();
    }

    // Signed out (button, another tab, or an expired session) while content was showing:
    // hide it right away, then reload. The admin pages draw charts and tables when they
    // unlock and aren't built to do that twice in one page load (Chart.js refuses to draw on
    // a canvas it already used), so starting from a clean page is what makes signing back in
    // work reliably.
    function lockOut() {
        const wasUnlocked = unlocked;
        unlocked = false;
        passwordInput.value = "";
        showGate();
        if (wasUnlocked) reloadAdminPage();
    }

    // Is this signed-in account on the admin list?
    //   true  -> yes     false -> no     null -> couldn't find out (error)
    // The database only lets an account read its OWN row in `admins`, so this answers for
    // the current user and nobody else.
    async function userIsAdmin(userId) {
        try {
            const { data, error } = await _supabase
                .from("admins")
                .select("user_id")
                .eq("user_id", userId)
                .maybeSingle();

            if (error) {
                console.error("Couldn't check admin status:", error.message);
                return null;
            }
            return !!data;
        } catch (err) {
            console.error("Couldn't check admin status:", err);
            return null;
        }
    }

    const COULDNT_VERIFY = "Couldn't verify admin access right now. If you haven't run the admin setup in Supabase yet, run it first; otherwise check your connection and try again.";

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (submitBtn.disabled) return;
        clearError();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) {
            showError("Enter your email and password.");
            return;
        }

        setBusy(true);
        try {
            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
            passwordInput.value = "";

            if (error || !data || !data.session) {
                // Same message whether the email or the password was wrong, so this doesn't
                // reveal which accounts exist
                showError(error && error.status === 429
                    ? "Too many attempts. Wait a few minutes and try again."
                    : "Incorrect email or password.");
                return;
            }

            const adminStatus = await userIsAdmin(data.user.id);
            if (adminStatus !== true) {
                await _supabase.auth.signOut();
                showError(adminStatus === false ? "This account doesn't have admin access." : COULDNT_VERIFY);
                return;
            }

            emailInput.value = "";
            grantAccess();
        } catch (err) {
            console.error("Sign-in failed:", err);
            showError("Something went wrong signing in. Check your connection and try again.");
        } finally {
            setBusy(false);
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try { await _supabase.auth.signOut(); } catch (err) { console.error("Sign-out failed:", err); }
            lockOut();
        });
    }

    // Covers signing out in another tab and a session that can no longer be refreshed
    _supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") lockOut();
    });

    // On page load: already signed in as an admin in this tab? Skip the form.
    (async () => {
        try {
            const { data: { session } } = await _supabase.auth.getSession();

            if (session) {
                const adminStatus = await userIsAdmin(session.user.id);
                if (adminStatus === true) {
                    grantAccess();
                    return;
                }
                if (adminStatus === null) {
                    // Couldn't check — don't sign them out over what may be a hiccup
                    showError(COULDNT_VERIFY);
                } else {
                    await _supabase.auth.signOut();
                    showError("This account doesn't have admin access.");
                }
            }
        } catch (err) {
            console.error("Admin sign-in startup failed:", err);
            showError("Something went wrong loading the sign-in. Reload the page to try again.");
        }
        showGate();
    })();
}