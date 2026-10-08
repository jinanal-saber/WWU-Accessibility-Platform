// =====================================================================================
// Accessibility assistant: the chat window.
//
// Adds an "Ask Assistant" button to the site's navigation bar. It opens a chat panel that sends
// the conversation to the ai-assistant function (supabase/functions/ai-assistant), which answers
// from WWU's building pages, the campus map data, and this site's open reports.
//
// Loaded by one script tag on each page that has the navigation bar. Everything it needs
// (its own styles, its button, its panel) is created here, so no page or CSS changes are needed.
// Nothing about a conversation is saved: closing the page ends it.
// =====================================================================================
(function () {
    "use strict";

    // Public values, same ones the rest of the site already exposes in its own scripts
    const ENDPOINT = "https://tdhfysffpdczdnsikvrf.supabase.co/functions/v1/ai-assistant";
    const PUBLIC_KEY = "sb_publishable_yz9UL8JKWSLXCCVLOjbJEg_2gusRAA5";

    const MAX_QUESTION_CHARS = 500;
    const REQUEST_TIMEOUT_MS = 45000;
    const SUGGESTIONS = [
        "Which buildings have no accessible restrooms?",
        "Is Miller Hall wheelchair accessible?",
        "Are there any open elevator outages?",
        "Who do I contact about accommodations?"
    ];

    const STYLES = `
    .wwu-ai-panel { position: fixed; right: 20px; bottom: 20px; z-index: 2600; width: 390px; max-width: calc(100vw - 24px);
        height: min(620px, calc(100vh - 100px)); display: flex; flex-direction: column; background: #fff; color: #1C2023;
        border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.35); overflow: hidden; font-family: inherit; font-size: 14px; line-height: 1.45; }
    .wwu-ai-panel[hidden], .wwu-ai-panel [hidden] { display: none !important; }
    .wwu-ai-header { background: #003F87; color: #fff; padding: 12px 14px; display: flex; align-items: center; gap: 8px; }
    .wwu-ai-header h2 { margin: 0; font-size: 16px; font-weight: 700; flex: 1; color: #fff; letter-spacing: 0; text-transform: none; }
    .wwu-ai-badge { background: #FFC61E; color: #1C2023; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 10px; }
    .wwu-ai-iconbtn { background: transparent; border: 1px solid rgba(255,255,255,0.55); color: #fff; border-radius: 6px; min-height: 36px; min-width: 36px; padding: 4px 10px; font: inherit; font-size: 13px; cursor: pointer; }
    .wwu-ai-iconbtn:hover { background: rgba(255,255,255,0.18); }
    .wwu-ai-notice { background: #F4F6F8; border-bottom: 1px solid #E1E6EB; padding: 8px 14px; font-size: 12px; color: #3a4651; }
    .wwu-ai-log { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; background: #fff; }
    .wwu-ai-msg { max-width: 92%; padding: 9px 12px; border-radius: 12px; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: anywhere; }
    .wwu-ai-msg--user { align-self: flex-end; background: #007AC8; color: #fff; border-bottom-right-radius: 3px; }
    .wwu-ai-msg--bot { align-self: flex-start; background: #F4F6F8; color: #1C2023; border-bottom-left-radius: 3px; }
    .wwu-ai-msg--error { align-self: flex-start; background: #fff; color: #CC2D30; border: 1px solid #CC2D30; font-weight: 600; }
    .wwu-ai-msg--status { align-self: flex-start; background: transparent; color: #52606D; font-style: italic; padding-left: 0; }
    .wwu-ai-visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .wwu-ai-sources { margin-top: 8px; padding-top: 8px; border-top: 1px solid #d5dbe1; font-size: 12px; white-space: normal; }
    .wwu-ai-sources strong { display: block; margin-bottom: 3px; color: #3a4651; }
    .wwu-ai-sources ul { margin: 0; padding-left: 16px; }
    .wwu-ai-sources a { color: #003F87; font-weight: 600; }
    .wwu-ai-checked { margin-top: 6px; font-size: 11px; color: #52606D; white-space: normal; }
    .wwu-ai-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 8px 14px; }
    .wwu-ai-chip { background: #fff; color: #003F87; border: 1.5px solid #003F87; border-radius: 16px; padding: 6px 12px; min-height: 36px; font: inherit; font-size: 13px; cursor: pointer; text-align: left; }
    .wwu-ai-chip:hover { background: #eef4fb; }
    .wwu-ai-form { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid #E1E6EB; background: #fff; align-items: flex-end; }
    .wwu-ai-input { flex: 1; resize: none; border: 1.5px solid #8a96a3; border-radius: 8px; padding: 8px 10px; font: inherit; font-size: 14px; color: #1C2023; min-height: 44px; max-height: 110px; }
    .wwu-ai-send { background: #003F87; color: #fff; border: none; border-radius: 8px; min-height: 44px; min-width: 64px; padding: 0 14px; font: inherit; font-weight: 700; cursor: pointer; }
    .wwu-ai-send:disabled { background: #8a96a3; cursor: not-allowed; }
    .wwu-ai-privacy { padding: 0 14px 10px 14px; font-size: 11px; color: #52606D; background: #fff; }
    .wwu-ai-panel :focus-visible, .wwu-ai-launcher:focus-visible { outline: 3px solid #FFC61E; outline-offset: 2px; }
    .wwu-ai-input:focus-visible { outline: 3px solid #007AC8; }
    .wwu-ai-launcher--floating { position: fixed; right: 20px; bottom: 20px; z-index: 2500; background: #003F87; color: #fff; border: none; border-radius: 28px; padding: 12px 18px; min-height: 48px; font: inherit; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.35); }
    @media (max-width: 640px) {
        .wwu-ai-panel { inset: 0; right: 0; bottom: 0; width: 100%; max-width: 100%; height: 100%; height: 100dvh; border-radius: 0; }
    }`;

    function el(tag, attrs, children) {
        const node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(k => {
            if (k === "class") node.className = attrs[k];
            else if (k === "text") node.textContent = attrs[k];
            else node.setAttribute(k, attrs[k]);
        });
        (children || []).forEach(c => node.appendChild(c));
        return node;
    }

    // Only ever show a link that points at a WWU website
    function safeWwuUrl(value) {
        try {
            const u = new URL(String(value));
            const ok = u.protocol === "https:" && (u.hostname === "wwu.edu" || u.hostname.endsWith(".wwu.edu"));
            return ok ? u.href : null;
        } catch (e) { return null; }
    }

    function init() {
        if (document.getElementById("wwu-ai-panel")) return; // never build it twice

        const style = el("style", { id: "wwu-ai-styles" });
        style.textContent = STYLES;
        document.head.appendChild(style);

        // ---------- the panel ----------
        const title = el("h2", { id: "wwu-ai-title", text: "Accessibility Assistant" });
        const newChatBtn = el("button", { type: "button", class: "wwu-ai-iconbtn", text: "New chat" });
        const closeBtn = el("button", { type: "button", class: "wwu-ai-iconbtn", "aria-label": "Close assistant", text: "\u00D7" });
        closeBtn.style.fontSize = "20px";
        const header = el("div", { class: "wwu-ai-header" }, [title, el("span", { class: "wwu-ai-badge", text: "AI" }), newChatBtn, closeBtn]);

        const notice = el("div", { class: "wwu-ai-notice", text:
            "I'm an AI. I answer from WWU's building pages, WWU's campus map data and reports on this site, and I can be wrong or out of date. " +
            "For accommodations or anything important, contact WWU's Disability Access Center. In an emergency, call 911." });

        const log = el("div", { class: "wwu-ai-log", id: "wwu-ai-log", role: "log", "aria-live": "polite", "aria-relevant": "additions", "aria-label": "Conversation" });
        const chips = el("div", { class: "wwu-ai-chips", role: "group", "aria-label": "Suggested questions" });

        const input = el("textarea", { class: "wwu-ai-input", id: "wwu-ai-input", rows: "2", maxlength: String(MAX_QUESTION_CHARS), "aria-label": "Your question", placeholder: "Ask about campus accessibility..." });
        const sendBtn = el("button", { type: "submit", class: "wwu-ai-send", text: "Send" });
        const form = el("form", { class: "wwu-ai-form" }, [input, sendBtn]);
        const privacy = el("div", { class: "wwu-ai-privacy", text: "Questions are sent to an AI service (OpenAI) to write answers. Please don't include personal information." });

        const panel = el("div", { class: "wwu-ai-panel", id: "wwu-ai-panel", role: "dialog", "aria-labelledby": "wwu-ai-title" }, [header, notice, log, chips, form, privacy]);
        panel.hidden = true;
        document.body.appendChild(panel);

        // ---------- the button that opens it ----------
        const nav = document.getElementById("nav-left");
        let launcher;
        if (nav) {
            // Lives in the navigation bar (and inside the phone menu), styled by the site's own .nav-btn
            launcher = el("button", { type: "button", class: "nav-btn", id: "wwu-ai-launcher", "aria-haspopup": "dialog", "aria-expanded": "false", "aria-controls": "wwu-ai-panel" });
            launcher.appendChild(el("i", { class: "fa-solid fa-comments", "aria-hidden": "true" }));
            launcher.appendChild(document.createTextNode(" Ask Assistant"));
            nav.appendChild(launcher);
        } else {
            launcher = el("button", { type: "button", class: "wwu-ai-launcher--floating", id: "wwu-ai-launcher", "aria-haspopup": "dialog", "aria-expanded": "false", "aria-controls": "wwu-ai-panel", text: "Ask Assistant" });
            document.body.appendChild(launcher);
        }

        // ---------- state ----------
        let history = [];   // what the function is sent: { role, content }
        let busy = false;
        let statusNode = null;

        const scrollDown = () => { log.scrollTop = log.scrollHeight; };

        function addMessage(kind, text, extra) {
            const who = kind === "user" ? "You said: " : (kind === "bot" ? "Assistant said: " : "");
            const node = el("div", { class: "wwu-ai-msg wwu-ai-msg--" + kind });
            if (who) node.appendChild(el("span", { class: "wwu-ai-visually-hidden", text: who }));
            node.appendChild(document.createTextNode(text)); // text only: nothing the model or the user types is ever treated as HTML
            if (extra) extra(node);
            log.appendChild(node);
            scrollDown();
            return node;
        }

        function addSources(node, sources, checked) {
            const links = (Array.isArray(sources) ? sources : [])
                .map(s => ({ label: String((s && s.label) || "WWU page").slice(0, 120), url: safeWwuUrl(s && s.url) }))
                .filter(s => s.url);
            if (links.length) {
                const list = el("ul");
                links.forEach(s => list.appendChild(el("li", {}, [el("a", { href: s.url, target: "_blank", rel: "noopener noreferrer", text: s.label })])));
                node.appendChild(el("div", { class: "wwu-ai-sources" }, [el("strong", { text: "Official WWU links" }), list]));
            }
            if (checked) node.appendChild(el("div", { class: "wwu-ai-checked", text: "Building information from WWU's pages, checked " + String(checked).slice(0, 40) + ". Not live." }));
        }

        function showWelcome() {
            addMessage("bot", "Hi! Ask me about accessible entrances, elevators, restrooms, parking, or any current reports for a WWU building. I can also point you to WWU's accessibility resources.");
            chips.hidden = false;
            chips.textContent = "";
            SUGGESTIONS.forEach(text => {
                const chip = el("button", { type: "button", class: "wwu-ai-chip", text });
                chip.addEventListener("click", () => send(text));
                chips.appendChild(chip);
            });
        }

        function setBusy(value) {
            busy = value;
            sendBtn.disabled = value;
            log.setAttribute("aria-busy", value ? "true" : "false");
        }

        function friendlyError(status, body) {
            if (body && typeof body.error === "string" && body.error.length < 300) return body.error;
            if (status === 429) return "Too many questions right now. Please try again in a little while.";
            return "The assistant couldn't answer that right now. Please try again in a moment.";
        }

        async function send(rawText) {
            const text = String(rawText || "").replace(/\s+/g, " ").trim().slice(0, MAX_QUESTION_CHARS);
            if (!text || busy) return;          // busy is set before anything async: a double-click can never send twice
            setBusy(true);

            chips.hidden = true;
            addMessage("user", text);
            history.push({ role: "user", content: text });
            input.value = "";
            statusNode = addMessage("status", "Assistant is thinking...");

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            try {
                const response = await fetch(ENDPOINT, {
                    method: "POST",
                    signal: controller.signal,
                    headers: { "content-type": "application/json", apikey: PUBLIC_KEY, Authorization: "Bearer " + PUBLIC_KEY },
                    body: JSON.stringify({ messages: history.slice(-10) })
                });
                let body = null;
                try { body = await response.json(); } catch (e) { body = null; }

                statusNode.remove(); statusNode = null;
                if (response.ok && body && typeof body.answer === "string" && body.answer.trim()) {
                    addMessage("bot", body.answer, node => addSources(node, body.sources, body.checked));
                    history.push({ role: "assistant", content: body.answer.slice(0, 1000) });
                } else {
                    console.warn("Assistant request failed:", response.status, body);
                    addMessage("error", friendlyError(response.status, body));
                    history.pop(); // the question didn't get answered, so don't carry it into the next request
                }
            } catch (err) {
                if (statusNode) { statusNode.remove(); statusNode = null; }
                addMessage("error", err && err.name === "AbortError"
                    ? "That took too long. Please try again."
                    : "Couldn't reach the assistant. Check your connection and try again.");
                history.pop();
            } finally {
                clearTimeout(timer);
                setBusy(false);
                input.focus();
            }
        }

        function resetChat() {
            history = [];
            log.textContent = "";
            showWelcome();
            input.value = "";
        }

        // ---------- opening and closing ----------
        function isOpen() { return !panel.hidden; }

        function openPanel() {
            // On phones the nav links live in a dropdown: close it so it isn't left open behind the chat
            if (nav && nav.classList.contains("open")) {
                nav.classList.remove("open");
                const toggle = document.getElementById("mobile-menu-toggle");
                if (toggle) toggle.setAttribute("aria-expanded", "false");
            }
            panel.hidden = false;
            launcher.setAttribute("aria-expanded", "true");
            input.focus();
        }

        function closePanel() {
            panel.hidden = true;
            launcher.setAttribute("aria-expanded", "false");
            launcher.focus();
        }

        launcher.addEventListener("click", () => (isOpen() ? closePanel() : openPanel()));
        closeBtn.addEventListener("click", closePanel);
        newChatBtn.addEventListener("click", () => { if (!busy) { resetChat(); input.focus(); } });

        form.addEventListener("submit", event => { event.preventDefault(); send(input.value); });
        input.addEventListener("keydown", event => {
            // Enter sends; Shift+Enter makes a new line; ignore Enter that confirms text from an on-screen/IME keyboard
            if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); send(input.value); }
        });

        document.addEventListener("keydown", event => {
            if (!isOpen()) return;
            if (event.key === "Escape") { closePanel(); return; }
            // On a phone the chat covers the whole screen, so keep Tab inside it
            if (event.key === "Tab" && window.matchMedia && window.matchMedia("(max-width: 640px)").matches) {
                const focusable = Array.from(panel.querySelectorAll("button, textarea, a[href]")).filter(n => !n.disabled && !n.closest("[hidden]"));
                if (!focusable.length) return;
                const first = focusable[0], last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        });

        showWelcome();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
