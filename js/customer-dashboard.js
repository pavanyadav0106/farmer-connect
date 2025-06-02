import { db, auth } from '../config.js';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const collapseBtn = document.querySelector('.collapse-btn');
  const notificationIcon = document.querySelector('.notification-icon');
  const notificationDropdown = document.querySelector('.notification-dropdown');
  const loader = document.getElementById('loader');
  const dashboard = document.getElementById('dashboard');

  // Sidebar toggle
  collapseBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Notification dropdown toggle
  notificationIcon.addEventListener('click', () => {
    notificationDropdown.classList.toggle('show');
  });

  // Close notification dropdown if clicked outside
  document.addEventListener('click', (e) => {
    if (!notificationIcon.contains(e.target) && !notificationDropdown.contains(e.target)) {
      notificationDropdown.classList.remove('show');
    }
  });

  // Fetch notifications from Firestore
  async function fetchNotifications() {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });

      renderNotifications(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      notificationDropdown.innerHTML = '<p style="padding: 10px;">No notifications available.</p>';
    }
  }

  // Render notifications to the dropdown
  function renderNotifications(notifications) {
    if (!notifications.length) {
      notificationDropdown.innerHTML = '<p style="padding: 10px;">No notifications available.</p>';
      return;
    }

    notificationDropdown.innerHTML = ''; // Clear existing content

    notifications.forEach((note) => {
      const item = document.createElement('div');
      item.className = 'notification-item';
      item.innerHTML = `
        <i class="fa fa-info-circle"></i>
        <p>${note.message}</p>
        <small>${new Date(note.date.seconds * 1000).toLocaleString()}</small>
      `;
      notificationDropdown.appendChild(item);
    });
  }

  // Handle auth state
  auth.onAuthStateChanged(user => {
    if (user) {
      fetchNotifications();
      setInterval(fetchNotifications, 5 * 60 * 1000); // Optional polling

      // Show dashboard, hide loader
      if (loader) loader.style.display = 'none';
      if (dashboard) dashboard.style.display = 'block';
    } else {
      notificationDropdown.innerHTML = '<p style="padding: 10px;">Please log in to see notifications.</p>';
      if (loader) loader.style.display = 'none';
      if (dashboard) dashboard.style.display = 'none';
    }
  });
});
