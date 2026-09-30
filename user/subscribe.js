const SUPABASE_URL = "https://tdhfysffpdczdnsikvrf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yz9UL8JKWSLXCCVLOjbJEg_2gusRAA5";
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The full 57-building list from make_report.js's WWU_BUILDINGS_DATA — previously this
// only had the 22 buildings with verified map coordinates, which meant someone couldn't
// subscribe to a building that just hadn't been mapped yet. Following a building for
// notifications doesn't depend on its map position, so there's no reason to leave any out.
const WWU_BUILDING_NAMES = [
    "Academic Instructional Center (AI)", "Academic Instructional West (AW)",
    "Administrative Services Center (AC)", "Alma Clark Glass Hall (CG)", "Alumni House (AL)",
    "Archives Building (AB)", "Arntzen Hall (AH)", "Art Annex (AA)", "Biology (BI)",
    "Birnam Wood (Buildings 1-7) (BW)", "Birnam Wood Community Building (BC)",
    "Birnam Wood Laundry Building (BL)", "Bond Hall (BH)", "Buchanan Towers (BT)", "Campus Services (CS)",
    "Canada House (CA)", "Carver (CV)", "College Hall (CH)", "Commissary (CM)",
    "Communications Facility (CF)", "Edens Hall (EH)", "Edens Hall North (EN)", "Environmental Studies (ES)",
    "Fairhaven Academic Building / Fairhaven College (FA)", "Fairhaven Cabin - South (FS)",
    "Fairhaven Complex (FX)", "Fine Arts (FI)", "Fraser Hall (FR)", "Haggard Hall (HH)",
    "Higginson Hall (HG)", "High Street Hall (HS)", "Humanities Building (HU)",
    "Interdisciplinary Science Building (IS)", "Kaiser Borsari Hall (KB)", "Mathes Hall (MA)",
    "Miller Hall (MH)", "Morse Hall / Chemistry Building (CB)", "Nash Hall (NA)", "Old Main (OM)",
    "Parks Hall (PH)", "Performing Arts Center (PA)", "Physical Plant (PP)", "Ridgeway Alpha (RA)",
    "Ridgeway Beta (RB)", "Ridgeway Commons (RC)", "Ridgeway Delta (RD)", "Ridgeway Gamma (RG)",
    "Ridgeway Kappa (RK)", "Ridgeway Omega (RO)", "Ridgeway Sigma (RS)", "Ross Engineering Technology (ET)",
    "SMATE / Science Lecture (SL)", "Steam Plant (SP)", "Viking Commons (VC)", "Viking Union (VU)",
    "Wade King Recreation Center (SV)", "Wilson Library (WL)"
];

// Checkboxes, not a <select multiple> — multi-select dropdowns don't work reliably via
// touch on phones (there's no Ctrl/Cmd key to hold down), so this is the version that
// actually works on every device.
function populateBuildingOptions() {
    const container = document.getElementById("sub-buildings");
    WWU_BUILDING_NAMES.forEach(name => {
        const label = document.createElement("label");
        label.className = "checkbox-list-item";
        label.innerHTML = `<input type="checkbox" value="${name}"> ${name}`;
        container.appendChild(label);
    });
}

// Filters which building rows are visible as the user types — a checked box that gets
// hidden by the filter stays checked underneath (getSelectedValues reads all :checked
// inputs regardless of visibility), so searching never loses a selection someone already made.
function wireUpBuildingSearch() {
    const searchInput = document.getElementById("sub-buildings-search");
    const container = document.getElementById("sub-buildings");
    if (!searchInput || !container) return;

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        const items = container.querySelectorAll(".checkbox-list-item");
        let anyVisible = false;

        items.forEach(item => {
            const matches = item.textContent.trim().toLowerCase().includes(query);
            item.style.display = matches ? "" : "none";
            if (matches) anyVisible = true;
        });

        let emptyMsg = container.querySelector(".checkbox-list-empty-msg");
        if (!anyVisible) {
            if (!emptyMsg) {
                emptyMsg = document.createElement("p");
                emptyMsg.className = "checkbox-list-empty-msg";
                emptyMsg.textContent = "No buildings match your search.";
                container.appendChild(emptyMsg);
            }
        } else if (emptyMsg) {
            emptyMsg.remove();
        }
    });
}

function wireUpAllNotificationsToggle() {
    const checkbox = document.getElementById("sub-all-notifications");
    const filtersSection = document.getElementById("sub-filters-section");

    checkbox.addEventListener("change", () => {
        filtersSection.classList.toggle("disabled-section", checkbox.checked);
        if (checkbox.checked) {
            document.querySelectorAll("#sub-buildings input, #sub-categories input").forEach(cb => { cb.checked = false; });
        }
    });
}

function getSelectedValues(containerEl) {
    return Array.from(containerEl.querySelectorAll("input:checked")).map(cb => cb.value);
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

document.addEventListener("DOMContentLoaded", () => {
    populateBuildingOptions();
    wireUpBuildingSearch();
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

        // Calls a database function that inserts the row and returns the new unsubscribe
        // token, running under the database's own elevated privileges. This sidesteps
        // needing any SELECT permission on the subscriptions table at all (that table
        // deliberately has none, so the subscriber list can never be browsed publicly).
        const { data: returnedToken, error } = await _supabase.rpc('create_subscription', {
            p_email: email,
            p_buildings: allNotifications || buildings.length === 0 ? null : buildings,
            p_categories: allNotifications || categories.length === 0 ? null : categories,
            p_all_notifications: allNotifications
        });

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-bell"></i> Subscribe to Notifications';

        if (error) {
            console.error("Error creating subscription:", error.message);
            showError("Something went wrong saving your subscription. Please try again.");
            return;
        }

        form.hidden = true;
        const successBox = document.getElementById("subscribe-success");
        successBox.hidden = false;

        const unsubUrl = `${window.location.origin}${window.location.pathname.replace('subscribe.html', 'unsubscribe.html')}?token=${returnedToken}`;
        const link = document.getElementById("subscribe-unsub-link");
        link.href = unsubUrl;
        link.textContent = unsubUrl;
    });
});