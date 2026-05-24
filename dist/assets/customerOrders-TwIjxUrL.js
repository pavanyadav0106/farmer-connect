import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css            *//* empty css                          *//* empty css                        */import"./layout-loader-LuVZLwht.js";import{a as ae,d as E}from"./config--Onoqk_Z.js";import{query as x,collection as C,where as B,onSnapshot as ot,getDocs as R,doc as ye,getDoc as it,updateDoc as Ge,serverTimestamp as re,addDoc as dt}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";import{onAuthStateChanged as ct}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";document.addEventListener("DOMContentLoaded",()=>{const he=document.getElementById("backBtn"),we=document.getElementById("customerName"),Ee=document.getElementById("lastUpdated"),Ie=document.getElementById("themeToggleBtn"),Be=document.getElementById("totalOrdersCount"),be=document.getElementById("activeOrdersCount"),Le=document.getElementById("completedOrdersCount"),Ce=document.getElementById("cancelledOrdersCount"),$=document.getElementById("statusFilter"),k=document.getElementById("dateFilter"),xe=document.getElementById("resetFilters"),A=document.getElementById("orderSearch"),N=document.getElementById("sortFilter"),j=document.getElementById("viewListBtn"),_=document.getElementById("viewGridBtn"),z=document.getElementById("ordersTableBody"),se=document.querySelector(".orders-list"),L=document.getElementById("ordersGridContainer"),X=document.getElementById("pageSizeSelect"),oe=document.getElementById("firstPageBtn"),ie=document.getElementById("prevPageBtn"),de=document.getElementById("nextPageBtn"),ce=document.getElementById("lastPageBtn"),le=document.getElementById("pageNumbers"),ue=document.getElementById("paginationInfo"),me=document.getElementById("emptyState"),$e=document.getElementById("refreshOrders"),U=document.getElementById("orderModal"),je=document.getElementById("modalBody"),ke=document.querySelector(".close-btn"),Y=document.getElementById("cancelOrderBtn"),Q=document.getElementById("trackOrderBtn"),Ae=document.getElementById("downloadInvoiceBtn"),S=document.getElementById("addReviewBtn"),Ne=document.getElementById("modalOrderId"),fe=document.getElementById("modalOrderStatus"),q=document.getElementById("reviewModal"),J=document.getElementById("existingReviewsModal"),Se=document.getElementById("reviewForm"),P=document.querySelectorAll(".star-rating"),H=document.getElementById("reviewRating"),M=document.getElementById("reviewComment"),K=document.getElementById("charCount"),Me=document.querySelectorAll(".close-review-modal"),Oe=document.querySelectorAll(".close-reviews-modal"),ve=document.getElementById("reviewsContainer"),Te=document.getElementById("ordersLoadingOverlay");let b=[],O=[],V=null,d=1,T=10,G=null,W=null,m=null,p=null;_e();function _e(){Xe(),rt()}function Xe(){ct(ae,t=>{t?(we&&(we.textContent=t.displayName||"Customer"),De(t.uid)):(V&&V(),window.location.href="login.html")})}function De(t){try{y(!0);const e=x(C(E,"orders"),B("customerId","==",t));V&&V(),V=ot(e,n=>{b=n.docs.map(a=>{const r=a.data(),s=r.createdAt&&typeof r.createdAt.toDate=="function"?r.createdAt.toDate():new Date,o=(Array.isArray(r.items)?r.items:[]).reduce((i,c)=>i+(c.price||0)*(c.quantity||0),0);return{id:a.id,...r,date:s,totalAmount:o}}),ze(),nt(),d=1,g(),y(!1)},n=>{console.error("Error loading orders:",n),f("Failed to load orders","error"),pe(),y(!1)})}catch(e){console.error("Error loading orders:",e),f("Failed to load orders","error"),pe(),y(!1)}}function g(){const t=($==null?void 0:$.value)||"all",e=(k==null?void 0:k.value)||"all",n=((A==null?void 0:A.value)||"").trim().toLowerCase(),a=new Date;O=b.filter(l=>{const h=D(l.status),te=t==="all"||h===t.toLowerCase();let v=!0;if(e!=="all"){const F=l.date||new Date,ne=(a-F)/(1e3*60*60*24);switch(e){case"today":v=ne<1;break;case"week":v=ne<7;break;case"month":v=ne<30;break;default:v=!0}}let I=!0;if(n){const F=l.farmerName||l.farmer&&l.farmer.name||"farmer",w=(l.items||[]).map(st=>st.name||"").join(" ");I=`${l.id} ${F} ${w}`.toLowerCase().includes(n)}return te&&v&&I});const r=(N==null?void 0:N.value)||"latest";if(O.sort((l,h)=>{switch(r){case"oldest":return l.date-h.date;case"amountHigh":return(h.totalAmount||0)-(l.totalAmount||0);case"amountLow":return(l.totalAmount||0)-(h.totalAmount||0);case"latest":default:return h.date-l.date}}),!O.length){d=1,Fe([]),pe(),Ue(0,0,0);return}me.style.display="none";const s=O.length,u=Math.max(1,Math.ceil(s/T));d>u&&(d=u);const o=(d-1)*T,i=Math.min(o+T,s),c=O.slice(o,i);Fe(c),at(u),Ue(o+1,i,s)}function Fe(t){Ye(t),Qe(t)}function Ye(t){z&&(z.innerHTML="",t.forEach(e=>{const n=Array.isArray(e.items)?e.items:[],a=e.totalAmount||0,r=n.map(l=>`${l.name} (${l.quantity})`).join(", "),s=e.farmerName||e.farmer&&e.farmer.name||"Farmer",u=Z(e.status),o=ee(e.status),i=document.createElement("tr");i.innerHTML=`
        <td>${e.id}</td>
        <td>${He(e.date)}</td>
        <td>${r||"-"}</td>
        <td>₹${a.toFixed(2)}</td>
        <td>
          <span class="status-badge ${o}">
            ${u}
          </span>
        </td>
        <td>${s}</td>
        <td>
          <button
            class="actions-btn view-details-btn"
            data-order-id="${e.id}"
          >
            View
          </button>
        </td>
      `,i.querySelector(".view-details-btn").addEventListener("click",()=>Re(e.id)),z.appendChild(i)}))}function Qe(t){L&&(L.innerHTML="",t.length&&t.forEach(e=>{var c;const n=Array.isArray(e.items)?e.items:[],a=e.totalAmount||0,r=((c=n[0])==null?void 0:c.name)||"Order items",s=e.farmerName||e.farmer&&e.farmer.name||"Farmer",u=Z(e.status),o=ee(e.status),i=document.createElement("article");i.className="order-card",i.innerHTML=`
        <div class="order-card-header">
          <div>
            <h3>#${e.id.slice(0,8)}</h3>
            <p class="order-card-date">${He(e.date)}</p>
          </div>
          <span class="status-badge ${o}">${u}</span>
        </div>
        <div class="order-card-body">
          <p class="order-card-title">${r}</p>
          <p class="order-card-meta">
            <span>${n.length} item(s)</span> •
            <span>₹${a.toFixed(2)}</span>
          </p>
          <p class="order-card-farmer">Farmer: ${s}</p>
        </div>
        <div class="order-card-footer">
          <button
            class="actions-btn view-details-btn"
            data-order-id="${e.id}"
          >
            View details
          </button>
        </div>
      `,i.querySelector(".view-details-btn").addEventListener("click",()=>Re(e.id)),L.appendChild(i)}))}function Re(t){const e=b.find(s=>s.id===t);if(!e)return;G=t,p=e;const n=Array.isArray(e.items)?e.items:[],a=e.totalAmount||0;if(Ne&&(Ne.textContent=`Order #${e.id}`),fe){const s=Z(e.status),u=ee(e.status);fe.textContent=s,fe.className=`status-badge ${u}`}je.innerHTML=`
      <div class="order-details-grid">
        <div class="order-section">
          <h3>Order Information</h3>
          <div class="order-info">
            <div class="order-info-label">Order ID</div>
            <div class="order-info-value">${e.id}</div>
          </div>
          <div class="order-info">
            <div class="order-info-label">Status</div>
            <div class="order-info-value">
              <span class="status-badge ${ee(e.status)}">
                ${Z(e.status)}
              </span>
            </div>
          </div>
          <div class="order-info">
            <div class="order-info-label">Total</div>
            <div class="order-info-value">₹${a.toFixed(2)}</div>
          </div>
          <div class="order-info">
            <div class="order-info-label">Payment</div>
            <div class="order-info-value">
              ${e.paymentMethod||"Not specified"}
            </div>
          </div>
        </div>

        <div class="order-section">
      <h3>Delivery Information</h3>
      <div class="order-info">
        <div class="order-info-label">Address</div>
        <div class="order-info-value">
          ${e.customerAddress||e.deliveryAddress||e.address||"Not specified"}
        </div>
      </div>
      <div class="order-info">
        <div class="order-info-label">Contact</div>
        <div class="order-info-value">
          ${e.customerPhone||e.contactNumber||e.phone||"Not specified"}
        </div>
      </div>
      <div class="order-info">
        <div class="order-info-label">Delivery Date</div>
        <div class="order-info-value">
          ${e.deliveryDate||"Not specified"}
        </div>
      </div>
    </div>

        <div class="order-section" style="grid-column: 1 / -1">
          <h3>Order Items</h3>
          <table class="order-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${n.map(s=>`
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
                <td colspan="3" class="text-right"><strong>Total:</strong></td>
                <td>₹${a.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;const r=D(e.status);r==="processing"||r==="pending"?Y.style.display="inline-flex":Y.style.display="none",r==="cancelled"?Q.style.display="none":Q.style.display="inline-flex",S&&(r==="completed"&&n.length>0?(S.style.display="inline-flex",qe(t).then(u=>{const o=n[0];u?(S.innerHTML='<i class="fas fa-star"></i> View Review',S.onclick=()=>{let i=o.cropId||o.id;if(!i){Ke(o.name,e.farmerId||e.farmer&&e.farmer.id).then(c=>{if(!c){f("Crop not found in database","error");return}m={cropName:o.name,cropId:c,farmerId:o.farmerId,orderId:e.id,farmerName:o.farmerName||"Farmer"},Pe(c)});return}m={cropName:o.name,cropId:i,farmerId:e.farmerId,orderId:e.id,farmerName:e.farmerName||"Farmer"},console.log("Crop data stored for view:",m),Pe(i)}):(S.innerHTML='<i class="fas fa-star"></i> Add Review',S.onclick=()=>We(t))})):S.style.display="none"),U.style.display="flex"}async function Je(t,e){const n=ye(E,"orders",t);await Ge(n,{status:e,updatedAt:re()});const a=b.findIndex(r=>r.id===t);a!==-1&&(b[a].status=e,g(),ze())}async function Ke(t,e){if(console.log("Looking for crop:",t,"farmer:",e),!t||!e)return console.error("Missing cropName or farmerId"),null;try{const n=x(C(E,"crops"),B("name","==",t),B("farmerId","==",e)),a=await R(n);if(console.log("Found crops:",a.size),a.empty){const r=x(C(E,"crops"),B("name","==",t)),s=await R(r);return console.log("Found crops without farmer filter:",s.size),s.empty?null:s.docs[0].id}return a.docs[0].id}catch(n){return console.error("Error finding crop:",n),null}}function We(t){const e=b.find(a=>a.id===t);if(!e||!e.items||e.items.length===0){f("No items found in this order","error");return}const n=e.items[0];W=n.cropId||n.id,m={orderId:e.id,cropName:n.name,cropId:n.cropId||n.id,farmerId:e.farmerId,farmerName:e.farmerName||"Farmer"},console.log("Crop data stored for review:",m),H.value="5",M&&(M.value=""),K&&(K.textContent="0"),P.forEach(a=>{const r=parseInt(a.dataset.value);a.style.color=r<=5?"#ffc107":"#ddd"}),qe(t),q.style.display="flex"}async function qe(t){const e=ae.currentUser;if(!e)return!1;try{const n=x(C(E,"reviews"),B("orderId","==",t),B("customerId","==",e.uid));return(await R(n)).empty?!1:(f("You've already reviewed this purchase","info"),q.style.display="none",!0)}catch(n){return console.error("Error checking reviews:",n),!1}}async function Ze(t){t.preventDefault();const e=ae.currentUser;if(!e||!W||!m){f("Please select an item to review","error");return}const n=parseInt(H.value),a=M?M.value.trim():"";if(n<1||n>5){f("Please select a rating between 1-5 stars","error");return}try{y(!0);const r={cropId:W||"unknown_crop",cropName:m.cropName||"Product",orderId:m.orderId||"unknown_order",customerId:e.uid,customerName:e.displayName||"Customer",farmerId:m.farmerId||"unknown_farmer",farmerName:m.farmerName||"Unknown Farmer",rating:n,comment:a||"",createdAt:re(),helpfulCount:0,updatedAt:re()};console.log("Submitting review:",r),await dt(C(E,"reviews"),r),await et(W),f("Thank you for your review!","success"),q.style.display="none",y(!1)}catch(r){console.error("Error submitting review:",r),f("Failed to submit review. Please try again.","error"),y(!1)}}async function et(t){try{const e=x(C(E,"reviews"),B("cropId","==",t)),n=await R(e);let a=0,r=0;n.forEach(o=>{const i=o.data();a+=i.rating||0,r++});const s=r>0?a/r:0,u=ye(E,"crops",t);await Ge(u,{averageRating:parseFloat(s.toFixed(1)),reviewCount:r,lastReviewed:re()})}catch(e){console.error("Error updating crop rating:",e)}}async function Pe(t){var e,n,a;try{y(!0),console.log("Showing reviews for cropId:",t),console.log("Selected crop data:",m),console.log("Current order:",p);let r=ye(E,"crops",t),s=await it(r);if(!s.exists()){console.log("Crop document not found with ID:",t);let v=m==null?void 0:m.cropName,I=(m==null?void 0:m.farmerId)||((n=(e=p==null?void 0:p.items)==null?void 0:e[0])==null?void 0:n.farmerId);if(!v&&((a=p==null?void 0:p.items)!=null&&a[0])&&(v=p.items[0].name),!I&&p&&(I=p.farmerId||p.farmer&&p.farmer.id),console.log("Looking for crop by name:",v,"farmer:",I),!v){f("Could not find crop information","error"),y(!1);return}if(I){const F=x(C(E,"crops"),B("name","==",v),B("farmerId","==",I)),w=await R(F);w.empty||(r=w.docs[0].ref,s=w.docs[0],t=w.docs[0].id,console.log("Found crop with farmer filter:",t))}if(!s.exists()){const F=x(C(E,"crops"),B("name","==",v)),w=await R(F);if(w.empty){f("Crop not found in database. It may have been removed.","error"),y(!1);return}r=w.docs[0].ref,s=w.docs[0],t=w.docs[0].id,console.log("Found crop without farmer filter:",t)}}const u=s.data();console.log("Crop data loaded:",u);const o=document.getElementById("reviewsModalTitle");o&&(o.textContent=`Reviews for ${u.name}`);const i=x(C(E,"reviews"),B("cropId","==",t)),c=await R(i);let l=0;const h=[];c.forEach(v=>{const I=v.data();h.push({id:v.id,...I}),l+=I.rating||0});const te=h.length>0?l/h.length:0;console.log("Found reviews:",h.length,"Average:",te),tt(h,te),J.style.display="flex",y(!1)}catch(r){console.error("Error loading reviews:",r),f("Failed to load reviews. Please try again.","error"),y(!1)}}function tt(t,e){if(!ve)return;if(t.length===0){ve.innerHTML=`
        <div class="empty-state" style="margin: 20px 0; text-align: center;">
          <i class="fas fa-comment-alt" style="font-size: 3rem; color: #ddd; margin-bottom: 10px;"></i>
          <h3>No reviews yet</h3>
          <p>Be the first to review this crop!</p>
        </div>
      `;return}t.sort((a,r)=>{var o,i,c,l;const s=((i=(o=a.createdAt)==null?void 0:o.toDate)==null?void 0:i.call(o))||new Date(0);return(((l=(c=r.createdAt)==null?void 0:c.toDate)==null?void 0:l.call(c))||new Date(0))-s});let n=`
      <div class="average-rating">
        <div class="average-rating-value">${e.toFixed(1)}</div>
        <div class="average-rating-stars">
          ${Ve(e)}
        </div>
        <div class="average-rating-count">
          Based on ${t.length} ${t.length===1?"review":"reviews"}
        </div>
      </div>
    `;t.forEach(a=>{var o,i;const s=(((i=(o=a.createdAt)==null?void 0:o.toDate)==null?void 0:i.call(o))||new Date).toLocaleDateString("en-IN",{year:"numeric",month:"short",day:"numeric"}),u=a.customerName.split(" ").map(c=>c[0]).join("").toUpperCase().slice(0,2);n+=`
        <div class="review-item">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar">${u}</div>
              <div>
                <div class="reviewer-name">${a.customerName}</div>
                <div class="review-date">${s}</div>
              </div>
            </div>
            <div class="review-rating">
              <div class="review-stars">
                ${Ve(a.rating)}
              </div>
              <span>${a.rating}.0</span>
            </div>
          </div>
          ${a.comment?`<p class="review-comment">${a.comment}</p>`:""}
        </div>
      `}),ve.innerHTML=n}function He(t){if(!t)return"N/A";try{return t.toLocaleString("en-IN",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return"N/A"}}function ze(){const t=b.length,e=b.filter(r=>{const s=D(r.status);return s==="processing"||s==="accepted"||s==="pending"}).length,n=b.filter(r=>D(r.status)==="completed").length,a=b.filter(r=>D(r.status)==="cancelled").length;Be&&(Be.textContent=t),be&&(be.textContent=e),Le&&(Le.textContent=n),Ce&&(Ce.textContent=a)}function nt(){Ee&&(Ee.textContent=new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}))}function y(t){Te&&(Te.style.display=t?"flex":"none")}function pe(){z&&(z.innerHTML=""),L&&(L.innerHTML=""),me&&(me.style.display="block")}function f(t,e="info"){document.querySelectorAll(".toast").forEach(r=>r.remove());const a=document.createElement("div");if(a.className=`toast ${e}`,a.textContent=t,document.body.appendChild(a),!document.querySelector("#toast-styles")){const r=document.createElement("style");r.id="toast-styles",r.textContent=`
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
      `,document.head.appendChild(r)}setTimeout(()=>{a.remove()},3e3)}function D(t){if(!t)return"unknown";const e=String(t).toLowerCase();return e==="pending"?"processing":e}function Z(t){switch(D(t)){case"processing":return"Pending";case"accepted":return"Accepted";case"completed":return"Completed";case"cancelled":return"Cancelled";default:return t||"Unknown"}}function ee(t){switch(D(t)){case"processing":case"pending":return"status-processing";case"accepted":return"status-accepted";case"completed":return"status-completed";case"cancelled":return"status-cancelled";default:return""}}function at(t){if(le){le.innerHTML="";for(let e=1;e<=t;e++){const n=document.createElement("button");n.textContent=e,e===d&&n.classList.add("active"),n.addEventListener("click",()=>{d!==e&&(d=e,g())}),le.appendChild(n)}oe.disabled=d===1,ie.disabled=d===1,de.disabled=d===t,ce.disabled=d===t}}function Ue(t,e,n){if(ue){if(n===0){ue.textContent="0–0 of 0 orders";return}ue.textContent=`${t}–${e} of ${n} orders`}}function Ve(t){const e=Math.floor(t),n=t%1>=.5;let a="";for(let s=0;s<e;s++)a+='<i class="fas fa-star"></i>';n&&(a+='<i class="fas fa-star-half-alt"></i>');const r=5-e-(n?1:0);for(let s=0;s<r;s++)a+='<i class="far fa-star"></i>';return a}function ge(t){switch(t){case 1:return"#ff6b6b";case 2:return"#ffa94d";case 3:return"#ffd43b";case 4:return"#a5d6a7";case 5:return"#4caf50";default:return"#ffc107"}}function rt(){$&&$.addEventListener("change",()=>{d=1,g()}),k&&k.addEventListener("change",()=>{d=1,g()}),xe&&xe.addEventListener("click",()=>{$&&($.value="all"),k&&(k.value="all"),A&&(A.value=""),N&&(N.value="latest"),X&&(X.value="10"),T=10,d=1,g()}),$e&&$e.addEventListener("click",()=>{const t=ae.currentUser;t&&De(t.uid)}),A&&A.addEventListener("input",()=>{d=1,g()}),N&&N.addEventListener("change",()=>{d=1,g()}),X&&X.addEventListener("change",t=>{T=Number(t.target.value)||10,d=1,g()}),oe&&oe.addEventListener("click",()=>{d=1,g()}),ie&&ie.addEventListener("click",()=>{d>1&&(d--,g())}),de&&de.addEventListener("click",()=>{const t=Math.max(1,Math.ceil(O.length/T));d<t&&(d++,g())}),ce&&ce.addEventListener("click",()=>{d=Math.max(1,Math.ceil(O.length/T)),g()}),j&&_&&se&&(j.addEventListener("click",()=>{j.classList.add("active"),_.classList.remove("active"),se.dataset.viewMode="list",L&&L.setAttribute("aria-hidden","true")}),_.addEventListener("click",()=>{_.classList.add("active"),j.classList.remove("active"),se.dataset.viewMode="grid",L&&L.setAttribute("aria-hidden","false")})),ke&&ke.addEventListener("click",()=>{U.style.display="none"}),window.addEventListener("click",t=>{t.target===U&&(U.style.display="none"),t.target===q&&(q.style.display="none"),t.target===J&&(J.style.display="none")}),Y&&Y.addEventListener("click",async()=>{if(G)try{await Je(G,"cancelled"),f("Order cancelled successfully","success"),U.style.display="none"}catch(t){console.error(t),f("Failed to cancel order","error")}}),Q&&Q.addEventListener("click",()=>{G&&(window.location.href=`#?orderId=${G}`)}),Ae&&Ae.addEventListener("click",()=>{f("Invoice download will be available soon.","info")}),P&&P.forEach(t=>{t.addEventListener("click",()=>{const e=parseInt(t.dataset.value);H&&(H.value=e),P.forEach(n=>{const a=parseInt(n.dataset.value);a<=e?n.style.color=ge(a):n.style.color="#ddd"})}),t.addEventListener("mouseover",()=>{const e=parseInt(t.dataset.value);P.forEach(n=>{const a=parseInt(n.dataset.value);a<=e&&(n.style.color=ge(a))})}),t.addEventListener("mouseout",()=>{const e=H?parseInt(H.value):5;P.forEach(n=>{const a=parseInt(n.dataset.value);a<=e?n.style.color=ge(a):n.style.color="#ddd"})})}),M&&K&&M.addEventListener("input",()=>{K.textContent=M.value.length}),Se&&Se.addEventListener("submit",Ze),Me&&Me.forEach(t=>{t.addEventListener("click",()=>{q.style.display="none"})}),Oe&&Oe.forEach(t=>{t.addEventListener("click",()=>{J.style.display="none"})}),he&&he.addEventListener("click",()=>{window.history.back()}),Ie&&Ie.addEventListener("click",()=>{document.body.classList.toggle("dark-theme")})}});
