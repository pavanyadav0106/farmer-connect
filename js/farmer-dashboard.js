import languageManager from './language-manager.js';
import autoTranslate from './auto-translate.js';

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById("loading");
  
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

  // Your existing overlay handler
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

  // Initialize loading state
  showLoading();
  
  // Simulate loading completion (replace with your actual loading logic)
  setTimeout(() => {
    hideLoading();
  }, 1000);
});