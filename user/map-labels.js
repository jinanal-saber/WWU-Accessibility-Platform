// =====================================================================================
// Map labels: the building names and street names drawn on the map.
//
// The map uses plain satellite imagery, which has no text of its own, so EVERY word you
// see on the map comes from the two lists below. Edit them freely:
//
//   name     the text shown
//   lat/lng  where it sits (buildings: roughly the middle of the building)
//   minZoom  (optional) how far in you must zoom before it appears. Higher = closer in.
//            Buildings default to 16, streets to 17. Google's zoom runs 15 to about 20.
//   angle    (streets only) rotation in degrees, so the name follows the street
//
// HOW THE LOOK IS SET: fonts, colors, sizes and the outline around the letters are all in
// map-labels.css, in the block at the top marked "Label design".
//
// NEED COORDINATES FOR A STREET OR ANOTHER BUILDING?  Open the map page with ?labelhelper=1
// on the end of the address (for example map.html?labelhelper=1). Click the map and it
// writes the exact line to paste into these lists.
// =====================================================================================

// Buildings. These are the 22 with verified locations; other buildings can be added once
// their positions are known (use the label helper above).
const BUILDING_LABELS = [
    { name: "Nash Hall", lat: 48.740255, lng: -122.483773 },
    { name: "Mathes Hall", lat: 48.739946, lng: -122.484704 },
    { name: "Edens Hall", lat: 48.739214, lng: -122.483600 },
    { name: "Viking Union", lat: 48.738964, lng: -122.486243 },
    { name: "Performing Arts Center", lat: 48.738073, lng: -122.487228 },
    { name: "Wilson Library", lat: 48.737771, lng: -122.485770 },
    { name: "Humanities Building", lat: 48.737351, lng: -122.485008, minZoom: 17 },
    { name: "Fraser Hall", lat: 48.737090, lng: -122.484666, minZoom: 17 },
    { name: "Bond Hall", lat: 48.736608, lng: -122.485979 },
    { name: "Miller Hall", lat: 48.736584, lng: -122.484717, minZoom: 17 },
    { name: "Carver Gymnasium", lat: 48.735951, lng: -122.486475 },
    { name: "Alma Clark Glass Hall", lat: 48.735566, lng: -122.488917 },
    { name: "Ross Engineering Technology", lat: 48.734570, lng: -122.485557, minZoom: 17 },
    { name: "Arntzen Hall", lat: 48.733994, lng: -122.485463, minZoom: 17 },
    { name: "Biology", lat: 48.733942, lng: -122.486994, minZoom: 17 },
    { name: "Parks Hall", lat: 48.733498, lng: -122.486560, minZoom: 17 },
    { name: "Environmental Studies", lat: 48.733360, lng: -122.485862, minZoom: 17 },
    { name: "Communications Facility", lat: 48.732794, lng: -122.485228 },
    { name: "Academic Instructional West", lat: 48.732063, lng: -122.486622 },
    { name: "Fairhaven College", lat: 48.730328, lng: -122.485730 },
    { name: "Fairhaven Complex", lat: 48.729276, lng: -122.485604 },
    { name: "Buchanan Towers", lat: 48.726803, lng: -122.486827 },
];

// Streets. Empty for now: I don't have verified street positions to place these accurately.
// Use the label helper to get each line, then paste it in here. Example:
//   { name: "High Street", lat: 48.7385, lng: -122.4850, angle: -38 },
const STREET_LABELS = [
];

const LABEL_DEFAULT_MIN_ZOOM = { building: 16, street: 17 };

// Labels grow slightly as you zoom in. Numbers are multiplied by the font sizes in the CSS.
function labelScaleForZoom(zoom) {
    if (zoom <= 16) return 0.92;
    if (zoom === 17) return 1;
    if (zoom === 18) return 1.15;
    return 1.3;
}

// Draws every label on the map. Call once, after the map exists.
function initMapLabels(map) {
    if (typeof google === "undefined" || !google.maps || !google.maps.OverlayView) {
        console.warn("Google Maps not ready — map labels skipped.");
        return;
    }

    // A label is a small piece of HTML that Google keeps pinned to a map position.
    // (Defined here rather than at the top of the file because it builds on a Google
    // class that only exists after the Maps script has loaded.)
    class MapTextLabel extends google.maps.OverlayView {
        constructor(entry, kind) {
            super();
            this.entry = entry;
            this.kind = kind;
            this.position = new google.maps.LatLng(entry.lat, entry.lng);
            this.minZoom = (entry.minZoom !== undefined) ? entry.minZoom : LABEL_DEFAULT_MIN_ZOOM[kind];
            this.el = null;
            this.setMap(map);
        }

        onAdd() {
            this.el = document.createElement("div");
            this.el.className = "map-label map-label--" + this.kind;
            this.el.textContent = this.entry.name;
            // Screen readers get building names from the markers and the sidebar, so these
            // purely visual labels are hidden from them to avoid reading everything twice
            this.el.setAttribute("aria-hidden", "true");
            if (this.entry.angle) this.el.style.setProperty("--label-angle", this.entry.angle + "deg");
            this.getPanes().overlayLayer.appendChild(this.el);
            this.applyZoom(map.getZoom());
        }

        draw() {
            if (!this.el) return;
            const point = this.getProjection().fromLatLngToDivPixel(this.position);
            if (!point) return;
            this.el.style.left = point.x + "px";
            this.el.style.top = point.y + "px";
        }

        onRemove() {
            if (this.el) { this.el.remove(); this.el = null; }
        }

        applyZoom(zoom) {
            if (this.el) this.el.style.display = (zoom >= this.minZoom) ? "" : "none";
        }
    }

    const labels = [];
    BUILDING_LABELS.forEach(entry => labels.push(new MapTextLabel(entry, "building")));
    STREET_LABELS.forEach(entry => labels.push(new MapTextLabel(entry, "street")));

    const updateForZoom = () => {
        const zoom = map.getZoom();
        document.documentElement.style.setProperty("--label-zoom-scale", labelScaleForZoom(zoom));
        labels.forEach(label => label.applyZoom(zoom));
    };
    map.addListener("zoom_changed", updateForZoom);
    updateForZoom();

    if (new URLSearchParams(window.location.search).has("labelhelper")) {
        startLabelHelper(map);
    }
}

// -------------------------------------------------------------------------------------
// Label helper (only active when the page address ends in ?labelhelper=1)
// Click the map to get a ready-to-paste line for BUILDING_LABELS or STREET_LABELS.
//   - one click            -> a building line for that spot
//   - two clicks in a row  -> a street line, centered between the clicks and angled to
//                             follow the direction from the first click to the second
// -------------------------------------------------------------------------------------
function startLabelHelper(map) {
    const wrapper = document.querySelector(".map-wrapper");
    if (!wrapper) return;

    const panel = document.createElement("div");
    panel.className = "label-helper";
    panel.innerHTML =
        "<strong>Label helper</strong>" +
        "<p>Building: click its middle.<br>Street: click one end of it, then the other end.</p>" +
        '<textarea readonly rows="3" aria-label="Line to paste into map-labels.js"></textarea>' +
        '<button type="button">Copy line</button>';
    wrapper.appendChild(panel);

    const box = panel.querySelector("textarea");
    const copyButton = panel.querySelector("button");
    let firstClick = null;

    copyButton.addEventListener("click", () => {
        box.select();
        if (navigator.clipboard) navigator.clipboard.writeText(box.value);
        copyButton.textContent = "Copied!";
        setTimeout(() => { copyButton.textContent = "Copy line"; }, 1200);
    });

    const round = (n, places) => Number(n.toFixed(places));

    map.addListener("click", event => {
        const here = event.latLng;

        if (!firstClick) {
            firstClick = here;
            box.value = `{ name: "NAME", lat: ${round(here.lat(), 6)}, lng: ${round(here.lng(), 6)} },\n\n` +
                        "(building line. To make a street line instead, click the street's other end now.)";
            return;
        }

        const projection = map.getProjection();
        const a = projection.fromLatLngToPoint(firstClick);
        const b = projection.fromLatLngToPoint(here);
        let angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
        // keep text right-side-up: rotate to within -90 to 90 degrees
        if (angle > 90) angle -= 180;
        if (angle < -90) angle += 180;

        const midLat = (firstClick.lat() + here.lat()) / 2;
        const midLng = (firstClick.lng() + here.lng()) / 2;
        box.value = `{ name: "STREET NAME", lat: ${round(midLat, 6)}, lng: ${round(midLng, 6)}, angle: ${round(angle, 0)} },`;
        firstClick = null;
    });
}
