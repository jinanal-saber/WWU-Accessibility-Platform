// Supabase Client Setup
const SUPABASE_URL = "https://tdhfysffpdczdnsikvrf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yz9UL8JKWSLXCCVLOjbJEg_2gusRAA5";
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Campus Center & Radius Configuration
const WWU_CAMPUS_CENTER = { lat: 48.734288, lng: -122.486610 }; // verified: WWU's official Google Places listing
const MAX_CAMPUS_RADIUS_METERS = 1250; // widened from 750: WWU data includes real campus points out to ~1.1 km

// How far past the visible circle the pannable viewport is allowed to go (rectangular restriction, so give it a bit of breathing room past the circle edge)
const VIEWPORT_PADDING_METERS = 150;

// Helper: build a rectangular LatLngBounds around a center point, offset by the given radius in meters.
// (Google's `restriction` option only accepts a rectangle, not a circle, so this is used alongside the circular mask.)
function buildRestrictionBounds(center, radiusMeters) {
    const metersPerDegreeLat = 111320;
    const latOffset = radiusMeters / metersPerDegreeLat;
    const lngOffset = radiusMeters / (metersPerDegreeLat * Math.cos(center.lat * Math.PI / 180));

    return {
        north: center.lat + latOffset,
        south: center.lat - latOffset,
        east: center.lng + lngOffset,
        west: center.lng - lngOffset
    };
}

// Report categories (kept in sync with Report.html's #form-category options)
const REPORT_CATEGORIES = [
    "Elevator/Lift Outage",
    "Automatic Door Fault",
    "Ramp / Walkway Barrier",
    "Construction Obstruction",
    "Restroom Access Issue",
    "Snow / Ice Hazard",
    "Other Accessibility Issue"
];

let mainMapInstance;
let campusMaskPolygon = null;

// -----------------------------------------------------------------------------------
// Accessibility feature points (entrances, parking, elevators, accessible restrooms,
// and accessible-route points), shown as toggleable map layers.
//
// The data itself lives in accessibility-data.js (ACCESSIBILITY_FEATURES) — generated
// from WWU's own campus map export rather than typed by hand here.
// -----------------------------------------------------------------------------------
const LAYER_ICON_CONFIG = {
    accessible_entrance: { color: "#6D3FB2", label: "Accessible entrance" },
    accessible_parking: { color: "#1E63C8", label: "Accessible parking" },
    elevator: { color: "#1C2023", label: "Elevator" },
    accessible_restroom: { color: "#1C2023", label: "Accessible restroom" },
    ada_route: { color: "#003F87", label: "Accessible route" },
    functional_route: { color: "#F97316", label: "Functionally accessible route" }
};

// WWU's export has ONE point per route, not the full path, so these are drawn smaller
// and labeled as a single point along the route
const ROUTE_LAYER_TYPES = ["ada_route", "functional_route"];

let accessibilityMarkers = []; // { marker, type } for every rendered feature, so toggles can show/hide them
let layerCheckboxes = {};    // layer type -> its sidebar checkbox
let openReportsForFlagging = []; // filled by loadCampusReports(); used to flag elevator/restroom markers

// -----------------------------------------------------------------------------------
// Building locations + ADA info for the main map's building markers. Duplicated (in
// trimmed form — center + ada only, no room lists) from make_report.js's
// WWU_BUILDINGS_DATA, which is the canonical source. Keep both in sync if you edit
// building info or add real coordinates for a currently-unverified building.
// -----------------------------------------------------------------------------------
const WWU_BUILDINGS_FOR_MAP = {
    "Nash Hall (NA)": { center: { lat: 48.74006, lng: -122.483808 }, ada: null },
    "Mathes Hall (MA)": { center: { lat: 48.739887, lng: -122.484787 }, ada: null },
    "Higginson Hall (HG)": { center: { lat: 48.739777, lng: -122.483345 }, ada: null },
    "Viking Commons (VC)": { center: { lat: 48.739338, lng: -122.485016 }, ada: null },
    "Edens Hall (EH)": { center: { lat: 48.739283, lng: -122.483528 }, ada: null },
    "Viking Union (VU)": { center: { lat: 48.739, lng: -122.486035 }, ada: { elevators: "Yes", autoDoors: "Yes (button-activated, southeast & northwest sides near Garden St)", restrooms: "ADA accessible & all-gender restrooms on 3rd & 7th floors", ramps: "Yes" } },
    "Old Main (OM)": { center: { lat: 48.738002, lng: -122.48444 }, ada: null },
    "Performing Arts Center (PA)": { center: { lat: 48.737958, lng: -122.487223 }, ada: null },
    "Wilson Library (WL)": { center: { lat: 48.73775, lng: -122.485788 }, ada: { elevators: "Yes (Access to Haggard Skybridge)", autoDoors: "Yes (Red Square Main Entry)", restrooms: "Accessible Multi-Stall & Single-Stall", ramps: "Red Square Level Access" } },
    "Canada House (CA)": { center: { lat: 48.737732, lng: -122.487808 }, ada: null },
    "High Street Hall (HS)": { center: { lat: 48.737513, lng: -122.487584 }, ada: null },
    "Humanities Building (HU)": { center: { lat: 48.737377, lng: -122.48494 }, ada: null },
    "Haggard Hall (HH)": { center: { lat: 48.737354, lng: -122.486381 }, ada: null },
    "Fraser Hall (FR)": { center: { lat: 48.73703, lng: -122.484385 }, ada: null },
    "College Hall (CH)": { center: { lat: 48.737011, lng: -122.486872 }, ada: null },
    "Alma Clark Glass Hall (CG)": { center: { lat: 48.736496, lng: -122.488152 }, ada: null },
    "Bond Hall (BH)": { center: { lat: 48.73648, lng: -122.485756 }, ada: null },
    "Miller Hall (MH)": { center: { lat: 48.736175, lng: -122.484806 }, ada: { elevators: "Yes (Central Elevator)", autoDoors: "Yes (Red Square Entrance)", restrooms: "Accessible Restrooms (Ground Floor)", ramps: "Slight Slope via Red Square" } },
    "Carver (CV)": { center: { lat: 48.735758, lng: -122.486344 }, ada: { elevators: "Yes (Access to all gym floors)", autoDoors: "Yes (Main West Plaza Entrance)", restrooms: "Accessible Locker Rooms & Restrooms", ramps: "Wide External Access Ramps" } },
    "Art Annex (AA)": { center: { lat: 48.735733, lng: -122.485184 }, ada: null },
    "Fine Arts (FI)": { center: { lat: 48.735364, lng: -122.485298 }, ada: null },
    "SMATE / Science Lecture (SL)": { center: { lat: 48.735212, lng: -122.487157 }, ada: null },
    "Ridgeway Commons (RC)": { center: { lat: 48.734981, lng: -122.489268 }, ada: null },
    "Ross Engineering Technology (ET)": { center: { lat: 48.734913, lng: -122.485779 }, ada: null },
    "Morse Hall / Chemistry Building (CB)": { center: { lat: 48.734618, lng: -122.486611 }, ada: null },
    "Biology (BI)": { center: { lat: 48.734066, lng: -122.486794 }, ada: null },
    "Arntzen Hall (AH)": { center: { lat: 48.733856, lng: -122.485703 }, ada: { elevators: "Yes (Central)", autoDoors: "Yes (East Entrance)", restrooms: "Accessible Restrooms (Floor 1)", ramps: "East Side Ramp Access" } },
    "Parks Hall (PH)": { center: { lat: 48.733589, lng: -122.486691 }, ada: { elevators: "Yes", autoDoors: "Yes (South Entrance)", restrooms: "Accessible Restrooms (Ground & 2nd)", ramps: "South Courtyard Ramp" } },
    "Environmental Studies (ES)": { center: { lat: 48.733439, lng: -122.485403 }, ada: null },
    "Communications Facility (CF)": { center: { lat: 48.732744, lng: -122.485176 }, ada: { elevators: "Yes (North & South Towers)", autoDoors: "Yes (East & West Main Entrances)", restrooms: "Accessible Gender-Neutral (1st & 2nd Floor)", ramps: "Level Plaza Access" } },
    "Academic Instructional Center (AI)": { center: { lat: 48.732037, lng: -122.486071 }, ada: null },
    "Wade King Recreation Center (SV)": { center: { lat: 48.731758, lng: -122.489037 }, ada: null },
    "Administrative Services Center (AC)": { center: { lat: 48.731018, lng: -122.474022 }, ada: null },
    "Fairhaven Academic Building / Fairhaven College (FA)": { center: { lat: 48.730045, lng: -122.485947 }, ada: null },
    "Fairhaven Complex (FX)": { center: { lat: 48.728935, lng: -122.485748 }, ada: null },
    "Campus Services (CS)": { center: { lat: 48.727826, lng: -122.48982 }, ada: null },
    "Commissary (CM)": { center: { lat: 48.72717, lng: -122.484674 }, ada: null },
    "Buchanan Towers (BT)": { center: { lat: 48.726768, lng: -122.486631 }, ada: null },
    "Archives Building (AB)": { center: { lat: 48.726013, lng: -122.485695 }, ada: null },
    "Physical Plant (PP)": { center: { lat: 48.724656, lng: -122.483681 }, ada: null },
    "Academic Instructional West (AW)": { center: { lat: 48.732063, lng: -122.486622 }, ada: { elevators: "Yes (Main Lobby)", autoDoors: "Yes (Push Button All Main Entrances)", restrooms: "All-Gender Accessible Restrooms", ramps: "Fully Integrated Ramp Network" } }, // kept: hand-documented ADA info, but no WWU data point to confirm its position
};

let buildingMarkers = [];


// Holds { report, marker, infoWindow, cardEl } for every loaded report so we can filter both the map and the feed together
let loadedReportEntries = [];

// Helper: Escape user-submitted text before inserting into innerHTML (prevents stored XSS from report titles/descriptions/building names)
function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Helper: Format ISO timestamp to readable date string (e.g., "Aug 13, 2026, 2:30 PM")
function formatReportDate(timestamp) {
    if (!timestamp) return "Recently submitted";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

// Helper: Generates array of LatLng points forming a circle for off-campus mask
function generateCirclePoints(center, radiusMeters, numPoints = 64) {
    const points = [];
    const latRad = center.lat * Math.PI / 180;
    const lngRad = center.lng * Math.PI / 180;
    const dRad = radiusMeters / 6371000;

    for (let i = 0; i < numPoints; i++) {
        const angle = (i * 360 / numPoints) * Math.PI / 180;
        const pointLatRad = Math.asin(
            Math.sin(latRad) * Math.cos(dRad) +
            Math.cos(latRad) * Math.sin(dRad) * Math.cos(angle)
        );
        const pointLngRad = lngRad + Math.atan2(
            Math.sin(angle) * Math.sin(dRad) * Math.cos(latRad),
            Math.cos(dRad) - Math.sin(latRad) * Math.sin(pointLatRad)
        );
        points.push({ lat: pointLatRad * 180 / Math.PI, lng: pointLngRad * 180 / Math.PI });
    }
    return points;
}

// Main Google Maps Initialization (Called by Google Maps API script tag callback)
async function initMap() {
    const restrictionBounds = buildRestrictionBounds(
        WWU_CAMPUS_CENTER,
        MAX_CAMPUS_RADIUS_METERS + VIEWPORT_PADDING_METERS
    );

    mainMapInstance = new google.maps.Map(document.getElementById("map"), {
        zoom: 16,
        minZoom: 15,
        center: WWU_CAMPUS_CENTER,
        disableDefaultUI: false,
        gestureHandling: "greedy", // one finger pans the map on phones (the default needs two when the page can scroll)
        mapTypeId: google.maps.MapTypeId.SATELLITE, // plain satellite photo: has no text of its own (all labels come from map-labels.js)
        streetViewControl: false, // Google's tiny pegman is replaced by the labelled button in street-view-button.js
        mapTypeControl: false, // no Map/Satellite switcher, so Google's own labels can't be turned back on
        tilt: 0,               // always top-down imagery (45-degree views would shift markers off their buildings)
        restriction: {
            latLngBounds: restrictionBounds,
            strictBounds: true
        }
    });
 

    // Fetch and display active reports
    await loadCampusReports();

    renderBuildingMarkers();
    renderAccessibilityFeatures();
    if (typeof initMapLabels === "function") initMapLabels(mainMapInstance);
    // Warns that Street View photos may be out of date whenever Street View is opened
    // (street-view-notice.js; skipped quietly if that file is missing)
    if (typeof initStreetViewNotice === "function") initStreetViewNotice(mainMapInstance);
    if (typeof initStreetViewButton === "function") initStreetViewButton(mainMapInstance);
    wireUpLayerToggles();
    populateFilterDropdowns(); // fills the Category / Severity lists (this call was missing, so the filters had nothing to pick)
    wireUpSearchAndFilters();
}

// Places a marker for every entry in ACCESSIBILITY_FEATURES (defined in accessibility-data.js).
// Marker artwork lives in map-icons.js. Markers are created hidden; refreshFeatureVisibility()
// decides which ones show, based on the layer checkboxes and the current zoom level.
function renderAccessibilityFeatures() {
    const features = (typeof ACCESSIBILITY_FEATURES !== "undefined") ? ACCESSIBILITY_FEATURES : [];
    if (features.length === 0) {
        console.warn("No accessibility features loaded — is accessibility-data.js included before map.js?");
    }

    layerCheckboxes = {};
    document.querySelectorAll(".layer-checkbox").forEach(cb => {
        layerCheckboxes[cb.getAttribute("data-layer-type")] = cb;
    });

    const haveArtwork = (typeof getFeatureIcon === "function");

    // One shared popup, so opening a new one closes the previous one
    const featureInfoWindow = new google.maps.InfoWindow();

    features.forEach(feature => {
        const config = LAYER_ICON_CONFIG[feature.type];
        if (!config) {
            console.warn(`Unknown accessibility feature type "${feature.type}" — skipping.`);
            return;
        }

        const isRoute = ROUTE_LAYER_TYPES.includes(feature.type);

        // Routes are drawn as small dots; everything else uses the pin/badge artwork
        let icon = haveArtwork && !isRoute ? getFeatureIcon(feature.type, false) : null;
        if (!icon) {
            icon = {
                path: google.maps.SymbolPath.CIRCLE,
                scale: isRoute ? 5 : 7,
                fillColor: config.color,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 1.5
            };
        }

        const marker = new google.maps.Marker({
            position: { lat: feature.lat, lng: feature.lng },
            map: null,
            title: feature.title,
            icon: icon,
            zIndex: isRoute ? 10 : 100
        });

        // Created now (not after addListener) so the click handler below can read
        // entry.flagSeverity — applyOpenReportFlags() fills that in later, but by the time
        // anyone actually clicks the marker it's already set, since it's the same object.
        const entry = { marker, type: feature.type, isRoute, large: false, severityColor: null, flagSeverity: null };

        marker.addListener("click", () => {
            const buildingLine = feature.building
                ? `<div style="font-size: 12px; color: #475569; margin-bottom: 4px;">${escapeHtml(feature.building)}</div>`
                : "";
            const descriptionLine = feature.description
                ? `<p style="margin: 0; font-size: 12px; color: #334155; line-height: 1.4;">${escapeHtml(feature.description)}</p>`
                : "";
            const routeNote = isRoute
                ? `<p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b; font-style: italic;">This marks one point along the route — the full path isn't in the data yet.</p>`
                : "";
            const flagNote = entry.flagSeverity
                ? `<p style="margin: 8px 0 0 0; padding: 6px 8px; border-radius: 6px; background: ${SEVERITY_RING_COLORS[entry.flagSeverity]}22; border-left: 3px solid ${SEVERITY_RING_COLORS[entry.flagSeverity]}; font-size: 11px; color: #334155;">\u26A0\uFE0F There\u2019s an open report affecting this building — check Recent Reports for details.</p>`
                : "";

            featureInfoWindow.setContent(`
                <div style="font-family: sans-serif; padding: 4px; max-width: 240px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #475569;">
                        <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${config.color}; margin-right: 6px;"></span>${escapeHtml(config.label)}
                    </div>
                    <h4 style="margin: 4px 0; font-size: 14px; color: #0f172a;">${escapeHtml(feature.title)}</h4>
                    ${buildingLine}
                    ${descriptionLine}
                    ${routeNote}${flagNote}\n                </div>
            `);
            featureInfoWindow.open({ anchor: marker, map: mainMapInstance });
        });

        accessibilityMarkers.push(entry);
    });

    const sourceNote = document.getElementById("layers-source-note");
    if (sourceNote && typeof ACCESSIBILITY_DATA_SOURCE !== "undefined") {
        sourceNote.textContent = `Zoom in to see these on the map. Source: ${ACCESSIBILITY_DATA_SOURCE}. Route layers show one point per route; full paths aren't available yet.`;
    }

    createZoomHint();
    applyOpenReportFlags();
    mainMapInstance.addListener("zoom_changed", refreshFeatureVisibility);
    refreshFeatureVisibility();
}

// Maps a report's category to the feature-layer type it should flag. Only categories with
// a clean 1:1 match to a feature layer are included — see the conversation in the project
// notes for why "Ramp / Walkway Barrier", "Construction Obstruction" etc. aren't here yet
// (no matching feature layer exists for them).
const REPORT_CATEGORY_TO_FEATURE_TYPE = {
    "Elevator/Lift Outage": "elevator",
    "Restroom Access Issue": "accessible_restroom"
};

// Strips the "(XX)" building-code suffix report forms use, e.g. "Miller Hall (MH)" -> "Miller Hall"
function bareBuildingName(reportBuildingValue) {
    return (reportBuildingValue || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
}

// Colors elevator/accessible-restroom markers by the worst open report affecting that
// building, so e.g. a broken elevator in Miller Hall turns every elevator marker in Miller
// Hall red — building-level, not exact-marker, since reports only capture which building an
// issue is in, not which specific elevator or restroom.
function applyOpenReportFlags() {
    const severityRank = { critical: 3, medium: 2, low: 1 };

    // building name (lowercase) -> feature type -> worst severity found
    const worstByBuildingAndType = {};
    openReportsForFlagging.forEach(report => {
        const featureType = REPORT_CATEGORY_TO_FEATURE_TYPE[report.category];
        if (!featureType) return;
        const building = bareBuildingName(report.building).toLowerCase();
        if (!building) return;

        const severity = (report.severity || "medium").toLowerCase();
        const key = building + "|" + featureType;
        const existing = worstByBuildingAndType[key];
        if (!existing || severityRank[severity] > severityRank[existing]) {
            worstByBuildingAndType[key] = severity;
        }
    });

    accessibilityMarkers.forEach(entry => {
        if (!(entry.type === "elevator" || entry.type === "accessible_restroom")) return;
        const title = (entry.marker.getTitle() || "").toLowerCase();

        let matchedSeverity = null;
        Object.keys(worstByBuildingAndType).forEach(key => {
            const [building, featureType] = key.split("|");
            if (featureType !== entry.type || !title.includes(building)) return;
            const severity = worstByBuildingAndType[key];
            if (!matchedSeverity || severityRank[severity] > severityRank[matchedSeverity]) {
                matchedSeverity = severity;
            }
        });

        entry.severityColor = matchedSeverity ? SEVERITY_RING_COLORS[matchedSeverity] : null;
        entry.flagSeverity = matchedSeverity;

        // The icon on the marker right now was drawn before flags were known (this function
        // runs after all markers are created). Repaint it now so the ring shows immediately —
        // refreshFeatureVisibility() only redraws icons when the zoom level changes, not when
        // a flag is set, so without this a flagged marker wouldn't show its ring until you zoom.
        if (entry.type === "elevator" || entry.type === "accessible_restroom") {
            entry.marker.setIcon(getFeatureIcon(entry.type, entry.large, entry.severityColor));
        }
    });
}

// Shows/hides each feature marker: a layer's markers appear only when its checkbox is on
// AND the map is zoomed in far enough (FEATURE_MIN_ZOOM in map-icons.js). Also swaps
// pins to their larger size when zoomed in close.
function refreshFeatureVisibility() {
    if (!mainMapInstance) return;
    const zoom = mainMapInstance.getZoom();
    const minZoomFor = type => (typeof FEATURE_MIN_ZOOM !== "undefined" && FEATURE_MIN_ZOOM[type] !== undefined) ? FEATURE_MIN_ZOOM[type] : 17;
    const wantLarge = (typeof FEATURE_LARGE_ICON_ZOOM !== "undefined") && zoom >= FEATURE_LARGE_ICON_ZOOM;
    let lowestZoomNeeded = Infinity;

    accessibilityMarkers.forEach(entry => {
        const checkbox = layerCheckboxes[entry.type];
        const layerOn = checkbox ? checkbox.checked : true;
        const minZoom = minZoomFor(entry.type);
        if (layerOn) lowestZoomNeeded = Math.min(lowestZoomNeeded, minZoom);

        const show = layerOn && zoom >= minZoom;
        if (show && !entry.isRoute && typeof getFeatureIcon === "function" && entry.large !== wantLarge) {
            entry.marker.setIcon(getFeatureIcon(entry.type, wantLarge, entry.severityColor));
            entry.large = wantLarge;
        }
        entry.marker.setMap(show ? mainMapInstance : null);
    });

    const hint = document.getElementById("zoom-hint");
    if (hint) hint.hidden = !(lowestZoomNeeded !== Infinity && zoom < lowestZoomNeeded);
}

// The little "Zoom in to see accessibility features" chip at the top of the map
function createZoomHint() {
    const wrapper = document.querySelector(".map-wrapper");
    if (!wrapper || document.getElementById("zoom-hint")) return;
    const hint = document.createElement("div");
    hint.id = "zoom-hint";
    hint.className = "zoom-hint";
    hint.setAttribute("role", "status");
    hint.textContent = "Zoom in to see accessibility features";
    wrapper.appendChild(hint);
}

// Places a clickable marker for every building with a known location, showing its
// ADA info on click — same idea as WWU's own campus map's building info popups
function renderBuildingMarkers() {
    Object.keys(WWU_BUILDINGS_FOR_MAP).forEach(bName => {
        const bData = WWU_BUILDINGS_FOR_MAP[bName];
        // "Documented" now also covers buildings whose WWU page lists accessibility details
        // (building-info.js), not just the few that were typed in by hand
        // (the typeof checks keep the map working exactly as before if building-info.js
        // ever fails to load, e.g. if the file was forgotten when deploying)
        const hasDocumentedADA = !!bData.ada ||
            (typeof wwuBuildingHasDetails === "function" && wwuBuildingHasDetails(bName));

        // Mirrors WWU's own campus map convention: a distinct black badge specifically
        // marks buildings with documented accessibility info, so it's visually obvious
        // at a glance which buildings we actually have real data for vs. which don't
        const marker = new google.maps.Marker({
            position: bData.center,
            map: mainMapInstance,
            title: bName + (hasDocumentedADA ? " (ADA info available)" : ""),
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: hasDocumentedADA ? "#000000" : "#003F87",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2
            },
            zIndex: 500 // keep building markers above report/accessibility pins so they're easy to click
        });

        const adaContent = bData.ada
            ? `
                <ul style="list-style: none; padding: 0; margin: 0; font-size: 12px; color: #475569;">
                    <li style="margin-bottom: 4px;"><strong>🛗 Elevators:</strong> ${escapeHtml(bData.ada.elevators)}</li>
                    <li style="margin-bottom: 4px;"><strong>🚪 Auto Doors:</strong> ${escapeHtml(bData.ada.autoDoors)}</li>
                    <li style="margin-bottom: 4px;"><strong>♿ Restrooms:</strong> ${escapeHtml(bData.ada.restrooms)}</li>
                    <li><strong>📐 Ramps:</strong> ${escapeHtml(bData.ada.ramps)}</li>
                </ul>
            `
            : `<p style="font-size: 12px; color: #64748b; margin: 0;">Accessibility info not yet documented for this building.</p>`;

        // WWU's own building page (photo + accessibility details) wins when we have it; the
        // older hand-typed notes above are only the fallback for buildings with no WWU page,
        // so the two can never contradict each other in the same popup
        const wwuInfoHtml = (typeof wwuBuildBuildingInfoHtml === "function")
            ? wwuBuildBuildingInfoHtml(bName)
            : "";

        const infoWindow = new google.maps.InfoWindow({
            content: wwuInfoHtml
                ? `<div style="font-family: sans-serif; padding: 4px; max-width: 260px;">${wwuInfoHtml}</div>`
                : `
                <div style="font-family: sans-serif; padding: 4px; max-width: 240px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a;">${escapeHtml(bName)}</h4>
                    ${adaContent}
                </div>
            `
        });

        marker.addListener("click", () => infoWindow.open({ anchor: marker, map: mainMapInstance }));

        buildingMarkers.push(marker);
    });
}

// Wires up the sidebar checkboxes to show/hide markers by feature type
function wireUpLayerToggles() {
    document.querySelectorAll(".layer-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", refreshFeatureVisibility);
    });

    wireUpMobileViewToggle();

}

// Mobile-only Map/List toggle: switches which pane (the map or the sidebar list)
// takes up the full screen, since there isn't room to show both side-by-side
function wireUpMobileViewToggle() {
    const container = document.getElementById("map-page-container");
    const toggleButtons = document.querySelectorAll(".view-toggle-btn");

    toggleButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            toggleButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const view = btn.getAttribute("data-view");
            if (view === "list") {
                container.classList.add("showing-list");
            } else {
                container.classList.remove("showing-list");
            }

            // The map needs to be told its container resized, or Google Maps can
            // render into a stale/blank canvas after being hidden with display:none
            if (view === "map" && mainMapInstance) {
                google.maps.event.trigger(mainMapInstance, "resize");
                mainMapInstance.setCenter(WWU_CAMPUS_CENTER);
            }
        });
    });
}

// Fill the category/severity <select> elements in the sidebar (previously static/empty)
function populateFilterDropdowns() {
    const filterSelects = document.querySelectorAll(".filter-dropdown");
    const categoryDropdown = filterSelects[0];
    const severityDropdown = filterSelects[1];

    if (categoryDropdown) {
        categoryDropdown.innerHTML = `<option value="all">All Categories</option>`;
        REPORT_CATEGORIES.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            categoryDropdown.appendChild(opt);
        });
    }

    if (severityDropdown) {
        severityDropdown.innerHTML = `
            <option value="all">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="Critical">Critical</option>
        `;
    }
}

// Load reports from Supabase and populate Map + Feed
async function loadCampusReports() {
    const feedContainer = document.getElementById("reports-feed");

    // Fetch public reports from Supabase sorted newest first
    const { data: reports, error } = await _supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching accessibility reports:", error.message);
        if (feedContainer) {
            feedContainer.innerHTML = `<p style="padding: 1rem; color: #ef4444;">Unable to load reports right now.</p>`;
        }
        return;
    }

    // Hide resolved/removed reports, and anything still awaiting AI-flag review —
    // once an admin marks something resolved (or a flagged report gets approved),
    // it can show/reappear; until then it stays out of public view
    const visibleReports = (reports || []).filter(r =>
        !['resolved', 'removed'].includes((r.status || 'open').toLowerCase()) &&
        r.flag_status !== 'pending'
    );
    openReportsForFlagging = visibleReports;

    if (visibleReports.length === 0) {
        if (feedContainer) {
            feedContainer.innerHTML = `<p style="padding: 1rem; color: #64748b;">No active accessibility reports found.</p>`;
        }
        return;
    }

    // Clear loading state if feed container exists
    if (feedContainer) feedContainer.innerHTML = "";

    loadedReportEntries = [];

    visibleReports.forEach(report => {
        const reportLocation = { lat: parseFloat(report.lat), lng: parseFloat(report.lng) };
        const formattedDate = formatReportDate(report.created_at);

        const safeTitle = escapeHtml(report.title);
        const safeDescription = escapeHtml(report.description);
        const safeBuilding = escapeHtml(report.building || 'Campus Grounds');
        const safeSeverity = escapeHtml(report.severity || 'Medium');

        // Photo HTML snippet if an image exists (image_url is Supabase-controlled, not raw user text, but escape the attribute anyway)
        const imageHtml = report.image_url
            ? `<img src="${escapeHtml(report.image_url)}" alt="Report Attachment" style="width:100%; max-height:160px; object-fit:cover; border-radius:6px; margin-top:8px;" />`
            : '';

        // Add Marker on Google Map — colored by severity, matching the same
        // green/yellow/red palette used for severity badges everywhere else on the site
        const severityColors = { low: "#006B3F", medium: "#FFC61E", critical: "#CC2D30" };
        const severityKey = (report.severity || "medium").toLowerCase();
        const markerColor = severityColors[severityKey] || severityColors.medium;

        const marker = new google.maps.Marker({
            position: reportLocation,
            map: mainMapInstance,
            title: report.title,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: markerColor,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2
            },
            zIndex: 600 // reported issues always draw above buildings (500) and features (100)
        });

        // Map InfoWindow
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="font-family: sans-serif; padding: 6px; max-width: 240px; color: #1e293b;">
                    <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700;">${safeTitle}</h4>
                    <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
                        <i class="fa-regular fa-clock"></i> ${formattedDate}
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #334155;">${safeDescription}</p>
                    ${imageHtml}
                </div>
            `
        });

        marker.addListener("click", () => {
            infoWindow.open({ anchor: marker, map: mainMapInstance });
        });

        let cardEl = null;

        // Add Feed Card — photo-forward layout with a colored severity dot,
        // matching the cleaner civic-reporting card style used across the site
        if (feedContainer) {
            const card = document.createElement("div");
            card.className = "report-card";
            card.style.cursor = "pointer";

            const photoHtml = report.image_url
                ? `<img src="${escapeHtml(report.image_url)}" alt="Report photo" class="sidebar-card-photo" />`
                : '';

            card.innerHTML = `
                ${photoHtml}
                <div class="sidebar-card-body">
                    <div class="sidebar-card-meta-row">
                        <span class="sidebar-card-dot ${severityKey}"></span>
                        <span class="sidebar-card-severity-label">${safeSeverity}</span>
                        <span class="sidebar-card-time"><i class="fa-regular fa-clock"></i> ${formattedDate}</span>
                    </div>
                    <h3 class="sidebar-card-title">${safeTitle}</h3>
                    <div class="sidebar-card-location"><i class="fa-solid fa-location-dot"></i> ${safeBuilding}</div>
                    <p class="sidebar-card-desc">${safeDescription}</p>
                </div>
            `;

            // Click card to highlight marker on map
            card.addEventListener("click", () => {
                mainMapInstance.panTo(reportLocation);
                mainMapInstance.setZoom(18);
                infoWindow.open({ anchor: marker, map: mainMapInstance });
            });

            feedContainer.appendChild(card);
            cardEl = card;
        }

        loadedReportEntries.push({ report, marker, infoWindow, cardEl });
    });
}

// Wire up the sidebar search bar and category/severity dropdowns to filter both the feed and the map markers
function wireUpSearchAndFilters() {
    const searchInput = document.querySelector(".search-bar");
    const filterSelects = document.querySelectorAll(".filter-dropdown");
    const categoryDropdown = filterSelects[0];
    const severityDropdown = filterSelects[1];

    const applyFilters = () => {
        const searchTerm = (searchInput && searchInput.value ? searchInput.value : "").trim().toLowerCase();
        const categoryValue = categoryDropdown ? categoryDropdown.value : "all";
        const severityValue = severityDropdown ? severityDropdown.value : "all";

        loadedReportEntries.forEach(entry => {
            const { report, marker, cardEl } = entry;

            const matchesSearch = !searchTerm ||
                (report.title && report.title.toLowerCase().includes(searchTerm)) ||
                (report.description && report.description.toLowerCase().includes(searchTerm)) ||
                (report.building && report.building.toLowerCase().includes(searchTerm));

            const norm = v => String(v || "").trim().toLowerCase();
            const matchesCategory = categoryValue === "all" || norm(report.category) === norm(categoryValue);
            const matchesSeverity = severityValue === "all" || norm(report.severity) === norm(severityValue);

            const isVisible = matchesSearch && matchesCategory && matchesSeverity;

            if (cardEl) cardEl.style.display = isVisible ? "" : "none";
            marker.setMap(isVisible ? mainMapInstance : null);
        });
    };

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (categoryDropdown) categoryDropdown.addEventListener("change", applyFilters);
    if (severityDropdown) severityDropdown.addEventListener("change", applyFilters);
}