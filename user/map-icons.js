// =====================================================================================
// Marker artwork + zoom settings for the accessibility feature layers.
//
// Everything about how these markers LOOK is in this file, so you can tweak it without
// touching map.js. The drawings are simple SVG shapes, so they stay sharp at any size.
//
// Styles (edit the colors here):
//   pin   = a colored teardrop pin with a white symbol inside
//   badge = a round white badge with a dark ring (used for elevators)
// =====================================================================================

const FEATURE_MARKER_STYLE = {
    accessible_entrance: { shape: "pin",   color: "#6D3FB2", glyph: "wheelchair" }, // purple
    accessible_parking:  { shape: "pin",   color: "#1E63C8", glyph: "parking" },    // blue
    accessible_restroom: { shape: "pin",   color: "#1C2023", glyph: "restroom" },   // near-black
    elevator:            { shape: "badge", color: "#1C2023", glyph: "elevator" }    // white badge, dark ring
};

// The map starts zoomed out, where 300+ markers would bury everything. Each layer only
// appears once the map is zoomed in to at least this level (higher number = closer in).
// Google's zoom runs from 15 (whole campus) up to about 20 (single building).
const FEATURE_MIN_ZOOM = {
    accessible_parking: 17,
    accessible_restroom: 17,
    elevator: 17,
    accessible_entrance: 18,   // there are 75 of these, so they wait until you're closer
    ada_route: 17,
    functional_route: 17
};

// At or above this zoom the pins are drawn larger
const FEATURE_LARGE_ICON_ZOOM = 18;

// Pin size in pixels [width, height] at normal and large zoom, and badge diameter
const FEATURE_ICON_SIZE = {
    pin:   { normal: [22, 29], large: [30, 39] },
    badge: { normal: [26, 26], large: [34, 34] }
};

// ---- the white symbols, drawn in a 24 x 24 box ----------------------------------------
const WHEELCHAIR_GLYPH =
    '<circle cx="11.4" cy="3.6" r="2.3" fill="#fff"/>' +
    '<path d="M11.4 7.6v6.4h5.3l2.4 5.4M11.4 10.6h4.7" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M8 12.4a5.6 5.6 0 1 0 8.4 6.6" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/>';

const GLYPHS = {
    wheelchair: WHEELCHAIR_GLYPH,
    parking:
        '<path d="M8.4 21V3.4h5.3a5.1 5.1 0 0 1 0 10.2H8.4" fill="none" stroke="#fff" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"/>',
    restroom:
        '<g fill="#fff"><circle cx="5.2" cy="4" r="2"/><rect x="2.6" y="7.4" width="5.2" height="7.2" rx="1.6"/>' +
        '<rect x="3.2" y="13.6" width="1.8" height="7.4" rx=".9"/><rect x="5.5" y="13.6" width="1.8" height="7.4" rx=".9"/></g>' +
        '<g transform="translate(9.2 1.4) scale(.86)">' + WHEELCHAIR_GLYPH + '</g>'
};

function buildPinSvg(style) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52" width="40" height="52">' +
        '<path d="M20 1.5C9.7 1.5 1.5 9.7 1.5 20c0 13.6 18.5 30.5 18.5 30.5S38.5 33.6 38.5 20C38.5 9.7 30.3 1.5 20 1.5z" ' +
        'fill="' + style.color + '" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<g transform="translate(8 8)">' + GLYPHS[style.glyph] + '</g></svg>';
}

function buildElevatorBadgeSvg(style) {
    const c = style.color;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="44" height="44">' +
        '<circle cx="22" cy="22" r="20" fill="#fff" stroke="' + c + '" stroke-width="3"/>' +
        '<rect x="11" y="7" width="22" height="19" rx="2" fill="none" stroke="' + c + '" stroke-width="2.4"/>' +
        '<path d="M22 10.4l-4.4 5.6h8.8zM22 23l-4.4-5.6h8.8z" fill="' + c + '"/>' +
        '<text x="22" y="37" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="10" fill="' + c + '">ADA</text>' +
        '</svg>';
}

function featureSvg(type) {
    const style = FEATURE_MARKER_STYLE[type];
    if (!style) return null;
    return style.shape === "badge" ? buildElevatorBadgeSvg(style) : buildPinSvg(style);
}

const _featureIconCache = {};

// Returns a Google Maps icon object for a feature type, or null for types drawn as plain
// dots (the route layers). Needs `google.maps` to exist, so only call it after the map loads.
function getFeatureIcon(type, large) {
    const style = FEATURE_MARKER_STYLE[type];
    if (!style) return null;

    const key = type + (large ? ":large" : ":normal");
    if (_featureIconCache[key]) return _featureIconCache[key];

    const [w, h] = FEATURE_ICON_SIZE[style.shape][large ? "large" : "normal"];
    const icon = {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(featureSvg(type)),
        scaledSize: new google.maps.Size(w, h),
        // pins point with their tip; round badges are centered on the spot
        anchor: style.shape === "pin" ? new google.maps.Point(w / 2, h) : new google.maps.Point(w / 2, h / 2)
    };
    _featureIconCache[key] = icon;
    return icon;
}
