import"./modulepreload-polyfill-B5Qt9EMX.js";import"./layout-loader-B6YrC-s6.js";/* empty css                        */import{l as o,a as F,d as f}from"./config-Cz4Z1kB5.js";import{query as T,collection as h,where as N,onSnapshot as X,getDoc as Z,doc as ee,getDocs as b}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";import{onAuthStateChanged as te,signOut as ae}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";document.addEventListener("DOMContentLoaded",function(){const w=document.getElementById("cropsGrid"),S=document.getElementById("searchCrops"),M=document.getElementById("categoryFilter"),D=document.querySelector(".cart-count"),C=document.getElementById("pagination");let m=[],E=[],L=JSON.parse(localStorage.getItem("cart"))||[];const k=8;let l=1;const B={},R=new Set;q();function q(){H(),G(),P(),o.subscribe(()=>{g()})}function H(){te(F,e=>{e?U():window.location.href="main.html"})}function U(){const e=T(h(f,"products"),N("status","==","available"));X(e,a=>{m=a.docs.map(t=>({id:t.id,...t.data()})).map(t=>{const i=m.find(r=>r.id===t.id);return i&&i.enriched?{...t,farmerName:i.farmerName,farmerLocation:i.farmerLocation,farmerPhoto:i.farmerPhoto,farmerPhone:i.farmerPhone,reviewCount:i.reviewCount,avgRating:i.avgRating,rating:i.rating,enriched:!0}:t}),E=m,l=1,g(),v()})}async function O(e){if(e.farmerId)try{B[e.farmerId]||(B[e.farmerId]=(async()=>{const n=await Z(ee(f,"users",e.farmerId));if(n.exists()){const t=n.data();return{name:t.name||t.fullName||t.displayName||"Unknown Farmer",location:t.location||t.address||t.city||t.village||t.area||"Location not specified",photo:t.photoURL||t.profileImage||t.avatar||null,phone:t.phone||t.mobile||t.contact||null}}return{name:"Unknown Farmer",location:"Location not specified",photo:null,phone:null}})());const a=await B[e.farmerId];e.farmerName=a.name,e.farmerLocation=a.location,e.farmerPhoto=a.photo,e.farmerPhone=a.phone}catch(a){console.error("Error fetching farmer details:",a),e.farmerName="Unknown Farmer",e.farmerLocation="Location not available"}try{const a=T(h(f,"reviews"),N("cropId","==",e.id)),n=await b(a);let t=[];n.forEach(i=>{const r=i.data();t.push(r)});try{(await b(h(f,"products",e.id,"reviews"))).forEach(r=>{const d=r.data();t.push(d)})}catch(i){console.log("No nested reviews found or no access:",i)}if(e.reviewCount=t.length,t.length>0){const i=t.reduce((r,d)=>r+(d.rating||0),0);e.avgRating=parseFloat((i/t.length).toFixed(1)),e.rating=e.avgRating}else e.avgRating=0,e.rating=0;console.log(`Crop ${e.name}: ${e.reviewCount} reviews, avg rating: ${e.avgRating}`)}catch(a){console.error("Error fetching reviews:",a),e.reviewCount=0,e.avgRating=0,e.rating=0}return e}function g(){const e=(l-1)*k,a=e+k,n=E.slice(e,a);if(n.length===0){w.innerHTML=`<div class="empty-state">${o.t("crops.no_crops",{},"No crops available")}</div>`;return}w.innerHTML=n.map(t=>{const i=t.description||t.desc||t.details||t.info||"",r=$(t.rating||t.avgRating||0),d=t.reviewCount===1?o.t("marketplace.review",{},"review"):o.t("marketplace.reviews",{},"reviews"),s=t.category?o.t("category."+t.category,{},t.category):o.t("marketplace.uncategorized",{},"Uncategorized");return`
            <div class="crop-card" data-id="${t.id}">
                ${t.imageUrl?`<img src="${t.imageUrl}" alt="${t.name}" class="crop-image">`:'<div class="crop-image no-image"><i class="fas fa-seedling"></i></div>'}
                
                <div class="crop-info">
                    <h3 class="crop-name">${t.name}</h3>
                    <p class="crop-price">₹${t.price}/kg</p>

                    <!-- DESCRIPTION - Show only if it exists -->
                    ${i?`
                        <div class="description-container">
                            <p class="crop-description">${i}</p>
                        </div>
                    `:""}

                    <!-- RATING SECTION WITH VIEW REVIEWS BUTTON -->
                    <div class="rating-container">
                        ${t.enriched?`
                            <div class="rating-display">
                                ${r}
                                <span class="rating-text">
                                    ${t.avgRating?t.avgRating.toFixed(1):"0.0"} 
                                    (${t.reviewCount||0} ${d})
                                </span>
                            </div>
                            ${(t.reviewCount||0)>0?`
                                <button class="view-reviews-btn" data-crop-id="${t.id}">
                                    <i class="fas fa-comment-alt"></i> ${o.t("marketplace.view_reviews",{},"View Reviews")}
                                </button>
                            `:""}
                        `:`
                            <div class="rating-display">
                                <span class="rating-text" style="color: #888;">
                                    <i class="fas fa-spinner fa-spin" style="margin-right: 5px;"></i> ${o.t("auth.loading",{},"Loading...")}
                                </span>
                            </div>
                        `}
                    </div>

                    <!-- FARMER DETAILS -->
                    <div class="farmer-details">
                        ${t.enriched?`
                            ${t.farmerPhoto?`<img src="${t.farmerPhoto}" alt="${t.farmerName}" class="farmer-avatar">`:""}
                            <div class="farmer-info">
                                <p class="farmer-name">
                                    <i class="fas fa-user"></i> ${t.farmerName||o.t("marketplace.unknown_farmer",{},"Unknown Farmer")}
                                </p>
                                <p class="farmer-location">
                                    <i class="fas fa-map-marker-alt"></i> ${t.farmerLocation||o.t("marketplace.no_location",{},"Location not specified")}
                                </p>
                            </div>
                        `:`
                            <div class="farmer-info">
                                <p class="farmer-name" style="color: #888;">
                                    <i class="fas fa-spinner fa-spin" style="margin-right: 5px;"></i> ${o.t("auth.loading",{},"Loading...")}
                                </p>
                            </div>
                        `}
                    </div>

                    <!-- CROP META DATA -->
                    <div class="crop-meta">
                        <span class="quantity">
                            <i class="fas fa-weight-hanging"></i> ${t.quantity} kg
                        </span>
                        <span class="category">
                            <i class="fas fa-tag"></i> ${s}
                        </span>
                        ${t.status==="organic"?`<span class="organic-badge"><i class="fas fa-leaf"></i> ${o.t("marketplace.organic",{},"Organic")}</span>`:""}
                    </div>
                </div>
            </div>
            `}).join(""),n.forEach(async t=>{if(!t.enriched&&!R.has(t.id)){R.add(t.id);try{await O(t),t.enriched=!0,j(t)}catch(i){console.error("Failed to enrich crop details:",t.id,i)}finally{R.delete(t.id)}}})}function j(e){const a=document.querySelector(`.crop-card[data-id="${e.id}"]`);if(!a)return;const n=a.querySelector(".rating-container");if(n){const i=$(e.rating||e.avgRating||0),r=e.reviewCount===1?o.t("marketplace.review",{},"review"):o.t("marketplace.reviews",{},"reviews");n.innerHTML=`
                <div class="rating-display">
                    ${i}
                    <span class="rating-text">
                        ${e.avgRating?e.avgRating.toFixed(1):"0.0"} 
                        (${e.reviewCount||0} ${r})
                    </span>
                </div>
                ${(e.reviewCount||0)>0?`
                    <button class="view-reviews-btn" data-crop-id="${e.id}">
                        <i class="fas fa-comment-alt"></i> ${o.t("marketplace.view_reviews",{},"View Reviews")}
                    </button>
                `:""}
            `}const t=a.querySelector(".farmer-details");t&&(t.innerHTML=`
                ${e.farmerPhoto?`<img src="${e.farmerPhoto}" alt="${e.farmerName}" class="farmer-avatar">`:""}
                <div class="farmer-info">
                    <p class="farmer-name">
                        <i class="fas fa-user"></i> ${e.farmerName||o.t("marketplace.unknown_farmer",{},"Unknown Farmer")}
                    </p>
                    <p class="farmer-location">
                        <i class="fas fa-map-marker-alt"></i> ${e.farmerLocation||o.t("marketplace.no_location",{},"Location not specified")}
                    </p>
                </div>
            `)}function $(e){const a=Math.floor(e),n=e%1>=.5,t=5-a-(n?1:0);let i="";for(let r=0;r<a;r++)i+='<i class="fas fa-star"></i>';n&&(i+='<i class="fas fa-star-half-alt"></i>');for(let r=0;r<t;r++)i+='<i class="far fa-star"></i>';return`<span class="rating-stars">${i}</span>`}async function z(e){const a=m.find(n=>n.id===e);if(!a){x(o.t("marketplace.product_not_found",{},"Product not found"),"error");return}try{let n=document.getElementById("reviewsModal");n||(n=document.createElement("div"),n.id="reviewsModal",n.className="reviews-modal",n.innerHTML=`
                <div class="reviews-modal-content">
                    <div class="reviews-header">
                        <h2 id="reviewsModalTitle">Reviews</h2>
                        <button class="close-reviews">&times;</button>
                    </div>
                    <div id="reviewsContent" class="reviews-container">
                        Loading reviews...
                    </div>
                </div>
            `,document.body.appendChild(n),n.querySelector(".close-reviews").addEventListener("click",()=>{n.style.display="none",document.body.style.overflow=""}),n.addEventListener("click",i=>{i.target===n&&(n.style.display="none",document.body.style.overflow="")})),document.getElementById("reviewsContent").innerHTML=`
            <div style="text-align: center; padding: 20px;">
                <div class="spinner"></div>
                <p>Loading reviews...</p>
            </div>
        `,n.style.display="flex",document.body.style.overflow="hidden",document.getElementById("reviewsModalTitle").textContent=o.t("orders.reviews_for_crop",{name:a.name},`Reviews for ${a.name}`);const t=await Q(e);V(t,a)}catch(n){console.error("Error showing reviews:",n),x(o.t("marketplace.failed_load_reviews",{},"Failed to load reviews"),"error")}}async function Q(e){const a=[];try{const n=T(h(f,"reviews"),N("cropId","==",e));(await b(n)).forEach(i=>{const r=i.data();a.push({id:i.id,...r,customerName:r.customerName||"Anonymous Customer",rating:r.rating||0,comment:r.comment||"",createdAt:r.createdAt||new Date})});try{const i=h(f,"products",e,"reviews");(await b(i)).forEach(d=>{const s=d.data();a.push({id:d.id,...s,customerName:s.customerName||s.name||"Anonymous Customer",rating:s.rating||0,comment:s.comment||"",createdAt:s.createdAt||new Date})})}catch(i){console.log("No nested reviews found:",i)}}catch(n){throw console.error("Error fetching reviews:",n),n}return a}function V(e,a){const n=document.getElementById("reviewsContent");if(!e||e.length===0){n.innerHTML=`
            <div class="empty-reviews">
                <i class="fas fa-comment-slash" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                <h3>${o.t("orders.no_reviews",{},"No Reviews Yet")}</h3>
                <p>${o.t("orders.first_review",{},"Be the first to review this product!")}</p>
            </div>
        `;return}const i=(e.reduce((s,u)=>s+(u.rating||0),0)/e.length).toFixed(1),r=e.length===1?o.t("orders.based_on_review",{count:e.length},`Based on ${e.length} review`):o.t("orders.based_on_reviews",{count:e.length},`Based on ${e.length} reviews`);let d=`
        <div class="average-rating-summary" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: #4CAF50;">${i}</div>
                    <div style="color: #666;">${o.t("marketplace.out_of_5",{},"out of 5")}</div>
                </div>
                <div>
                    <div style="margin-bottom: 5px;">${$(parseFloat(i))}</div>
                    <div style="color: #666;">${r}</div>
                </div>
            </div>
        </div>
        
        <div class="reviews-list">
    `;e.sort((s,u)=>{var c,y;const p=(c=s.createdAt)!=null&&c.toDate?s.createdAt.toDate():new Date(s.createdAt||0);return((y=u.createdAt)!=null&&y.toDate?u.createdAt.toDate():new Date(u.createdAt||0))-p}),e.forEach((s,u)=>{let p="Date not available";if(s.createdAt)try{const c=o.getCurrentLang(),y=c==="te"?"te-IN":c==="hi"?"hi-IN":c==="ta"?"ta-IN":"en-IN";s.createdAt.toDate?p=s.createdAt.toDate().toLocaleDateString(y,{year:"numeric",month:"short",day:"numeric"}):s.createdAt instanceof Date&&(p=s.createdAt.toLocaleDateString(y,{year:"numeric",month:"short",day:"numeric"}))}catch(c){console.log("Error formatting date:",c)}const _=s.customerName?s.customerName.split(" ").map(c=>c[0]).join("").toUpperCase().slice(0,2):"??";d+=`
            <div class="review-item" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: white;">
                <div class="review-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div class="reviewer-info" style="display: flex; align-items: center; gap: 10px;">
                        <div class="reviewer-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: #4CAF50; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${_}
                        </div>
                        <div>
                            <div class="reviewer-name" style="font-weight: bold;">${s.customerName}</div>
                            <div class="review-date" style="font-size: 12px; color: #666;">${p}</div>
                        </div>
                    </div>
                    <div class="review-rating" style="display: flex; align-items: center; gap: 5px;">
                        <div class="review-stars" style="color: #FFD700;">
                            ${$(s.rating)}
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
        `}),d+="</div>",n.innerHTML=d}function v(){C.innerHTML="";const e=Math.ceil(E.length/k);if(e<=1)return;const a=document.createElement("button");a.textContent=o.t("buttons.prev",{},"« Prev"),a.disabled=l===1,a.addEventListener("click",()=>{l>1&&(l--,g(),v())}),C.appendChild(a);for(let t=1;t<=e;t++){const i=document.createElement("button");i.textContent=t,i.classList.add("pagination-btn"),t===l&&i.classList.add("active"),i.addEventListener("click",()=>{l=t,g(),v()}),C.appendChild(i)}const n=document.createElement("button");n.textContent=o.t("buttons.next",{},"Next »"),n.disabled=l===e,n.addEventListener("click",()=>{l<e&&(l++,g(),v())}),C.appendChild(n)}function A(){const e=S.value.toLowerCase(),a=M.value;E=m.filter(n=>{const t=n.name.toLowerCase().includes(e)||n.description&&n.description.toLowerCase().includes(e),i=a==="all"||n.category===a;return t&&i}),l=1,g(),v()}function P(){const e=L.reduce((a,n)=>a+n.quantity,0);D.textContent=e,D.style.display=e>0?"flex":"none"}function G(){S.addEventListener("input",A),M.addEventListener("change",A),document.querySelector("#addToCartModal .close-btn").addEventListener("click",()=>{document.getElementById("addToCartModal").style.display="none",document.body.style.overflow=""}),window.addEventListener("click",e=>{e.target===document.getElementById("addToCartModal")&&(document.getElementById("addToCartModal").style.display="none",document.body.style.overflow="")}),w&&w.addEventListener("click",e=>{const a=e.target.closest(".view-reviews-btn");if(a){e.stopPropagation();const t=a.dataset.cropId;z(t);return}const n=e.target.closest(".crop-card");n&&Y(n.dataset.id)}),W(),J()}function W(){const e=document.getElementById("profileIcon"),a=document.getElementById("profileDropdown");e&&a&&(e.addEventListener("click",n=>{n.stopPropagation(),a.style.display=a.style.display==="block"?"none":"block"}),document.addEventListener("click",n=>{!a.contains(n.target)&&n.target!==e&&(a.style.display="none")}))}function J(){const e=document.getElementById("logoutBtn"),a=document.getElementById("logoutConfirmModal"),n=document.getElementById("confirmLogoutBtn"),t=document.getElementById("cancelLogoutBtn");e&&a&&n&&t&&(e.addEventListener("click",i=>{i.preventDefault(),a.classList.remove("hidden")}),t.addEventListener("click",()=>{a.classList.add("hidden")}),n.addEventListener("click",async()=>{try{await ae(F),localStorage.removeItem("cart"),window.location.href="main.html"}catch(i){console.error("Logout error:",i),x(o.t("marketplace.logout_error",{},"Error during logout. Please try again."),"error")}}))}function Y(e){const a=m.find(r=>r.id===e);if(!a)return;document.getElementById("modalCropName").textContent=a.name,document.getElementById("modalCropPrice").textContent=`₹${a.price}/kg`,document.getElementById("modalCropStock").textContent=`${a.quantity} kg available`;const n=a.description||a.desc||a.details||a.info||"",t=document.getElementById("modalCropDescription");t&&(t.textContent=n,t.style.display=n?"block":"none"),a.imageUrl?document.getElementById("modalCropImage").src=a.imageUrl:document.getElementById("modalCropImage").src="images/default-crop.jpg";const i=document.getElementById("quantityInput");i.value=1,i.max=a.quantity,I(a.price,1),document.getElementById("decrementQty").onclick=()=>{i.value>1&&i.value--,I(a.price,i.value)},document.getElementById("incrementQty").onclick=()=>{i.value<a.quantity&&i.value++,I(a.price,i.value)},i.oninput=()=>{i.value<1&&(i.value=1),i.value>a.quantity&&(i.value=a.quantity),I(a.price,i.value)},document.getElementById("addToCartBtn").onclick=()=>{K(a,parseInt(i.value)),document.getElementById("addToCartModal").style.display="none",document.body.style.overflow=""},document.getElementById("addToCartModal").style.display="flex",document.body.style.overflow="hidden"}function I(e,a){document.getElementById("modalTotalPrice").textContent=`₹${(e*a).toFixed(2)}`}function K(e,a){const n=L.find(t=>t.id===e.id);n?n.quantity+=a:L.push({id:e.id,name:e.name,price:e.price,quantity:a,image:e.imageUrl||"images/default-crop.jpg",farmerId:e.farmerId,farmerName:e.farmerName,unit:"kg"}),localStorage.setItem("cart",JSON.stringify(L)),P(),x(o.t("marketplace.added_to_cart",{quantity:a,name:e.name},`${a} kg ${e.name} added to cart`),"success")}function x(e,a="info"){const n=document.getElementById("toast");n&&(n.textContent=e,n.className=`toast toast-${a} show`,setTimeout(()=>{n.classList.remove("show")},3e3))}});
