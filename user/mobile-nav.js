// Mobile nav dropdown: shared by every page that has the hamburger toggle button
// (id="mobile-menu-toggle") next to the nav links (id="nav-left"). Below 768px the CSS
// hides nav-left by default and shows it as a dropdown panel when it has the "open" class.
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("mobile-menu-toggle");
    const nav = document.getElementById("nav-left");
    if (!toggle || !nav) return;

    function closeMenu() {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
    }

    function openMenu() {
        nav.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
    }

    toggle.addEventListener("click", () => {
        nav.classList.contains("open") ? closeMenu() : openMenu();
    });

    // Tapping a link closes the dropdown before navigating (mostly matters for same-page
    // anchors like the skip link; a normal page-to-page link closes it anyway on navigation)
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

    // Tapping anywhere outside the open dropdown closes it
    document.addEventListener("click", event => {
        if (!nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeMenu();
    });
});