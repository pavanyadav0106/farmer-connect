import"./modulepreload-polyfill-B5Qt9EMX.js";import"./layout-loader-B6YrC-s6.js";/* empty css                        */import{l as a,a as ae,d as I}from"./config-Cz4Z1kB5.js";import{query as x,collection as C,where as B,onSnapshot as it,getDocs as R,doc as Ee,getDoc as dt,updateDoc as je,serverTimestamp as oe,addDoc as ct}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";import{onAuthStateChanged as lt}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";document.addEventListener("DOMContentLoaded",()=>{const Ie=document.getElementById("backBtn"),be=document.getElementById("customerName"),Be=document.getElementById("lastUpdated"),$e=document.getElementById("themeToggleBtn"),Le=document.getElementById("totalOrdersCount"),Ce=document.getElementById("activeOrdersCount"),xe=document.getElementById("completedOrdersCount"),ke=document.getElementById("cancelledOrdersCount"),k=document.getElementById("statusFilter"),N=document.getElementById("dateFilter"),Ne=document.getElementById("resetFilters"),_=document.getElementById("orderSearch"),A=document.getElementById("sortFilter"),j=document.getElementById("viewListBtn"),X=document.getElementById("viewGridBtn"),U=document.getElementById("ordersTableBody"),se=document.querySelector(".orders-list"),L=document.getElementById("ordersGridContainer"),Y=document.getElementById("pageSizeSelect"),ie=document.getElementById("firstPageBtn"),de=document.getElementById("prevPageBtn"),ce=document.getElementById("nextPageBtn"),le=document.getElementById("lastPageBtn"),ue=document.getElementById("pageNumbers"),me=document.getElementById("paginationInfo"),fe=document.getElementById("emptyState"),_e=document.getElementById("refreshOrders"),V=document.getElementById("orderModal"),Xe=document.getElementById("modalBody"),Ae=document.querySelector(".close-btn"),Q=document.getElementById("cancelOrderBtn"),J=document.getElementById("trackOrderBtn"),Se=document.getElementById("downloadInvoiceBtn"),S=document.getElementById("addReviewBtn"),Me=document.getElementById("modalOrderId"),ve=document.getElementById("modalOrderStatus"),P=document.getElementById("reviewModal"),K=document.getElementById("existingReviewsModal"),Oe=document.getElementById("reviewForm"),H=document.querySelectorAll(".star-rating"),z=document.getElementById("reviewRating"),M=document.getElementById("reviewComment"),W=document.getElementById("charCount"),Te=document.querySelectorAll(".close-review-modal"),De=document.querySelectorAll(".close-reviews-modal"),pe=document.getElementById("reviewsContainer"),Fe=document.getElementById("ordersLoadingOverlay");let $=[],O=[],G=null,l=1,T=10,D=null,Z=null,f=null,h=null;Ye();function Ye(){Qe(),ot(),a.subscribe(()=>{y(),ye(),Ue(),D&&ge(D)})}function Qe(){lt(ae,t=>{t?(be&&(be.textContent=t.displayName||a.t("table.customer",{},"Customer")),qe(t.uid)):(G&&G(),window.location.href="login.html")})}function qe(t){try{w(!0);const e=x(C(I,"orders"),B("customerId","==",t));G&&G(),G=it(e,r=>{$=r.docs.map(o=>{const n=o.data(),s=n.createdAt&&typeof n.createdAt.toDate=="function"?n.createdAt.toDate():new Date,d=(Array.isArray(n.items)?n.items:[]).reduce((i,m)=>i+(m.price||0)*(m.quantity||0),0);return{id:o.id,...n,date:s,totalAmount:d}}),ye(),Ue(),l=1,y(),w(!1)},r=>{console.error("Error loading orders:",r),v(a.t("orders.load_failed",{},"Failed to load orders"),"error"),he(),w(!1)})}catch(e){console.error("Error loading orders:",e),v(a.t("orders.load_failed",{},"Failed to load orders"),"error"),he(),w(!1)}}function y(){const t=(k==null?void 0:k.value)||"all",e=(N==null?void 0:N.value)||"all",r=((_==null?void 0:_.value)||"").trim().toLowerCase(),o=new Date;O=$.filter(c=>{const p=F(c.status),re=t==="all"||p===t.toLowerCase();let g=!0;if(e!=="all"){const q=c.date||new Date,ne=(o-q)/(1e3*60*60*24);switch(e){case"today":g=ne<1;break;case"week":g=ne<7;break;case"month":g=ne<30;break;default:g=!0}}let b=!0;if(r){const q=c.farmerName||c.farmer&&c.farmer.name||"farmer",E=(c.items||[]).map(st=>st.name||"").join(" ");b=`${c.id} ${q} ${E}`.toLowerCase().includes(r)}return re&&g&&b});const n=(A==null?void 0:A.value)||"latest";if(O.sort((c,p)=>{switch(n){case"oldest":return c.date-p.date;case"amountHigh":return(p.totalAmount||0)-(c.totalAmount||0);case"amountLow":return(c.totalAmount||0)-(p.totalAmount||0);case"latest":default:return p.date-c.date}}),!O.length){l=1,Re([]),he(),Ve(0,0,0);return}fe.style.display="none";const s=O.length,u=Math.max(1,Math.ceil(s/T));l>u&&(l=u);const d=(l-1)*T,i=Math.min(d+T,s),m=O.slice(d,i);Re(m),at(u),Ve(d+1,i,s)}function Re(t){Je(t),Ke(t)}function Je(t){U&&(U.innerHTML="",t.forEach(e=>{const r=Array.isArray(e.items)?e.items:[],o=e.totalAmount||0,n=r.map(c=>`${c.name} (${c.quantity})`).join(", "),s=e.farmerName||e.farmer&&e.farmer.name||"Farmer",u=ee(e.status),d=te(e.status),i=document.createElement("tr");i.innerHTML=`
        <td>${e.id}</td>
        <td>${ze(e.date)}</td>
        <td>${n||"-"}</td>
        <td>₹${o.toFixed(2)}</td>
        <td>
          <span class="status-badge ${d}">
            ${u}
          </span>
        </td>
        <td>${s}</td>
        <td>
          <button
            class="actions-btn view-details-btn"
            data-order-id="${e.id}"
          >
            ${a.t("buttons.view",{},"View")}
          </button>
        </td>
      `,i.querySelector(".view-details-btn").addEventListener("click",()=>ge(e.id)),U.appendChild(i)}))}function Ke(t){L&&(L.innerHTML="",t.length&&t.forEach(e=>{var m;const r=Array.isArray(e.items)?e.items:[],o=e.totalAmount||0,n=((m=r[0])==null?void 0:m.name)||"Order items",s=e.farmerName||e.farmer&&e.farmer.name||"Farmer",u=ee(e.status),d=te(e.status),i=document.createElement("article");i.className="order-card",i.innerHTML=`
        <div class="order-card-header">
          <div>
            <h3>#${e.id.slice(0,8)}</h3>
            <p class="order-card-date">${ze(e.date)}</p>
          </div>
          <span class="status-badge ${d}">${u}</span>
        </div>
        <div class="order-card-body">
          <p class="order-card-title">${n}</p>
          <p class="order-card-meta">
            <span>${a.t("orders.items_count",{count:r.length},`${r.length} item(s)`)}</span> •
            <span>₹${o.toFixed(2)}</span>
          </p>
          <p class="order-card-farmer">${a.t("orders.farmer",{},"Farmer")}: ${s}</p>
        </div>
        <div class="order-card-footer">
          <button
            class="actions-btn view-details-btn"
            data-order-id="${e.id}"
          >
            ${a.t("buttons.view_details",{},"View details")}
          </button>
        </div>
      `,i.querySelector(".view-details-btn").addEventListener("click",()=>ge(e.id)),L.appendChild(i)}))}function ge(t){const e=$.find(s=>s.id===t);if(!e)return;D=t,h=e;const r=Array.isArray(e.items)?e.items:[],o=e.totalAmount||0;if(Me&&(Me.textContent=`${a.t("table.order_id",{},"Order")} #${e.id}`),ve){const s=ee(e.status),u=te(e.status);ve.textContent=s,ve.className=`status-badge ${u}`}Xe.innerHTML=`
      <div class="order-details-grid">
        <div class="order-section">
          <h3>${a.t("orders.order_info",{},"Order Information")}</h3>
          <div class="order-info">
            <div class="order-info-label">${a.t("table.order_id",{},"Order ID")}</div>
            <div class="order-info-value">${e.id}</div>
          </div>
          <div class="order-info">
            <div class="order-info-label">${a.t("table.status",{},"Status")}</div>
            <div class="order-info-value">
              <span class="status-badge ${te(e.status)}">
                ${ee(e.status)}
              </span>
            </div>
          </div>
          <div class="order-info">
            <div class="order-info-label">${a.t("orders.total",{},"Total")}</div>
            <div class="order-info-value">₹${o.toFixed(2)}</div>
          </div>
          <div class="order-info">
            <div class="order-info-label">${a.t("orders.payment_method",{},"Payment")}</div>
            <div class="order-info-value">
              ${e.paymentMethod?a.t("filter."+e.paymentMethod.toLowerCase(),{},e.paymentMethod):a.t("orders.not_specified",{},"Not specified")}
            </div>
          </div>
        </div>

        <div class="order-section">
      <h3>${a.t("orders.delivery_info",{},"Delivery Information")}</h3>
      <div class="order-info">
        <div class="order-info-label">${a.t("profile.location",{},"Address")}</div>
        <div class="order-info-value">
          ${e.customerAddress||e.deliveryAddress||e.address||a.t("orders.not_specified",{},"Not specified")}
        </div>
      </div>
      <div class="order-info">
        <div class="order-info-label">${a.t("profile.phone",{},"Contact")}</div>
        <div class="order-info-value">
          ${e.customerPhone||e.contactNumber||e.phone||a.t("orders.not_specified",{},"Not specified")}
        </div>
      </div>
      <div class="order-info">
        <div class="order-info-label">${a.t("orders.delivery_date",{},"Delivery Date")}</div>
        <div class="order-info-value">
          ${e.deliveryDate||a.t("orders.not_specified",{},"Not specified")}
        </div>
      </div>
    </div>

        <div class="order-section" style="grid-column: 1 / -1">
          <h3>${a.t("orders.order_items",{},"Order Items")}</h3>
          <table class="order-items-table">
            <thead>
              <tr>
                <th>${a.t("table.crops",{},"Item")}</th>
                <th>${a.t("table.quantity",{},"Quantity")}</th>
                <th>${a.t("crops.price",{},"Price")}</th>
                <th>${a.t("orders.total",{},"Total")}</th>
              </tr>
            </thead>
            <tbody>
              ${r.map(s=>`
                  <tr>
                    <td>${s.name}</td>
                    <td>${s.quantity}</td>
                    <td>₹${(s.price||0).toFixed(2)}</td>
                    <td>₹${((s.price||0)*(s.quantity||0)).toFixed(2)}</td>
                  </tr>
                `).join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-right"><strong>${a.t("orders.total",{},"Total")}:</strong></td>
                <td>₹${o.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;const n=F(e.status);n==="processing"||n==="pending"?Q.style.display="inline-flex":Q.style.display="none",n==="cancelled"?J.style.display="none":J.style.display="inline-flex",S&&(n==="completed"&&r.length>0?(S.style.display="inline-flex",Pe(t).then(u=>{const d=r[0];u?(S.innerHTML='<i class="fas fa-star"></i> '+a.t("orders.view_review",{},"View Review"),S.onclick=()=>{let i=d.cropId||d.id;if(!i){Ze(d.name,e.farmerId||e.farmer&&e.farmer.id).then(m=>{if(!m){v(a.t("marketplace.product_not_found",{},"Crop not found in database"),"error");return}f={cropName:d.name,cropId:m,farmerId:d.farmerId,orderId:e.id,farmerName:d.farmerName||"Farmer"},He(m)});return}f={cropName:d.name,cropId:i,farmerId:e.farmerId,orderId:e.id,farmerName:e.farmerName||"Farmer"},console.log("Crop data stored for view:",f),He(i)}):(S.innerHTML='<i class="fas fa-star"></i> '+a.t("orders.add_review",{},"Add Review"),S.onclick=()=>et(t))})):S.style.display="none"),V.style.display="flex"}async function We(t,e){const r=Ee(I,"orders",t);await je(r,{status:e,updatedAt:oe()});const o=$.findIndex(n=>n.id===t);o!==-1&&($[o].status=e,y(),ye())}async function Ze(t,e){if(console.log("Looking for crop:",t,"farmer:",e),!t||!e)return console.error("Missing cropName or farmerId"),null;try{const r=x(C(I,"crops"),B("name","==",t),B("farmerId","==",e)),o=await R(r);if(console.log("Found crops:",o.size),o.empty){const n=x(C(I,"crops"),B("name","==",t)),s=await R(n);return console.log("Found crops without farmer filter:",s.size),s.empty?null:s.docs[0].id}return o.docs[0].id}catch(r){return console.error("Error finding crop:",r),null}}function et(t){const e=$.find(o=>o.id===t);if(!e||!e.items||e.items.length===0){v(a.t("orders.load_failed",{},"No items found in this order"),"error");return}const r=e.items[0];Z=r.cropId||r.id,f={orderId:e.id,cropName:r.name,cropId:r.cropId||r.id,farmerId:e.farmerId,farmerName:e.farmerName||"Farmer"},console.log("Crop data stored for review:",f),z.value="5",M&&(M.value=""),W&&(W.textContent="0"),H.forEach(o=>{const n=parseInt(o.dataset.value);o.style.color=n<=5?"#ffc107":"#ddd"}),Pe(t),P.style.display="flex"}async function Pe(t){const e=ae.currentUser;if(!e)return!1;try{const r=x(C(I,"reviews"),B("orderId","==",t),B("customerId","==",e.uid));return(await R(r)).empty?!1:(v(a.t("orders.already_reviewed",{},"You've already reviewed this purchase"),"info"),P.style.display="none",!0)}catch(r){return console.error("Error checking reviews:",r),!1}}async function tt(t){t.preventDefault();const e=ae.currentUser;if(!e||!Z||!f){v(a.t("orders.select_item_review",{},"Please select an item to review"),"error");return}const r=parseInt(z.value),o=M?M.value.trim():"";if(r<1||r>5){v(a.t("orders.invalid_rating",{},"Please select a rating between 1-5 stars"),"error");return}try{w(!0);const n={cropId:Z||"unknown_crop",cropName:f.cropName||"Product",orderId:f.orderId||"unknown_order",customerId:e.uid,customerName:e.displayName||"Customer",farmerId:f.farmerId||"unknown_farmer",farmerName:f.farmerName||"Unknown Farmer",rating:r,comment:o||"",createdAt:oe(),helpfulCount:0,updatedAt:oe()};console.log("Submitting review:",n),await ct(C(I,"reviews"),n),await rt(Z),v(a.t("orders.review_success",{},"Thank you for your review!"),"success"),P.style.display="none",w(!1)}catch(n){console.error("Error submitting review:",n),v(a.t("orders.review_failed",{},"Failed to submit review. Please try again."),"error"),w(!1)}}async function rt(t){try{const e=x(C(I,"reviews"),B("cropId","==",t)),r=await R(e);let o=0,n=0;r.forEach(d=>{const i=d.data();o+=i.rating||0,n++});const s=n>0?o/n:0,u=Ee(I,"crops",t);await je(u,{averageRating:parseFloat(s.toFixed(1)),reviewCount:n,lastReviewed:oe()})}catch(e){console.error("Error updating crop rating:",e)}}async function He(t){var e,r,o;try{w(!0),console.log("Showing reviews for cropId:",t),console.log("Selected crop data:",f),console.log("Current order:",h);let n=Ee(I,"crops",t),s=await dt(n);if(!s.exists()){console.log("Crop document not found with ID:",t);let g=f==null?void 0:f.cropName,b=(f==null?void 0:f.farmerId)||((r=(e=h==null?void 0:h.items)==null?void 0:e[0])==null?void 0:r.farmerId);if(!g&&((o=h==null?void 0:h.items)!=null&&o[0])&&(g=h.items[0].name),!b&&h&&(b=h.farmerId||h.farmer&&h.farmer.id),console.log("Looking for crop by name:",g,"farmer:",b),!g){v(a.t("marketplace.product_not_found",{},"Could not find crop information"),"error"),w(!1);return}if(b){const q=x(C(I,"crops"),B("name","==",g),B("farmerId","==",b)),E=await R(q);E.empty||(n=E.docs[0].ref,s=E.docs[0],t=E.docs[0].id,console.log("Found crop with farmer filter:",t))}if(!s.exists()){const q=x(C(I,"crops"),B("name","==",g)),E=await R(q);if(E.empty){v(a.t("marketplace.product_not_found",{},"Crop not found in database. It may have been removed."),"error"),w(!1);return}n=E.docs[0].ref,s=E.docs[0],t=E.docs[0].id,console.log("Found crop without farmer filter:",t)}}const u=s.data();console.log("Crop data loaded:",u);const d=document.getElementById("reviewsModalTitle");d&&(d.textContent=a.t("orders.reviews_for_crop",{name:u.name},`Reviews for ${u.name}`));const i=x(C(I,"reviews"),B("cropId","==",t)),m=await R(i);let c=0;const p=[];m.forEach(g=>{const b=g.data();p.push({id:g.id,...b}),c+=b.rating||0});const re=p.length>0?c/p.length:0;console.log("Found reviews:",p.length,"Average:",re),nt(p,re),K.style.display="flex",w(!1)}catch(n){console.error("Error loading reviews:",n),v(a.t("marketplace.failed_load_reviews",{},"Failed to load reviews. Please try again."),"error"),w(!1)}}function nt(t,e){if(!pe)return;if(t.length===0){pe.innerHTML=`
        <div class="empty-state" style="margin: 20px 0; text-align: center;">
          <i class="fas fa-comment-alt" style="font-size: 3rem; color: #ddd; margin-bottom: 10px;"></i>
          <h3>${a.t("orders.no_reviews",{},"No reviews yet")}</h3>
          <p>${a.t("orders.first_review",{},"Be the first to review this crop!")}</p>
        </div>
      `;return}t.sort((n,s)=>{var i,m,c,p;const u=((m=(i=n.createdAt)==null?void 0:i.toDate)==null?void 0:m.call(i))||new Date(0);return(((p=(c=s.createdAt)==null?void 0:c.toDate)==null?void 0:p.call(c))||new Date(0))-u});const r=t.length===1?a.t("orders.based_on_review",{count:t.length},`Based on ${t.length} review`):a.t("orders.based_on_reviews",{count:t.length},`Based on ${t.length} reviews`);let o=`
      <div class="average-rating">
        <div class="average-rating-value">${e.toFixed(1)}</div>
        <div class="average-rating-stars">
          ${Ge(e)}
        </div>
        <div class="average-rating-count">
          ${r}
        </div>
      </div>
    `;t.forEach(n=>{var i,m;const u=(((m=(i=n.createdAt)==null?void 0:i.toDate)==null?void 0:m.call(i))||new Date).toLocaleDateString("en-IN",{year:"numeric",month:"short",day:"numeric"}),d=n.customerName.split(" ").map(c=>c[0]).join("").toUpperCase().slice(0,2);o+=`
        <div class="review-item">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar">${d}</div>
              <div>
                <div class="reviewer-name">${n.customerName}</div>
                <div class="review-date">${u}</div>
              </div>
            </div>
            <div class="review-rating">
              <div class="review-stars">
                ${Ge(n.rating)}
              </div>
              <span>${n.rating}.0</span>
            </div>
          </div>
          ${n.comment?`<p class="review-comment">${n.comment}</p>`:""}
        </div>
      `}),pe.innerHTML=o}function ze(t){if(!t)return a.t("orders.not_specified",{},"N/A");try{const e=a.getCurrentLang(),r=e==="te"?"te-IN":e==="hi"?"hi-IN":e==="ta"?"ta-IN":"en-IN";return t.toLocaleString(r,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return a.t("orders.not_specified",{},"N/A")}}function ye(){const t=$.length,e=$.filter(n=>{const s=F(n.status);return s==="processing"||s==="accepted"||s==="pending"}).length,r=$.filter(n=>F(n.status)==="completed").length,o=$.filter(n=>F(n.status)==="cancelled").length;Le&&(Le.textContent=t),Ce&&(Ce.textContent=e),xe&&(xe.textContent=r),ke&&(ke.textContent=o)}function Ue(){if(!Be)return;const t=a.getCurrentLang(),e=t==="te"?"te-IN":t==="hi"?"hi-IN":t==="ta"?"ta-IN":"en-IN";Be.textContent=new Date().toLocaleTimeString(e,{hour:"2-digit",minute:"2-digit"})}function w(t){Fe&&(Fe.style.display=t?"flex":"none")}function he(){U&&(U.innerHTML=""),L&&(L.innerHTML=""),fe&&(fe.style.display="block")}function v(t,e="info"){document.querySelectorAll(".toast").forEach(n=>n.remove());const o=document.createElement("div");if(o.className=`toast ${e}`,o.textContent=t,document.body.appendChild(o),!document.querySelector("#toast-styles")){const n=document.createElement("style");n.id="toast-styles",n.textContent=`
        .toast {
          position: fixed;
          top: 100px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 8px;
          background: #343a40;
          color: white;
          font-size: 0.9rem;
          z-index: 9999;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.16);
          animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
          max-width: 300px;
        }
        .toast.success { background: #28a745; }
        .toast.error { background: #dc3545; }
        .toast.info { background: #0d6efd; }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: translateY(-20px); }
        }
      `,document.head.appendChild(n)}setTimeout(()=>{o.remove()},3e3)}function F(t){if(!t)return"unknown";const e=String(t).toLowerCase();return e==="pending"?"processing":e}function ee(t){switch(F(t)){case"processing":return a.t("filter.pending",{},"Pending");case"accepted":return a.t("filter.accepted",{},"Accepted");case"completed":return a.t("filter.completed",{},"Completed");case"cancelled":return a.t("filter.cancelled",{},"Cancelled");default:return t||"Unknown"}}function te(t){switch(F(t)){case"processing":case"pending":return"status-processing";case"accepted":return"status-accepted";case"completed":return"status-completed";case"cancelled":return"status-cancelled";default:return""}}function at(t){if(ue){ue.innerHTML="";for(let e=1;e<=t;e++){const r=document.createElement("button");r.textContent=e,e===l&&r.classList.add("active"),r.addEventListener("click",()=>{l!==e&&(l=e,y())}),ue.appendChild(r)}ie.disabled=l===1,de.disabled=l===1,ce.disabled=l===t,le.disabled=l===t}}function Ve(t,e,r){if(me){if(r===0){me.textContent=a.t("table.showing",{start:0,end:0,total:0},"0–0 of 0 orders");return}me.textContent=a.t("table.showing",{start:t,end:e,total:r},`${t}–${e} of ${r} orders`)}}function Ge(t){const e=Math.floor(t),r=t%1>=.5;let o="";for(let s=0;s<e;s++)o+='<i class="fas fa-star"></i>';r&&(o+='<i class="fas fa-star-half-alt"></i>');const n=5-e-(r?1:0);for(let s=0;s<n;s++)o+='<i class="far fa-star"></i>';return o}function we(t){switch(t){case 1:return"#ff6b6b";case 2:return"#ffa94d";case 3:return"#ffd43b";case 4:return"#a5d6a7";case 5:return"#4caf50";default:return"#ffc107"}}function ot(){k&&k.addEventListener("change",()=>{l=1,y()}),N&&N.addEventListener("change",()=>{l=1,y()}),Ne&&Ne.addEventListener("click",()=>{k&&(k.value="all"),N&&(N.value="all"),_&&(_.value=""),A&&(A.value="latest"),Y&&(Y.value="10"),T=10,l=1,y()}),_e&&_e.addEventListener("click",()=>{const t=ae.currentUser;t&&qe(t.uid)}),_&&_.addEventListener("input",()=>{l=1,y()}),A&&A.addEventListener("change",()=>{l=1,y()}),Y&&Y.addEventListener("change",t=>{T=Number(t.target.value)||10,l=1,y()}),ie&&ie.addEventListener("click",()=>{l=1,y()}),de&&de.addEventListener("click",()=>{l>1&&(l--,y())}),ce&&ce.addEventListener("click",()=>{const t=Math.max(1,Math.ceil(O.length/T));l<t&&(l++,y())}),le&&le.addEventListener("click",()=>{l=Math.max(1,Math.ceil(O.length/T)),y()}),j&&X&&se&&(j.addEventListener("click",()=>{j.classList.add("active"),X.classList.remove("active"),se.dataset.viewMode="list",L&&L.setAttribute("aria-hidden","true")}),X.addEventListener("click",()=>{X.classList.add("active"),j.classList.remove("active"),se.dataset.viewMode="grid",L&&L.setAttribute("aria-hidden","false")})),Ae&&Ae.addEventListener("click",()=>{V.style.display="none"}),window.addEventListener("click",t=>{t.target===V&&(V.style.display="none"),t.target===P&&(P.style.display="none"),t.target===K&&(K.style.display="none")}),Q&&Q.addEventListener("click",async()=>{if(D)try{await We(D,"cancelled"),v(a.t("orders.cancelled_success",{},"Order cancelled successfully"),"success"),V.style.display="none"}catch(t){console.error(t),v(a.t("orders.cancelled_error",{},"Failed to cancel order"),"error")}}),J&&J.addEventListener("click",()=>{D&&(window.location.href=`#?orderId=${D}`)}),Se&&Se.addEventListener("click",()=>{v(a.t("orders.download_feature",{},"Invoice download will be available soon."),"info")}),H&&H.forEach(t=>{t.addEventListener("click",()=>{const e=parseInt(t.dataset.value);z&&(z.value=e),H.forEach(r=>{const o=parseInt(r.dataset.value);o<=e?r.style.color=we(o):r.style.color="#ddd"})}),t.addEventListener("mouseover",()=>{const e=parseInt(t.dataset.value);H.forEach(r=>{const o=parseInt(r.dataset.value);o<=e&&(r.style.color=we(o))})}),t.addEventListener("mouseout",()=>{const e=z?parseInt(z.value):5;H.forEach(r=>{const o=parseInt(r.dataset.value);o<=e?r.style.color=we(o):r.style.color="#ddd"})})}),M&&W&&M.addEventListener("input",()=>{W.textContent=M.value.length}),Oe&&Oe.addEventListener("submit",tt),Te&&Te.forEach(t=>{t.addEventListener("click",()=>{P.style.display="none"})}),De&&De.forEach(t=>{t.addEventListener("click",()=>{K.style.display="none"})}),Ie&&Ie.addEventListener("click",()=>{window.history.back()}),$e&&$e.addEventListener("click",()=>{document.body.classList.toggle("dark-theme")})}});
