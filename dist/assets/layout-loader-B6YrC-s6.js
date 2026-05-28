import{a as b,d as k}from"./config-Cz4Z1kB5.js";import{doc as w,getDoc as x}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";import{signOut as L}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";(function(){const e=window.location.pathname;(e.substring(e.lastIndexOf("/")+1)||"index.html").replace(".html","").startsWith("customer-")?localStorage.getItem("customerDarkMode")==="true"?document.body.classList.add("customer-dark-mode"):document.body.classList.add("customer-light-mode"):localStorage.getItem("darkMode")==="enabled"&&document.body.classList.add("dark")})();document.addEventListener("DOMContentLoaded",()=>{const o=document.createElement("style");o.textContent=`
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
  `,document.head.appendChild(o),E(),S()});function E(){const o=window.location.pathname,e=o.substring(o.lastIndexOf("/")+1)||"index.html",t=e.replace(".html",""),a=t.startsWith("customer-"),n=document.getElementById("top-nav-placeholder");if(n){const r=!!document.getElementById("sidebar-placeholder"),d=`
      <div class="top-nav-left" style="display: flex; gap: 15px; align-items: center;">
        ${!(t==="customer-dashboard"||t==="farmer-dashboard"||t==="index"||t==="main")?`
        <button class="back-btn" onclick="if(window.history.length > 1) window.history.back(); else window.location.href='index.html';" aria-label="Go back" style="background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;" title="Back">
          <i class="fas fa-arrow-left"></i>
        </button>
        `:""}
        ${r?`
          <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu">
            <i class="fas fa-bars"></i>
          </button>
        `:""}
      </div>
    `,m=`
      <div class="header-right" style="display: flex; align-items: center; gap: 15px;">
        <div class="language-selector">
          <select id="languageSelect" aria-label="Select language" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #ccc; background: white; cursor: pointer;">
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
            <option value="hi">हिन्दी</option>
            <option value="ta">தமிழ்</option>
          </select>
        </div>
        ${a?`
        <a href="customer-cart.html" class="cart-icon" style="position: relative; color: inherit; font-size: 20px; text-decoration: none; display: inline-flex; align-items: center;">
          <i class="fas fa-shopping-cart"></i>
          <span class="cart-count badge" style="position: absolute; top: -10px; right: -10px; background: #dc3545; color: white; border-radius: 50%; font-size: 11px; padding: 2px 6px; font-weight: bold; line-height: 1; display: none;">0</span>
        </a>
        `:""}
        <button id="darkModeToggle" class="dark-toggle dark-mode-toggle" aria-label="Toggle dark mode" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">
          <i id="darkModeIcon" class="fas fa-moon"></i>
        </button>
        <div class="user-profile" id="userProfileHeader" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
          <img id="userAvatar" src="https://ui-avatars.com/api/?name=User&background=4CAF50&color=fff" style="width: 32px; height: 32px; min-width: 32px; object-fit: cover; border-radius: 50%;">
          <span id="userName" class="hide-on-mobile" style="font-weight: 500; font-size: 14px;">Loading...</span>
        </div>
      </div>
    `;n.innerHTML=`
      <div class="top-nav">
        ${d}
        <span class="logo-text" style="flex-grow: 1; justify-content: center;">🌾 <span data-i18n="app.title">FARMER CONNECT</span></span>
        ${m}
      </div>
    `,M(a),C(),a&&(f(),window.addEventListener("storage",g=>{g.key==="cart"&&f()}),window.addEventListener("cartUpdated",f))}const i=document.getElementById("sidebar-placeholder");i&&((i.getAttribute("data-role")||(a?"customer":"farmer"))==="customer"?i.innerHTML=`
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
      `,I(e),B());const s=document.getElementById("footer-placeholder");s&&(s.innerHTML=`
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
    `);const l=document.getElementById("logout-modal-placeholder");l&&(l.innerHTML=`
      <div id="logoutModal" class="logout-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1300; justify-content:center; align-items:center;">
        <div class="logout-modal-content" style="background:white; padding:30px; border-radius:12px; text-align:center; box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-width:90%; width:350px;">
          <span class="close" id="closeLogoutModal" style="float:right; cursor:pointer; font-size:24px; font-weight:bold; margin-top:-15px;">&times;</span>
          <p style="font-size:18px; margin-bottom:20px;" data-i18n="logout.confirm">Are you sure you want to log out?</p>
          <button id="confirmLogout" style="background:#d32f2f; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600; margin-right:10px;" data-i18n="logout.yes">Yes</button>
          <button id="cancelLogout" style="background:#e0e0e0; color:#333; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600;" data-i18n="logout.no">No</button>
        </div>
      </div>
    `,D())}function I(o){const e=document.getElementById("sidebar");if(!e)return;const t=e.querySelectorAll("a.nav-link");let a=o.replace(".html","");(!a||a==="index")&&(a="index"),t.forEach(n=>{const i=n.getAttribute("href");if(!i)return;i.replace(".html","")===a&&n.classList.add("active-page")})}function B(){const o=document.getElementById("menu-toggle"),e=document.getElementById("sidebar"),t=document.querySelector(".overlay");o&&e&&o.addEventListener("click",i=>{i.stopPropagation(),e.classList.toggle("active"),e.classList.toggle("show"),t.classList.toggle("active"),t.classList.toggle("show")}),t&&t.addEventListener("click",()=>{e.classList.remove("active","show"),t.classList.remove("active","show");const i=document.getElementById("weatherPopup");i&&i.classList.remove("active")});const a=document.getElementById("weatherButton");a&&a.addEventListener("click",i=>{i.preventDefault();const s=document.getElementById("weatherPopup");s&&(s.classList.add("active"),t&&t.classList.add("active")),e.classList.remove("active","show")});const n=document.querySelector("#weatherPopup .close-btn, #weatherPopup .close");n&&n.addEventListener("click",()=>{const i=document.getElementById("weatherPopup");i&&i.classList.remove("active"),t&&t.classList.remove("active")})}function M(o){const e=document.getElementById("darkModeToggle");if(e)if(o){const t=localStorage.getItem("customerDarkMode")==="true";p(t),e.addEventListener("click",()=>{const n=!document.body.classList.contains("customer-dark-mode");localStorage.setItem("customerDarkMode",n),p(n),window.dispatchEvent(new CustomEvent("customerDarkModeChanged",{detail:{isDarkMode:n}}))})}else{const t=localStorage.getItem("darkMode")==="enabled";h(t),e.addEventListener("click",()=>{const n=!document.body.classList.contains("dark");localStorage.setItem("darkMode",n?"enabled":"disabled"),h(n)})}}function p(o){const e=document.body,t=document.getElementById("darkModeToggle"),a=t?t.querySelector("i"):null;o?(e.classList.add("customer-dark-mode"),e.classList.remove("customer-light-mode"),a&&(a.className="fas fa-sun")):(e.classList.add("customer-light-mode"),e.classList.remove("customer-dark-mode"),a&&(a.className="fas fa-moon"));let n=document.querySelector('meta[name="theme-color"]');n&&(n.content=o?"#121212":"#4CAF50")}function h(o){const e=document.body,t=document.getElementById("darkModeIcon");o?(e.classList.add("dark"),t&&(t.classList.remove("fa-moon"),t.classList.add("fa-sun"))):(e.classList.remove("dark"),t&&(t.classList.remove("fa-sun"),t.classList.add("fa-moon")))}function C(){const o=document.getElementById("languageSelect");if(!o)return;const e=localStorage.getItem("language")||"en";o.value=e,o.addEventListener("change",async t=>{const a=t.target.value;window.languageManager?await window.languageManager.changeLanguage(a):(localStorage.setItem("language",a),window.location.reload())})}function D(){const o=document.getElementById("logoutBtn"),e=document.getElementById("logoutModal"),t=document.getElementById("closeLogoutModal"),a=document.getElementById("confirmLogout"),n=document.getElementById("cancelLogout");o&&e&&o.addEventListener("click",s=>{s.preventDefault(),e.style.display="flex"});const i=()=>{e&&(e.style.display="none")};t&&t.addEventListener("click",i),n&&n.addEventListener("click",i),a&&a.addEventListener("click",()=>{L(b).then(()=>{localStorage.removeItem("cart"),window.location.href="main.html"}).catch(s=>{console.error("Sign out error:",s),alert("Failed to log out. Please try again.")})}),window.addEventListener("click",s=>{s.target===e&&i()})}function S(){b.onAuthStateChanged(async o=>{const e=window.location.pathname;let a=(e.substring(e.lastIndexOf("/")+1)||"index.html").replace(".html","");a===""&&(a="index");const i=["index","main","contact","faq","license"].includes(a);if(!o)i||(window.location.href="main.html");else try{const s=w(k,"users",o.uid),l=await x(s);if(l.exists()){const r=l.data(),c=r.role,u=document.getElementById("userName"),d=document.getElementById("userAvatar"),m=r.fullName||r.displayName||o.displayName||(c==="farmer"?"Farmer":"Customer"),g=r.profilePic||r.photoURL||o.photoURL||`https://ui-avatars.com/api/?name=${encodeURIComponent(m)}&background=4CAF50&color=fff`;u&&(u.textContent=m),d&&(d.src=g),a==="main"&&(c==="farmer"?window.location.href="farmer-dashboard.html":window.location.href="customer-dashboard.html");const v=a.startsWith("farmer-"),y=a.startsWith("customer-");c==="farmer"&&y?window.location.href="farmer-dashboard.html":c==="buyer"&&v&&(window.location.href="customer-dashboard.html")}}catch(s){console.error("Error fetching role data inside Auth Guard:",s)}})}function f(){const o=document.querySelectorAll(".cart-count, .badge");try{const e=localStorage.getItem("cart"),a=(e?JSON.parse(e):[]).reduce((n,i)=>n+i.quantity,0);o.forEach(n=>{n.textContent=a,n.style.display=a>0?"inline-flex":"none"})}catch(e){console.error("Error updating cart badge in layout loader:",e)}}
