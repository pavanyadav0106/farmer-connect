// logout.js
import { auth } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const modal = document.getElementById("logoutModal");
  const span = document.querySelector(".close");
  const confirmLogout = document.getElementById("confirmLogout");
  const cancelLogout = document.getElementById("cancelLogout");

  logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = "block";
  });

  span?.addEventListener('click', () => {
    modal.style.display = "none";
  });

  cancelLogout?.addEventListener('click', () => {
    modal.style.display = "none";
  });

  confirmLogout?.addEventListener('click', () => {
    auth.signOut()
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Logout error:", error);
        alert("Error logging out.");
      });
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});
