import { auth, db } from '../config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// 1. Immediate Theme Application (Prevents flash of unstyled content)
(function applyThemeImmediate() {
  const path = window.location.pathname;
  const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  const pageName = filename.replace('.html', '');
  const isCustomerPage = pageName.startsWith('customer-');

  if (isCustomerPage) {
    const customerDark = localStorage.getItem('customerDarkMode') === 'true';
    if (customerDark) {
      document.body.classList.add('customer-dark-mode');
    } else {
      document.body.classList.add('customer-light-mode');
    }
  } else {
    const farmerDark = localStorage.getItem('darkMode') === 'enabled';
    if (farmerDark) {
      document.body.classList.add('dark');
    }
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // Inject style helper for sidebar active page highlighting
  const layoutStyle = document.createElement('style');
  layoutStyle.textContent = `
    .sidebar ul li a.active-page {
      font-weight: 600 !important;
      background-color: rgba(255, 255, 255, 0.15) !important;
      border-left: 4px solid #fff !important;
      padding-left: 12px !important;
    }
    .dark .sidebar ul li a.active-page {
      color: #00ff73 !important;
      border-left: 4px solid #00ff73 !important;
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
  `;
  document.head.appendChild(layoutStyle);

  // Initialize Layout Injections
  initLayout();
  // Initialize Route Protection and User State Check
  initAuthGuard();
});

function initLayout() {
  const path = window.location.pathname;
  const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  const pageName = filename.replace('.html', '');
  const isCustomerPage = pageName.startsWith('customer-');

  // Inject Top Navigation
  const topNavPlace = document.getElementById('top-nav-placeholder');
  if (topNavPlace) {
    const hasSidebar = !!document.getElementById('sidebar-placeholder');
    const isDashboard = pageName === 'customer-dashboard' || pageName === 'farmer-dashboard' || pageName === 'index' || pageName === 'main';
    const showBackBtn = !isDashboard;

    // Top nav left: Back button & Menu toggle
    const topNavLeft = `
      <div class="top-nav-left" style="display: flex; gap: 15px; align-items: center;">
        ${showBackBtn ? `
        <button class="back-btn" onclick="if(window.history.length > 1) window.history.back(); else window.location.href='index.html';" aria-label="Go back" style="background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;" title="Back">
          <i class="fas fa-arrow-left"></i>
        </button>
        ` : ''}
        ${hasSidebar ? `
          <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu">
            <i class="fas fa-bars"></i>
          </button>
        ` : ''}
      </div>
    `;

    // Header right: Language, Cart (optional), Dark mode, Profile
    const headerRight = `
      <div class="header-right" style="display: flex; align-items: center; gap: 15px;">
        <div class="language-selector">
          <select id="languageSelect" aria-label="Select language" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #ccc; background: white; cursor: pointer;">
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
            <option value="hi">हिन्दी</option>
            <option value="ta">தமிழ்</option>
          </select>
        </div>
        ${isCustomerPage ? `
        <a href="customer-cart.html" class="cart-icon" style="position: relative; color: inherit; font-size: 20px; text-decoration: none; display: inline-flex; align-items: center;">
          <i class="fas fa-shopping-cart"></i>
          <span class="cart-count badge" style="position: absolute; top: -10px; right: -10px; background: #dc3545; color: white; border-radius: 50%; font-size: 11px; padding: 2px 6px; font-weight: bold; line-height: 1; display: none;">0</span>
        </a>
        ` : ''}
        <button id="darkModeToggle" class="dark-toggle dark-mode-toggle" aria-label="Toggle dark mode" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">
          <i id="darkModeIcon" class="fas fa-moon"></i>
        </button>
        <div class="user-profile" id="userProfileHeader" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
          <img id="userAvatar" src="https://ui-avatars.com/api/?name=User&background=4CAF50&color=fff" style="width: 32px; height: 32px; min-width: 32px; object-fit: cover; border-radius: 50%;">
          <span id="userName" class="hide-on-mobile" style="font-weight: 500; font-size: 14px;">Loading...</span>
        </div>
      </div>
    `;

    topNavPlace.innerHTML = `
      <div class="top-nav">
        ${topNavLeft}
        <span class="logo-text" style="flex-grow: 1; justify-content: center;">🌾 <span data-i18n="app.title">FARMER CONNECT</span></span>
        ${headerRight}
      </div>
    `;
    setupThemeToggle(isCustomerPage);
    setupLanguageSelector();
    if (isCustomerPage) {
      updateCartBadgeCount();
      window.addEventListener('storage', (e) => {
        if (e.key === 'cart') updateCartBadgeCount();
      });
      window.addEventListener('cartUpdated', updateCartBadgeCount);
    }
  }

  // Inject Sidebar
  const sidebarPlace = document.getElementById('sidebar-placeholder');
  if (sidebarPlace) {
    const role = sidebarPlace.getAttribute('data-role') || (isCustomerPage ? 'customer' : 'farmer');
    if (role === 'customer') {
      sidebarPlace.innerHTML = `
        <div class="sidebar" id="sidebar">
          <ul>
            <li><a href="customer-dashboard.html" class="nav-link" data-i18n="navigation.dashboard"><i class="fas fa-home"></i> Dashboard</a></li>
            <li><a href="customer-marketplace.html" class="nav-link" data-i18n="navigation.crops"><i class="fas fa-store"></i> Crops</a></li>
            <li><a href="customer-cart.html" class="nav-link" data-i18n="navigation.cart"><i class="fas fa-shopping-cart"></i> My Cart</a></li>
            <li><a href="customer-orders.html" class="nav-link" data-i18n="navigation.orders"><i class="fas fa-shopping-bag"></i> My Orders</a></li>
            <li><a href="customer-profile.html" class="nav-link" data-i18n="navigation.profile"><i class="fas fa-user"></i> Profile</a></li>
            <li><a href="#" id="logoutBtn" class="nav-link" data-i18n="navigation.logout"><i class="fas fa-sign-out-alt"></i> Log out</a></li>
          </ul>
        </div>
        <div class="overlay"></div>
      `;
    } else {
      // Farmer Sidebar
      sidebarPlace.innerHTML = `
        <div class="sidebar" id="sidebar">
          <ul>
            <li><a href="farmer-dashboard.html" class="nav-link" data-i18n="navigation.dashboard"><i class="fas fa-chart-line"></i> Dashboard</a></li>
            <li><a href="farmer-crops.html" class="nav-link" data-i18n="navigation.my_crops"><i class="fas fa-seedling"></i> My Crops</a></li>
            <li><a href="farmer-orders.html" class="nav-link" data-i18n="navigation.orders"><i class="fas fa-clipboard-list"></i> My Orders</a></li>
            <li><a href="farmer-profile.html" class="nav-link" data-i18n="navigation.profile"><i class="fas fa-user"></i> Profile</a></li>
            <li><a href="#" id="weatherButton" class="nav-link" data-i18n="navigation.weather"><i class="fas fa-cloud-sun"></i> Weather</a></li>
            <li><a href="#" id="logoutBtn" class="nav-link" data-i18n="navigation.logout"><i class="fas fa-sign-out-alt"></i> Log out</a></li>
          </ul>
        </div>
        <div class="overlay"></div>
      `;
    }

    highlightActiveSidebarLink(filename);
    setupSidebarToggle();
  }

  // Inject Footer
  const footerPlace = document.getElementById('footer-placeholder');
  if (footerPlace) {
    footerPlace.innerHTML = `
      <footer class="footer" style="padding: 20px 0; margin-top: 40px; text-align: center; border-top: 1px solid rgba(0,0,0,0.1);">
        <div class="container" style="background:transparent; border:none; box-shadow:none; backdrop-filter:none; padding:0; margin:0 auto; width:100%; max-width:1200px;">
          <p style="margin-bottom: 10px;">
            <a href="contact.html" style="color: inherit; text-decoration: none; margin: 0 10px;" data-i18n="footer.contact">Contact us</a> |
            <a href="faq.html" style="color: inherit; text-decoration: none; margin: 0 10px;" data-i18n="footer.faq">FAQs</a> |
            <a href="license.html" style="color: inherit; text-decoration: none; margin: 0 10px;" data-i18n="license.nav_license">License Terms</a>
          </p>
          <p style="font-size: 13px; color:white;" data-i18n="footer.copyright">&copy; 2025 FarmerConnect. All rights reserved.</p>
        </div>
      </footer>
    `;
  }

  // Inject Logout Modal
  const logoutModalPlace = document.getElementById('logout-modal-placeholder');
  if (logoutModalPlace) {
    logoutModalPlace.innerHTML = `
      <div id="logoutModal" class="logout-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1300; justify-content:center; align-items:center;">
        <div class="logout-modal-content" style="background:white; padding:30px; border-radius:12px; text-align:center; box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-width:90%; width:350px;">
          <span class="close" id="closeLogoutModal" style="float:right; cursor:pointer; font-size:24px; font-weight:bold; margin-top:-15px;">&times;</span>
          <p style="font-size:18px; margin-bottom:20px;" data-i18n="logout.confirm">Are you sure you want to log out?</p>
          <button id="confirmLogout" style="background:#d32f2f; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600; margin-right:10px;" data-i18n="logout.yes">Yes</button>
          <button id="cancelLogout" style="background:#e0e0e0; color:#333; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600;" data-i18n="logout.no">No</button>
        </div>
      </div>
    `;
    setupLogoutHandlers();
  }
}

// Active link highlighting
function highlightActiveSidebarLink(filename) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const links = sidebar.querySelectorAll('a.nav-link');
  let currentFile = filename.replace('.html', '');
  if (!currentFile || currentFile === 'index') {
    currentFile = 'index';
  }

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkFile = href.replace('.html', '');

    if (linkFile === currentFile) {
      link.classList.add('active-page');
    }
  });
}

// Sidebar toggle handler (mobile menu)
function setupSidebarToggle() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.overlay');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
      sidebar.classList.toggle('show');
      overlay.classList.toggle('active');
      overlay.classList.toggle('show');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active', 'show');
      overlay.classList.remove('active', 'show');
      const weatherPopup = document.getElementById('weatherPopup');
      if (weatherPopup) {
        weatherPopup.classList.remove('active');
      }
    });
  }

  // Handle sidebar links like Weather Button opening popup directly
  const weatherBtn = document.getElementById('weatherButton');
  if (weatherBtn) {
    weatherBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const popup = document.getElementById('weatherPopup');
      if (popup) {
        popup.classList.add('active');
        if (overlay) overlay.classList.add('active');
      }
      sidebar.classList.remove('active', 'show');
    });
  }

  // Weather close button
  const weatherClose = document.querySelector('#weatherPopup .close-btn, #weatherPopup .close');
  if (weatherClose) {
    weatherClose.addEventListener('click', () => {
      const popup = document.getElementById('weatherPopup');
      if (popup) popup.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    });
  }
}

// Dark Mode Toggle
function setupThemeToggle(isCustomerPage) {
  const toggleBtn = document.getElementById('darkModeToggle');
  if (!toggleBtn) return;

  if (isCustomerPage) {
    const isDark = localStorage.getItem('customerDarkMode') === 'true';
    updateCustomerDarkModeUI(isDark);

    toggleBtn.addEventListener('click', () => {
      const currentDark = document.body.classList.contains('customer-dark-mode');
      const newDark = !currentDark;
      localStorage.setItem('customerDarkMode', newDark);
      updateCustomerDarkModeUI(newDark);

      // Dispatch custom event for page specific scripts (like map elements etc.)
      window.dispatchEvent(new CustomEvent('customerDarkModeChanged', {
        detail: { isDarkMode: newDark }
      }));
    });
  } else {
    // Farmer/global theme
    const isDark = localStorage.getItem('darkMode') === 'enabled';
    updateFarmerDarkModeUI(isDark);

    toggleBtn.addEventListener('click', () => {
      const currentDark = document.body.classList.contains('dark');
      const newDark = !currentDark;
      localStorage.setItem('darkMode', newDark ? 'enabled' : 'disabled');
      updateFarmerDarkModeUI(newDark);
    });
  }
}

function updateCustomerDarkModeUI(isDark) {
  const body = document.body;
  const toggleBtn = document.getElementById('darkModeToggle');
  const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

  if (isDark) {
    body.classList.add('customer-dark-mode');
    body.classList.remove('customer-light-mode');
    if (icon) icon.className = 'fas fa-sun';
  } else {
    body.classList.add('customer-light-mode');
    body.classList.remove('customer-dark-mode');
    if (icon) icon.className = 'fas fa-moon';
  }

  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.content = isDark ? '#121212' : '#4CAF50';
  }
}

function updateFarmerDarkModeUI(isDark) {
  const body = document.body;
  const icon = document.getElementById('darkModeIcon');

  if (isDark) {
    body.classList.add('dark');
    if (icon) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    }
  } else {
    body.classList.remove('dark');
    if (icon) {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  }
}

// Language Selector Handler
function setupLanguageSelector() {
  const selector = document.getElementById('languageSelect');
  if (!selector) return;

  const currentLang = localStorage.getItem('language') || 'en';
  selector.value = currentLang;

  selector.addEventListener('change', async (e) => {
    const newLang = e.target.value;
    if (window.languageManager) {
      await window.languageManager.changeLanguage(newLang);
    } else {
      localStorage.setItem('language', newLang);
      window.location.reload();
    }
  });
}

// Logout Handlers
function setupLogoutHandlers() {
  const logoutBtn = document.getElementById('logoutBtn');
  const modal = document.getElementById('logoutModal');
  const closeBtn = document.getElementById('closeLogoutModal');
  const confirmBtn = document.getElementById('confirmLogout');
  const cancelBtn = document.getElementById('cancelLogout');

  if (logoutBtn && modal) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'flex';
    });
  }

  const hideModal = () => {
    if (modal) modal.style.display = 'none';
  };

  if (closeBtn) closeBtn.addEventListener('click', hideModal);
  if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      signOut(auth).then(() => {
        // Clear locally stored cart fallback
        localStorage.removeItem('cart');
        window.location.href = 'main.html';
      }).catch(err => {
        console.error('Sign out error:', err);
        alert('Failed to log out. Please try again.');
      });
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });
}

// Authentication Guard and Role verification
function initAuthGuard() {
  auth.onAuthStateChanged(async (user) => {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    let pageName = filename.replace('.html', '');
    if (pageName === '') pageName = 'index';

    // List of public pages
    const publicPages = ['index', 'main', 'contact', 'faq', 'license'];
    const isPublicPage = publicPages.includes(pageName);

    if (!user) {
      // User is signed out: redirect protected pages to login page (main.html)
      if (!isPublicPage) {
        window.location.href = 'main.html';
      }
    } else {
      // User is signed in: load metadata
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role; // 'farmer' or 'buyer' (customer)

          // Load Profile Data into layout if available
          const userNameEl = document.getElementById('userName');
          const userAvatarEl = document.getElementById('userAvatar');

          const displayName = userData.fullName || userData.displayName || user.displayName || (role === 'farmer' ? 'Farmer' : 'Customer');
          const avatarUrl = userData.profilePic || userData.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4CAF50&color=fff`;

          if (userNameEl) userNameEl.textContent = displayName;
          if (userAvatarEl) userAvatarEl.src = avatarUrl;

          // Redirect if on main.html/auth page
          if (pageName === 'main') {
            if (role === 'farmer') {
              window.location.href = 'farmer-dashboard.html';
            } else {
              window.location.href = 'customer-dashboard.html';
            }
          }

          // Enforce role access control
          const isFarmerPage = pageName.startsWith('farmer-');
          const isCustomerPage = pageName.startsWith('customer-');

          if (role === 'farmer' && isCustomerPage) {
            window.location.href = 'farmer-dashboard.html';
          } else if (role === 'buyer' && isFarmerPage) {
            window.location.href = 'customer-dashboard.html';
          }
        }
      } catch (error) {
        console.error('Error fetching role data inside Auth Guard:', error);
      }
    }
  });
}

function updateCartBadgeCount() {
  const badgeEls = document.querySelectorAll('.cart-count, .badge');
  try {
    const savedCart = localStorage.getItem('cart');
    const cartItems = savedCart ? JSON.parse(savedCart) : [];
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    badgeEls.forEach(badge => {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'inline-flex' : 'none';
    });
  } catch (err) {
    console.error("Error updating cart badge in layout loader:", err);
  }
}

