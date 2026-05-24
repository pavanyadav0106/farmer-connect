import{a as h,d as k}from"./config--Onoqk_Z.js";import{doc as x,getDoc as w}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";import{signOut as L}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";(function(){const e=window.location.pathname;(e.substring(e.lastIndexOf("/")+1)||"index.html").replace(".html","").startsWith("customer-")?localStorage.getItem("customerDarkMode")==="true"?document.body.classList.add("customer-dark-mode"):document.body.classList.add("customer-light-mode"):localStorage.getItem("darkMode")==="enabled"&&document.body.classList.add("dark")})();document.addEventListener("DOMContentLoaded",()=>{const o=document.createElement("style");o.textContent=`
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
  `,document.head.appendChild(o),E(),D()});function E(){const o=window.location.pathname,e=o.substring(o.lastIndexOf("/")+1)||"index.html",t=e.replace(".html","").startsWith("customer-"),n=document.getElementById("top-nav-placeholder");if(n){if(t)n.innerHTML=`
        <div class="top-nav">
          <div class="top-nav-left">
            <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu">
              <i class="fas fa-bars"></i>
            </button>
          </div>
          <span class="logo-text">🌾 FARMER CONNECT</span>
          <div class="header-right">
            <div class="language-selector" style="margin-right: 15px;">
              <select id="languageSelect" aria-label="Select language" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #ccc; background: white; cursor: pointer;">
                <option value="en">English</option>
                <option value="te">తెలుగు</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>
            <a href="customer-cart.html" class="cart-icon" style="position: relative; margin-right: 15px; color: inherit; font-size: 20px; text-decoration: none; display: inline-flex; align-items: center;">
              <i class="fas fa-shopping-cart"></i>
              <span class="cart-count badge" style="position: absolute; top: -10px; right: -10px; background: #dc3545; color: white; border-radius: 50%; font-size: 11px; padding: 2px 6px; font-weight: bold; line-height: 1; display: none;">0</span>
            </a>
            <button id="darkModeToggle" class="dark-mode-toggle" aria-label="Toggle dark mode" style="margin-right: 15px;">
              <i class="fas fa-moon"></i>
            </button>
            <div class="user-profile" id="userProfileHeader" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <img id="userAvatar" src="https://ui-avatars.com/api/?name=Customer+User&background=4CAF50&color=fff" style="width: 32px; height: 32px; border-radius: 50%;">
              <span id="userName" style="font-weight: 500;">Customer User</span>
            </div>
          </div>
        </div>
      `;else{const r=!!document.getElementById("sidebar-placeholder");n.innerHTML=`
        <div class="top-nav">
          <div class="top-nav-left">
            ${r?`
              <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu">
                <i class="fas fa-bars"></i>
              </button>
            `:""}
          </div>
          <span class="logo-text">🌾 <span data-i18n="app.title">FARMER CONNECT</span></span>
          <div class="header-right">
            <div class="language-selector" style="margin-right: 15px;">
              <select id="languageSelect" aria-label="Select language" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #ccc; background: white; cursor: pointer;">
                <option value="en">English</option>
                <option value="te">తెలుగు</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>
            <button id="darkModeToggle" class="dark-toggle" aria-label="Toggle dark mode">
              <i id="darkModeIcon" class="fas fa-moon"></i>
            </button>
          </div>
        </div>
      `}B(t),C(),t&&(d(),window.addEventListener("storage",r=>{r.key==="cart"&&d()}),window.addEventListener("cartUpdated",d))}const i=document.getElementById("sidebar-placeholder");i&&((i.getAttribute("data-role")||(t?"customer":"farmer"))==="customer"?i.innerHTML=`
        <div class="sidebar" id="sidebar">
          <ul>
            <li><a href="customer-dashboard.html" class="nav-link"><i class="fas fa-home"></i> Dashboard</a></li>
            <li><a href="customer-marketplace.html" class="nav-link"><i class="fas fa-store"></i> Crops</a></li>
            <li><a href="customer-cart.html" class="nav-link"><i class="fas fa-shopping-cart"></i> My Cart</a></li>
            <li><a href="customer-orders.html" class="nav-link"><i class="fas fa-shopping-bag"></i> My Orders</a></li>
            <li><a href="customer-profile.html" class="nav-link"><i class="fas fa-user"></i> Profile</a></li>
            <li><a href="#" id="logoutBtn" class="nav-link"><i class="fas fa-sign-out-alt"></i> Log out</a></li>
          </ul>
        </div>
        <div class="overlay"></div>
      `:i.innerHTML=`
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
      `,I(e),M());const s=document.getElementById("footer-placeholder");s&&(s.innerHTML=`
      <footer class="footer" style="padding: 20px 0; margin-top: 40px; text-align: center; border-top: 1px solid rgba(0,0,0,0.1);">
        <div class="container" style="background:transparent; border:none; box-shadow:none; backdrop-filter:none; padding:0; margin:0 auto; width:100%; max-width:1200px;">
          <p style="margin-bottom: 10px;">
            <a href="contact.html" style="color: inherit; text-decoration: none; margin: 0 10px;" data-i18n="footer.contact">Contact us</a> |
            <a href="faq.html" style="color: inherit; text-decoration: none; margin: 0 10px;" data-i18n="footer.faq">FAQs</a> |
            <a href="license.html" style="color: inherit; text-decoration: none; margin: 0 10px;">License Terms</a>
          </p>
          <p style="font-size: 13px; color: var(--gray, #777);">&copy; 2025 FarmerConnect. All rights reserved.</p>
        </div>
      </footer>
    `);const l=document.getElementById("logout-modal-placeholder");l&&(l.innerHTML=`
      <div id="logoutModal" class="logout-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1300; justify-content:center; align-items:center;">
        <div class="logout-modal-content" style="background:white; padding:30px; border-radius:12px; text-align:center; box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-width:90%; width:350px;">
          <span class="close" id="closeLogoutModal" style="float:right; cursor:pointer; font-size:24px; font-weight:bold; margin-top:-15px;">&times;</span>
          <p style="font-size:18px; margin-bottom:20px;" data-i18n="logout.confirm">Are you sure you want to log out?</p>
          <button id="confirmLogout" style="background:#d32f2f; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600; margin-right:10px;" data-i18n="logout.yes">Yes</button>
          <button id="cancelLogout" style="background:#e0e0e0; color:#333; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600;" data-i18n="logout.no">No</button>
        </div>
      </div>
    `,S())}function I(o){const e=document.getElementById("sidebar");if(!e)return;const a=e.querySelectorAll("a.nav-link");let t=o.replace(".html","");(!t||t==="index")&&(t="index"),a.forEach(n=>{const i=n.getAttribute("href");if(!i)return;i.replace(".html","")===t&&n.classList.add("active-page")})}function M(){const o=document.getElementById("menu-toggle"),e=document.getElementById("sidebar"),a=document.querySelector(".overlay");o&&e&&o.addEventListener("click",i=>{i.stopPropagation(),e.classList.toggle("active"),e.classList.toggle("show"),a.classList.toggle("active"),a.classList.toggle("show")}),a&&a.addEventListener("click",()=>{e.classList.remove("active","show"),a.classList.remove("active","show");const i=document.getElementById("weatherPopup");i&&i.classList.remove("active")});const t=document.getElementById("weatherButton");t&&t.addEventListener("click",i=>{i.preventDefault();const s=document.getElementById("weatherPopup");s&&(s.classList.add("active"),a&&a.classList.add("active")),e.classList.remove("active","show")});const n=document.querySelector("#weatherPopup .close-btn, #weatherPopup .close");n&&n.addEventListener("click",()=>{const i=document.getElementById("weatherPopup");i&&i.classList.remove("active"),a&&a.classList.remove("active")})}function B(o){const e=document.getElementById("darkModeToggle");if(e)if(o){const a=localStorage.getItem("customerDarkMode")==="true";p(a),e.addEventListener("click",()=>{const n=!document.body.classList.contains("customer-dark-mode");localStorage.setItem("customerDarkMode",n),p(n),window.dispatchEvent(new CustomEvent("customerDarkModeChanged",{detail:{isDarkMode:n}}))})}else{const a=localStorage.getItem("darkMode")==="enabled";f(a),e.addEventListener("click",()=>{const n=!document.body.classList.contains("dark");localStorage.setItem("darkMode",n?"enabled":"disabled"),f(n)})}}function p(o){const e=document.body,a=document.getElementById("darkModeToggle"),t=a?a.querySelector("i"):null;o?(e.classList.add("customer-dark-mode"),e.classList.remove("customer-light-mode"),t&&(t.className="fas fa-sun")):(e.classList.add("customer-light-mode"),e.classList.remove("customer-dark-mode"),t&&(t.className="fas fa-moon"));let n=document.querySelector('meta[name="theme-color"]');n&&(n.content=o?"#121212":"#4CAF50")}function f(o){const e=document.body,a=document.getElementById("darkModeIcon");o?(e.classList.add("dark"),a&&(a.classList.remove("fa-moon"),a.classList.add("fa-sun"))):(e.classList.remove("dark"),a&&(a.classList.remove("fa-sun"),a.classList.add("fa-moon")))}function C(){const o=document.getElementById("languageSelect");if(!o)return;const e=localStorage.getItem("language")||"en";o.value=e,o.addEventListener("change",async a=>{const t=a.target.value;window.languageManager?await window.languageManager.changeLanguage(t):(localStorage.setItem("language",t),window.location.reload())})}function S(){const o=document.getElementById("logoutBtn"),e=document.getElementById("logoutModal"),a=document.getElementById("closeLogoutModal"),t=document.getElementById("confirmLogout"),n=document.getElementById("cancelLogout");o&&e&&o.addEventListener("click",s=>{s.preventDefault(),e.style.display="flex"});const i=()=>{e&&(e.style.display="none")};a&&a.addEventListener("click",i),n&&n.addEventListener("click",i),t&&t.addEventListener("click",()=>{L(h).then(()=>{localStorage.removeItem("cart"),window.location.href="main.html"}).catch(s=>{console.error("Sign out error:",s),alert("Failed to log out. Please try again.")})}),window.addEventListener("click",s=>{s.target===e&&i()})}function D(){h.onAuthStateChanged(async o=>{const e=window.location.pathname;let t=(e.substring(e.lastIndexOf("/")+1)||"index.html").replace(".html","");t===""&&(t="index");const i=["index","main","contact","faq","license"].includes(t);if(!o)i||(window.location.href="main.html");else try{const s=x(k,"users",o.uid),l=await w(s);if(l.exists()){const r=l.data(),c=r.role,u=document.getElementById("userName"),m=document.getElementById("userAvatar"),g=r.fullName||r.displayName||o.displayName||(c==="farmer"?"Farmer":"Customer"),v=r.profilePic||r.photoURL||o.photoURL||`https://ui-avatars.com/api/?name=${encodeURIComponent(g)}&background=4CAF50&color=fff`;u&&(u.textContent=g),m&&(m.src=v),t==="main"&&(c==="farmer"?window.location.href="farmer-dashboard.html":window.location.href="customer-dashboard.html");const b=t.startsWith("farmer-"),y=t.startsWith("customer-");c==="farmer"&&y?window.location.href="farmer-dashboard.html":c==="buyer"&&b&&(window.location.href="customer-dashboard.html")}}catch(s){console.error("Error fetching role data inside Auth Guard:",s)}})}function d(){const o=document.querySelectorAll(".cart-count, .badge");try{const e=localStorage.getItem("cart"),t=(e?JSON.parse(e):[]).reduce((n,i)=>n+i.quantity,0);o.forEach(n=>{n.textContent=t,n.style.display=t>0?"inline-flex":"none"})}catch(e){console.error("Error updating cart badge in layout loader:",e)}}
