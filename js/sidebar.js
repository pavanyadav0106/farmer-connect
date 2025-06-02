document.addEventListener('DOMContentLoaded', () => {
  // Sidebar toggle functionality
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("main-content");

  if (menuToggle && sidebar && mainContent) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      mainContent.classList.toggle("shift");

    });

    if (localStorage.getItem("sidebarActive") === "true") {
      sidebar.classList.add("active");
      mainContent.classList.add("shift");
    }
  }

  // Profile link click listener
  const profileLink = document.getElementById('profileLink');
  if (profileLink) {
    profileLink.addEventListener('click', (e) => {
      console.log('Profile link clicked');
      // You can add your navigation or logic here
    });
  }
});
