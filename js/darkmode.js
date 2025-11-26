/* =========================================
   GLOBAL DARK MODE HANDLER
========================================= */

// Apply saved mode on every page load
document.addEventListener("DOMContentLoaded", () => {
    const savedMode = localStorage.getItem("darkMode");

    if (savedMode === "enabled") {
        document.body.classList.add("dark");
        updateDarkModeIcon(true);
    }

    const toggleBtn = document.getElementById("darkModeToggle");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("dark");
            localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
            updateDarkModeIcon(isDark);
        });
    }
});

// Update moon/sun icon if available
function updateDarkModeIcon(isDark) {
    const icon = document.getElementById("darkModeIcon");
    if (!icon) return;

    if (isDark) {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
    } else {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
    }
}
