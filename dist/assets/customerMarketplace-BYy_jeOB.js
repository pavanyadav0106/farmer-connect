import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css            *//* empty css                          *//* empty css                        */import"./layout-loader-LuVZLwht.js";import{a as M,d as m}from"./config--Onoqk_Z.js";import{query as x,collection as f,where as b,onSnapshot as W,getDoc as J,doc as Y,getDocs as C}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";import{onAuthStateChanged as K,signOut as X}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";document.addEventListener("DOMContentLoaded",function(){const B=document.getElementById("cropsGrid"),$=document.getElementById("searchCrops"),k=document.getElementById("categoryFilter"),R=document.querySelector(".cart-count"),p=document.getElementById("pagination");let l=[],y=[],h=JSON.parse(localStorage.getItem("cart"))||[];const I=8;let d=1;D();function D(){P(),j(),S()}function P(){K(M,t=>{t?q():window.location.href="main.html"})}function q(){const t=x(f(m,"products"),b("status","==","available"));W(t,async a=>{l=a.docs.map(e=>({id:e.id,...e.data()})),l.length>0;for(let e of l)await F(e);y=l,d=1,u(),g()})}async function F(t){if(t.farmerId)try{const a=await J(Y(m,"users",t.farmerId));if(a.exists()){const e=a.data();t.farmerName=e.name||e.fullName||e.displayName||"Unknown Farmer",t.farmerLocation=e.location||e.address||e.city||e.village||e.area||"Location not specified",t.farmerPhoto=e.photoURL||e.profileImage||e.avatar||null,t.farmerPhone=e.phone||e.mobile||e.contact||null}}catch(a){console.error("Error fetching farmer details:",a),t.farmerName="Unknown Farmer",t.farmerLocation="Location not available"}try{const a=x(f(m,"reviews"),b("cropId","==",t.id)),e=await C(a);let n=[];e.forEach(o=>{const i=o.data();n.push(i)});try{(await C(f(m,"products",t.id,"reviews"))).forEach(i=>{const s=i.data();n.push(s)})}catch(o){console.log("No nested reviews found or no access:",o)}if(t.reviewCount=n.length,n.length>0){const o=n.reduce((i,s)=>i+(s.rating||0),0);t.avgRating=parseFloat((o/n.length).toFixed(1)),t.rating=t.avgRating}else t.avgRating=0,t.rating=0;console.log(`Crop ${t.name}: ${t.reviewCount} reviews, avg rating: ${t.avgRating}`)}catch(a){console.error("Error fetching reviews:",a),t.reviewCount=0,t.avgRating=0,t.rating=0}return t}function u(){const t=(d-1)*I,a=t+I,e=y.slice(t,a);if(e.length===0){B.innerHTML='<div class="empty-state">No crops available</div>';return}B.innerHTML=e.map(n=>{const o=n.description||n.desc||n.details||n.info||"",i=L(n.rating||n.avgRating||0);return`
            <div class="crop-card" data-id="${n.id}">
                ${n.imageUrl?`<img src="${n.imageUrl}" alt="${n.name}" class="crop-image">`:'<div class="crop-image no-image"><i class="fas fa-seedling"></i></div>'}
                
                <div class="crop-info">
                    <h3 class="crop-name">${n.name}</h3>
                    <p class="crop-price">₹${n.price}/kg</p>

                    <!-- DESCRIPTION - Show only if it exists -->
                    ${o?`
                        <div class="description-container">
                            <p class="crop-description">${o}</p>
                        </div>
                    `:""}

                    <!-- RATING SECTION WITH VIEW REVIEWS BUTTON -->
                    <div class="rating-container">
                        <div class="rating-display">
                            ${i}
                            <span class="rating-text">
                                ${n.avgRating?n.avgRating.toFixed(1):"0.0"} 
                                (${n.reviewCount||0} ${n.reviewCount===1?"review":"reviews"})
                            </span>
                        </div>
                        ${(n.reviewCount||0)>0?`
                            <button class="view-reviews-btn" data-crop-id="${n.id}">
                                <i class="fas fa-comment-alt"></i> View Reviews
                            </button>
                        `:""}
                    </div>

                    <!-- FARMER DETAILS -->
                    <div class="farmer-details">
                        ${n.farmerPhoto?`<img src="${n.farmerPhoto}" alt="${n.farmerName}" class="farmer-avatar">`:""}
                        <div class="farmer-info">
                            <p class="farmer-name">
                                <i class="fas fa-user"></i> ${n.farmerName||"Unknown Farmer"}
                            </p>
                            <p class="farmer-location">
                                <i class="fas fa-map-marker-alt"></i> ${n.farmerLocation||"Location not specified"}
                            </p>
                        </div>
                    </div>

                    <!-- CROP META DATA -->
                    <div class="crop-meta">
                        <span class="quantity">
                            <i class="fas fa-weight-hanging"></i> ${n.quantity} kg
                        </span>
                        <span class="category">
                            <i class="fas fa-tag"></i> ${n.category||"Uncategorized"}
                        </span>
                        ${n.status==="organic"?'<span class="organic-badge"><i class="fas fa-leaf"></i> Organic</span>':""}
                    </div>
                </div>
            </div>
            `}).join(""),document.querySelectorAll(".crop-card").forEach(n=>{n.addEventListener("click",o=>{o.target.closest(".view-reviews-btn")||V(n.dataset.id)})}),document.querySelectorAll(".view-reviews-btn").forEach(n=>{n.addEventListener("click",o=>{o.stopPropagation();const i=n.dataset.cropId;console.log("View reviews clicked for crop:",i),U(i)})})}function L(t){const a=Math.floor(t),e=t%1>=.5,n=5-a-(e?1:0);let o="";for(let i=0;i<a;i++)o+='<i class="fas fa-star"></i>';e&&(o+='<i class="fas fa-star-half-alt"></i>');for(let i=0;i<n;i++)o+='<i class="far fa-star"></i>';return`<span class="rating-stars">${o}</span>`}async function U(t){const a=l.find(e=>e.id===t);if(!a){E("Product not found","error");return}try{let e=document.getElementById("reviewsModal");e||(e=document.createElement("div"),e.id="reviewsModal",e.className="reviews-modal",e.innerHTML=`
                <div class="reviews-modal-content">
                    <div class="reviews-header">
                        <h2 id="reviewsModalTitle">Reviews</h2>
                        <button class="close-reviews">&times;</button>
                    </div>
                    <div id="reviewsContent" class="reviews-container">
                        Loading reviews...
                    </div>
                </div>
            `,document.body.appendChild(e),e.querySelector(".close-reviews").addEventListener("click",()=>{e.style.display="none",document.body.style.overflow=""}),e.addEventListener("click",o=>{o.target===e&&(e.style.display="none",document.body.style.overflow="")})),document.getElementById("reviewsContent").innerHTML=`
            <div style="text-align: center; padding: 20px;">
                <div class="spinner"></div>
                <p>Loading reviews...</p>
            </div>
        `,e.style.display="block",document.body.style.overflow="hidden",document.getElementById("reviewsModalTitle").textContent=`Reviews for ${a.name}`;const n=await H(t);O(n,a)}catch(e){console.error("Error showing reviews:",e),E("Failed to load reviews","error")}}async function H(t){const a=[];try{const e=x(f(m,"reviews"),b("cropId","==",t));(await C(e)).forEach(o=>{const i=o.data();a.push({id:o.id,...i,customerName:i.customerName||"Anonymous Customer",rating:i.rating||0,comment:i.comment||"",createdAt:i.createdAt||new Date})});try{const o=f(m,"products",t,"reviews");(await C(o)).forEach(s=>{const r=s.data();a.push({id:s.id,...r,customerName:r.customerName||r.name||"Anonymous Customer",rating:r.rating||0,comment:r.comment||"",createdAt:r.createdAt||new Date})})}catch(o){console.log("No nested reviews found:",o)}}catch(e){throw console.error("Error fetching reviews:",e),e}return a}function O(t,a){const e=document.getElementById("reviewsContent");if(!t||t.length===0){e.innerHTML=`
            <div class="empty-reviews">
                <i class="fas fa-comment-slash" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                <h3>No Reviews Yet</h3>
                <p>Be the first to review this product!</p>
            </div>
        `;return}const o=(t.reduce((s,r)=>s+(r.rating||0),0)/t.length).toFixed(1);let i=`
        <div class="average-rating-summary" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: #4CAF50;">${o}</div>
                    <div style="color: #666;">out of 5</div>
                </div>
                <div>
                    <div style="margin-bottom: 5px;">${L(parseFloat(o))}</div>
                    <div style="color: #666;">Based on ${t.length} ${t.length===1?"review":"reviews"}</div>
                </div>
            </div>
        </div>
        
        <div class="reviews-list">
    `;t.sort((s,r)=>{var c,N;const v=(c=s.createdAt)!=null&&c.toDate?s.createdAt.toDate():new Date(s.createdAt||0);return((N=r.createdAt)!=null&&N.toDate?r.createdAt.toDate():new Date(r.createdAt||0))-v}),t.forEach((s,r)=>{let v="Date not available";if(s.createdAt)try{s.createdAt.toDate?v=s.createdAt.toDate().toLocaleDateString("en-IN",{year:"numeric",month:"short",day:"numeric"}):s.createdAt instanceof Date&&(v=s.createdAt.toLocaleDateString("en-IN",{year:"numeric",month:"short",day:"numeric"}))}catch(c){console.log("Error formatting date:",c)}const A=s.customerName?s.customerName.split(" ").map(c=>c[0]).join("").toUpperCase().slice(0,2):"??";i+=`
            <div class="review-item" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: white;">
                <div class="review-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div class="reviewer-info" style="display: flex; align-items: center; gap: 10px;">
                        <div class="reviewer-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: #4CAF50; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${A}
                        </div>
                        <div>
                            <div class="reviewer-name" style="font-weight: bold;">${s.customerName}</div>
                            <div class="review-date" style="font-size: 12px; color: #666;">${v}</div>
                        </div>
                    </div>
                    <div class="review-rating" style="display: flex; align-items: center; gap: 5px;">
                        <div class="review-stars" style="color: #FFD700;">
                            ${L(s.rating)}
                        </div>
                        <span style="font-weight: bold;">${s.rating}.0</span>
                    </div>
                </div>
                ${s.comment?`
                    <div class="review-comment" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; color: #333;">
                        ${s.comment}
                    </div>
                `:""}
            </div>
        `}),i+="</div>",e.innerHTML=i}function g(){p.innerHTML="";const t=Math.ceil(y.length/I);if(t<=1)return;const a=document.createElement("button");a.textContent="« Prev",a.disabled=d===1,a.addEventListener("click",()=>{d>1&&(d--,u(),g())}),p.appendChild(a);for(let n=1;n<=t;n++){const o=document.createElement("button");o.textContent=n,o.classList.add("pagination-btn"),n===d&&o.classList.add("active"),o.addEventListener("click",()=>{d=n,u(),g()}),p.appendChild(o)}const e=document.createElement("button");e.textContent="Next »",e.disabled=d===t,e.addEventListener("click",()=>{d<t&&(d++,u(),g())}),p.appendChild(e)}function T(){const t=$.value.toLowerCase(),a=k.value;y=l.filter(e=>{const n=e.name.toLowerCase().includes(t)||e.description&&e.description.toLowerCase().includes(t),o=a==="all"||e.category===a;return n&&o}),d=1,u(),g()}function S(){const t=h.reduce((a,e)=>a+e.quantity,0);R.textContent=t,R.style.display=t>0?"flex":"none"}function j(){$.addEventListener("input",T),k.addEventListener("change",T),document.querySelector("#addToCartModal .close-btn").addEventListener("click",()=>{document.getElementById("addToCartModal").style.display="none",document.body.style.overflow=""}),window.addEventListener("click",t=>{t.target===document.getElementById("addToCartModal")&&(document.getElementById("addToCartModal").style.display="none",document.body.style.overflow="")}),Q(),z()}function Q(){const t=document.getElementById("profileIcon"),a=document.getElementById("profileDropdown");t&&a&&(t.addEventListener("click",e=>{e.stopPropagation(),a.style.display=a.style.display==="block"?"none":"block"}),document.addEventListener("click",e=>{!a.contains(e.target)&&e.target!==t&&(a.style.display="none")}))}function z(){const t=document.getElementById("logoutBtn"),a=document.getElementById("logoutConfirmModal"),e=document.getElementById("confirmLogoutBtn"),n=document.getElementById("cancelLogoutBtn");t&&a&&e&&n&&(t.addEventListener("click",o=>{o.preventDefault(),a.classList.remove("hidden")}),n.addEventListener("click",()=>{a.classList.add("hidden")}),e.addEventListener("click",async()=>{try{await X(M),localStorage.removeItem("cart"),window.location.href="main.html"}catch(o){console.error("Logout error:",o),E("Error during logout. Please try again.","error")}}))}function V(t){const a=l.find(n=>n.id===t);if(!a)return;document.getElementById("modalCropName").textContent=a.name,document.getElementById("modalCropPrice").textContent=`₹${a.price}/kg`,document.getElementById("modalCropStock").textContent=`${a.quantity} kg available`,a.imageUrl?document.getElementById("modalCropImage").src=a.imageUrl:document.getElementById("modalCropImage").src="images/default-crop.jpg";const e=document.getElementById("quantityInput");e.value=1,e.max=a.quantity,w(a.price,1),document.getElementById("decrementQty").onclick=()=>{e.value>1&&e.value--,w(a.price,e.value)},document.getElementById("incrementQty").onclick=()=>{e.value<a.quantity&&e.value++,w(a.price,e.value)},e.oninput=()=>{e.value<1&&(e.value=1),e.value>a.quantity&&(e.value=a.quantity),w(a.price,e.value)},document.getElementById("addToCartBtn").onclick=()=>{G(a,parseInt(e.value)),document.getElementById("addToCartModal").style.display="none",document.body.style.overflow=""},document.getElementById("addToCartModal").style.display="block",document.body.style.overflow="hidden"}function w(t,a){document.getElementById("modalTotalPrice").textContent=`₹${(t*a).toFixed(2)}`}function G(t,a){const e=h.find(n=>n.id===t.id);e?e.quantity+=a:h.push({id:t.id,name:t.name,price:t.price,quantity:a,image:t.imageUrl||"images/default-crop.jpg",farmerId:t.farmerId,farmerName:t.farmerName,unit:"kg"}),localStorage.setItem("cart",JSON.stringify(h)),S(),E(`${a} kg ${t.name} added to cart`,"success")}function E(t,a="info"){const e=document.getElementById("toast");e&&(e.textContent=t,e.className=`toast toast-${a} show`,setTimeout(()=>{e.classList.remove("show")},3e3))}});
