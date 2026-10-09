// =====================================================================================
// Street View button: replaces Google's small yellow "pegman" with a clear, labelled button
// in the site's WWU colors (dark blue + gold).
//
// HOW IT WORKS: tap "Street View", then tap any spot on the map. The nearest Street View
// photo within ~60 m opens there. If there is none, a short message says so. Tap the button
// again (or press Esc) to cancel. The "photos may be out of date" notice
// (street-view-notice.js) still appears whenever Street View opens.
// =====================================================================================

function initStreetViewButton(map) {
    if (!map || typeof google === "undefined" || !google.maps || !google.maps.StreetViewService) return;

    const service = new google.maps.StreetViewService();
    let picking = false;
    let toastTimer = null;

    const wrap = document.createElement("div");
    wrap.style.cssText = "margin: 12px 12px 0 0; font-family: 'Fira Sans', Arial, sans-serif; text-align: right;";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Street View: tap, then tap a spot on the map");
    btn.style.cssText =
        "display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 14px 8px 10px;" +
        "border: 2px solid #FFC61E; border-radius: 999px; background: #003F87; color: #ffffff; cursor: pointer;" +
        "font-family: 'Montserrat', Arial, sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;" +
        "box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);";

    // Person-in-a-circle icon, drawn inline so it needs no extra files
    const icon = '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" focusable="false">' +
        '<circle cx="13" cy="13" r="13" fill="#FFC61E"/>' +
        '<circle cx="13" cy="8.2" r="3.2" fill="#003F87"/>' +
        '<path d="M6.8 20.5c0-4 2.6-6.6 6.2-6.6s6.2 2.6 6.2 6.6z" fill="#003F87"/></svg>';

    const label = document.createElement("span");
    label.textContent = "Street View";

    function renderIdle() {
        btn.innerHTML = icon;
        label.textContent = "Street View";
        btn.appendChild(label);
        btn.style.background = "#003F87";
        btn.style.color = "#ffffff";
        btn.setAttribute("aria-pressed", "false");
    }
    function renderPicking() {
        btn.innerHTML = icon;
        label.textContent = "Tap the map… (cancel)";
        btn.appendChild(label);
        btn.style.background = "#FFC61E";
        btn.style.color = "#003F87";
        btn.setAttribute("aria-pressed", "true");
    }
    renderIdle();

    const toast = document.createElement("div");
    toast.hidden = true;
    toast.setAttribute("role", "status");
    toast.style.cssText =
        "margin-top: 8px; padding: 8px 12px; max-width: 260px; display: inline-block; background: #ffffff; color: #1C2023;" +
        "border-left: 4px solid #FFC61E; border-radius: 8px; font-size: 13px; line-height: 1.4; text-align: left;" +
        "box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);";

    function showToast(text) {
        toast.textContent = text;
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toast.hidden = true; }, 4000);
    }

    function stopPicking() {
        picking = false;
        map.setOptions({ draggableCursor: null });
        renderIdle();
    }
    function startPicking() {
        picking = true;
        map.setOptions({ draggableCursor: "crosshair" });
        renderPicking();
        showToast("Tap anywhere on the map to look around there.");
    }

    btn.addEventListener("click", () => { picking ? stopPicking() : startPicking(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && picking) stopPicking(); });

    map.addListener("click", (e) => {
        if (!picking || !e.latLng) return;
        stopPicking();
        service.getPanorama(
            { location: e.latLng, radius: 60, source: google.maps.StreetViewSource.OUTDOOR },
            (data, status) => {
                if (status === google.maps.StreetViewStatus.OK && data && data.location) {
                    const pano = map.getStreetView();
                    pano.setPano(data.location.pano);
                    pano.setPov({ heading: 0, pitch: 0 });
                    pano.setVisible(true);
                } else {
                    showToast("No Street View photos near that spot. Try tapping closer to a road or path.");
                }
            }
        );
    });

    wrap.appendChild(btn);
    wrap.appendChild(document.createElement("br"));
    wrap.appendChild(toast);
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(wrap);
}
