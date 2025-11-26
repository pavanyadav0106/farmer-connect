document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("main-content");
  const overlay = document.querySelector(".overlay");

  if (menuToggle && sidebar && mainContent && overlay) {
    // Toggle sidebar and overlay
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");

      if (window.innerWidth > 768) {
        mainContent.classList.toggle("shift");
      }
    });

    // Hide sidebar when overlay is clicked
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
      mainContent.classList.remove("shift");
    });
  }

  // Optional: handle profile link click
  const profileLink = document.getElementById('profileLink');
  if (profileLink) {
    profileLink.addEventListener('click', () => {
    });
  }
});