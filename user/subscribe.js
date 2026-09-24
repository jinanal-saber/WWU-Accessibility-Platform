const SUPABASE_URL = "https://tdhfysffpdczdnsikvrf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yz9UL8JKWSLXCCVLOjbJEg_2gusRAA5";
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Kept in sync with make_report.js's WWU_BUILDINGS_DATA keys
const WWU_BUILDING_NAMES = [
    "Communications Facility (CF)", "Miller Hall (MH)", "Academic Instructional West (AW)",
    "Arntzen Hall (AH)", "Parks Hall (PH)", "Carver (CV)", "Wilson Library (WL)",
    "Bond Hall (BH)", "Environmental Studies (ES)", "Ross Engineering Technology (ET)",
    "Viking Union (VU)", "Alma Clark Glass Hall (CG)", "Biology (BI)", "Buchanan Towers (BT)",
    "Fairhaven Academic Building / Fairhaven College (FA)", "Fairhaven Complex (FX)",
    "Fraser Hall (FR)", "Humanities Building (HU)", "Mathes Hall (MA)", "Nash Hall (NA)",
    "Edens Hall (EH)", "Performing Arts Center (PA)"
];

function populateBuildingOptions() {
    const select = document.getElementById("sub-buildings");
    WWU_BUILDING_NAMES.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
}

function wireUpAllNotificationsToggle() {
    const checkbox = document.getElementById("sub-all-notifications");
    const filtersSection = document.getElementById("sub-filters-section");

    checkbox.addEventListener("change", () => {
        filtersSection.classList.toggle("disabled-section", checkbox.checked);
        if (checkbox.checked) {
            document.getElementById("sub-buildings").selectedIndex = -1;
            document.getElementById("sub-categories").selectedIndex = -1;
        }
    });
}

function getSelectedValues(selectEl) {
    return Array.from(selectEl.selectedOptions).map(opt => opt.value);
}

function showError(message) {
    const errorEl = document.getElementById("subscribe-error");
    errorEl.textContent = message;
    errorEl.classList.add("visible");
}

function clearError() {
    const errorEl = document.getElementById("subscribe-error");
    errorEl.textContent = "";
    errorEl.classList.remove("visible");
}

// Generates the unsubscribe token ourselves, client-side, rather than asking the
// database to generate one and read it back — reading a row back after INSERT
// requires a SELECT policy, and this table deliberately has none (so subscriber
// emails can never be browsed via the public API). Generating it here avoids
// needing that read entirely.
function generateUnsubscribeToken() {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID().replace(/-/g, "");
    }
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    populateBuildingOptions();
    wireUpAllNotificationsToggle();

    const form = document.getElementById("subscribe-form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();

        const email = document.getElementById("sub-email").value.trim();
        const allNotifications = document.getElementById("sub-all-notifications").checked;
        const buildings = getSelectedValues(document.getElementById("sub-buildings"));
        const categories = getSelectedValues(document.getElementById("sub-categories"));

        if (!allNotifications && buildings.length === 0 && categories.length === 0) {
            showError("Pick at least one building or issue type, or check \u201Cnotify me about every new report.\u201D");
            return;
        }

        const submitBtn = document.getElementById("subscribe-submit-btn");
        submitBtn.disabled = true;
        submitBtn.textContent = "Subscribing...";

        const unsubscribeToken = generateUnsubscribeToken();

        // No .select() here on purpose — see generateUnsubscribeToken's comment.
        const { error } = await _supabase
            .from('subscriptions')
            .insert([{
                email: email,
                buildings: allNotifications || buildings.length === 0 ? null : buildings,
                categories: allNotifications || categories.length === 0 ? null : categories,
                all_notifications: allNotifications,