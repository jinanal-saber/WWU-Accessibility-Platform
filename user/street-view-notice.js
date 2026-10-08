// =====================================================================================
// Street View notice: a small pop-up that appears every time someone opens Street View on
// the map, telling them the photos may be out of date.
//
// WHY: Street View photos are taken once and then sit there for years, so what you see can
// differ from the campus today (entrances move, paths get closed, construction starts and
// ends). For an accessibility map that matters, so the notice is shown up front.
//
// HOW: the notice is attached to the Street View panorama itself, as one of its own on-screen
// controls, so it only exists while Street View is open and needs no page layout changes.
// It comes back every time Street View is opened. "Got it" hides it until the next time.
//
// To change the wording, edit WWU_STREET_VIEW_NOTICE_TEXT below.
// =====================================================================================

const WWU_STREET_VIEW_NOTICE_TEXT =
    "Street View photos may be out of date. Campus paths, entrances and construction change over time, " +
    "so what you see here may not match what is there today. Check Recent Reports for current issues.";

function initStreetViewNotice(map) {
    // Quietly do nothing if Google Maps isn't fully available (never break the map over a notice)
    if (!map || typeof map.getStreetView !== "function") return;
    if (typeof google === "undefined" || !google.maps || !google.maps.ControlPosition) return;

    const panorama = map.getStreetView();
    if (!panorama || !panorama.controls) return;

    const position = google.maps.ControlPosition.TOP_CENTER;
    if (!panorama.controls[position]) return;

    const box = document.createElement("div");
    box.hidden = true;
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.style.cssText =
        "box-sizing: border-box; max-width: min(92vw, 400px); margin: 12px 8px 0 8px; padding: 12px 14px;" +
        "background: #ffffff; color: #1C2023; border-left: 5px solid #FFC61E; border-radius: 8px;" +
        "box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); font-family: 'Fira Sans', Arial, sans-serif;" +
        "font-size: 13px; line-height: 1.45; text-align: left;";

    const message = document.createElement("p");
    message.style.cssText = "margin: 0 0 10px 0;";

    const heading = document.createElement("strong");
    heading.textContent = "Heads up: ";
    message.appendChild(heading);
    message.appendChild(document.createTextNode(WWU_STREET_VIEW_NOTICE_TEXT));

    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.textContent = "Got it";
    dismiss.style.cssText =
        "min-height: 44px; min-width: 44px; padding: 8px 18px; border: none; border-radius: 6px;" +
        "background: #003F87; color: #ffffff; font-weight: 700; font-size: 13px; cursor: pointer;";
    dismiss.addEventListener("click", () => { box.hidden = true; });

    box.appendChild(message);
    box.appendChild(dismiss);
    panorama.controls[position].push(box);

    // Shown each time Street View opens; gone again when it closes
    panorama.addListener("visible_changed", () => {
        box.hidden = !panorama.getVisible();
    });
}
