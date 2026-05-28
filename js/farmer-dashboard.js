import { db, auth } from '../config.js';
import languageManager from './language-manager.js';
import autoTranslate from './auto-translate.js';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById("loading");

  // DOM elements for stats
  const statCropsEl = document.getElementById('statCrops');
  const statOrdersEl = document.getElementById('statOrders');
  const statWeatherEl = document.getElementById('statWeather');
  const statMessagesEl = document.getElementById('statMessages');

  // Initialize language system
  languageManager.initialize().then(() => {
    console.log('Language system initialized');
    autoTranslate.init();
  });
  
  // Language selector handler
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    // Set initial value
    languageSelect.value = languageManager.getCurrentLang();
    
    // Handle language change
    languageSelect.addEventListener('change', async (e) => {
      const newLang = e.target.value;
      await languageManager.changeLanguage(newLang);
    });
  }

  function showLoading() {
    if (loading) {
      loading.style.display = 'flex';
      loading.classList.add("show");
    }
  }
  
  function hideLoading() {
    if (loading) {
      loading.style.display = 'none';
      loading.classList.remove("show");
    }
  }

  // Auth check & load statistics
  showLoading();
  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = "main.html";
    } else {
      setupRealTimeStats(user.uid);
      hideLoading();
    }
  });

  function setupRealTimeStats(farmerId) {
    // 1. Total Crops count
    try {
      const cropsQuery = query(
        collection(db, 'products'),
        where('farmerId', '==', farmerId)
      );
      onSnapshot(cropsQuery, snapshot => {
        animateCounter('statCrops', snapshot.size);
      });
    } catch (err) {
      console.error("Error listening to crops:", err);
    }

    // 2. Orders Received count
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('farmerIds', 'array-contains', farmerId)
      );
      onSnapshot(ordersQuery, snapshot => {
        animateCounter('statOrders', snapshot.size);
      });
    } catch (err) {
      console.error("Error listening to orders:", err);
    }

    // 3. Messages / Notifications count
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', farmerId),
        where('read', '==', false)
      );
      onSnapshot(notificationsQuery, snapshot => {
        animateCounter('statMessages', snapshot.size);
      });
    } catch (err) {
      console.error("Error listening to notifications:", err);
    }

    // 4. Weather Alerts - Default to 0
    animateCounter('statWeather', 0);
  }

  // Smooth Counter Animation Helper
  function animateCounter(id, target, duration = 800) {
    const el = document.getElementById(id);
    if (!el) return;
    
    const startVal = parseInt(el.innerText) || 0;
    if (startVal === target) {
      el.innerText = target;
      return;
    }
    
    let startTimestamp = null;
    
    function step(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(progress * (target - startVal) + startVal);
      el.innerText = current;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.innerText = target;
      }
    }
    
    window.requestAnimationFrame(step);
  }

  // Overlay handler
  const overlay = document.querySelector('.overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      const weatherPopup = document.getElementById('weatherPopup');
      if (weatherPopup) {
        weatherPopup.classList.remove('active');
      }
      overlay.classList.remove('active');
    });
  }
});