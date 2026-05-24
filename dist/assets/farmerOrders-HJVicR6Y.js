import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css            */import"./layout-loader-LuVZLwht.js";import{a as p,d as D}from"./config--Onoqk_Z.js";import{onAuthStateChanged as Lt}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";import{collection as Y,query as W,where as J,orderBy as K,getDocs as Tt,serverTimestamp as C,onSnapshot as Mt,doc as q,getDoc as U,updateDoc as X}from"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";import"https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";document.addEventListener("DOMContentLoaded",function(){const A=document.getElementById("ordersList"),F=document.getElementById("statusFilter"),B=document.getElementById("orderSearch"),Z=document.getElementById("pageInfo"),tt=document.getElementById("totalOrders"),et=document.getElementById("totalEarnings"),ot=document.getElementById("pendingCount"),nt=document.getElementById("acceptedCount"),rt=document.getElementById("completedCount"),$=document.getElementById("orderModal"),dt=document.getElementById("modalBody"),st=document.querySelector(".close-btn"),P=document.getElementById("cancelOrderBtn"),S=document.getElementById("acceptOrderBtn"),N=document.getElementById("completeOrderBtn"),j=document.getElementById("backBtn"),z=document.getElementById("exportBtn"),H=document.getElementById("bulkUpdateBtn"),Q=document.getElementById("selectAll"),_=document.getElementById("rowsPerPage"),G=document.getElementById("emptyState"),it=document.getElementById("resetFilters"),O=document.getElementById("dateFilter"),at=document.getElementById("printReceiptBtn"),ct=document.getElementById("downloadReceiptBtn");let h=[],c=[],u=1,y=10,x=null,L=null,w=new Set;lt();async function lt(){await ut(),St()}async function ut(){Lt(p,async e=>{e?(await pt(e.uid),mt(e.uid)):(console.log("No user authenticated"),L&&L(),window.location.href="login.html")})}async function pt(e){try{xt();const t=Y(D,"orders"),r=W(t,J("farmerIds","array-contains",e),K("createdAt","desc"));h=(await Tt(r)).docs.map(n=>({id:n.id,...n.data(),customerName:n.data().customerName||"N/A",customerPhone:n.data().customerPhone||"Not provided",customerAddress:n.data().customerAddress||n.data().deliveryAddress||n.data().delivery||"Not provided",createdAt:n.data().createdAt||C()})),E()}catch(t){console.error("Error loading orders:",t),a("Failed to load orders: "+t.message,"error")}}function mt(e){try{const t=Y(D,"orders"),r=W(t,J("farmerIds","array-contains",e),K("createdAt","desc"));L=Mt(r,o=>{const n=[];o.forEach(s=>{n.push({id:s.id,...s.data(),createdAt:s.data().createdAt||C()})}),h=n.sort((s,d)=>{var l,m;const i=((l=s.createdAt)==null?void 0:l.toDate())||new Date(0);return(((m=d.createdAt)==null?void 0:m.toDate())||new Date(0))-i}),E(),h.length>c.length&&h.filter(d=>!c.some(i=>i.id===d.id)).forEach(d=>bt(d))},o=>{console.error("Real-time listener error:",o),a("Error connecting to orders","error")})}catch(t){console.error("Error setting up real-time listener:",t),a("Failed to setup real-time updates","error")}}function v(){if(c.length===0){vt();return}G.hidden=!0;const e=(u-1)*y,t=c.slice(e,e+y);A.innerHTML=t.map(r=>{var o,n,s;return`
            <tr data-order-id="${r.id}">
                <td><input type="checkbox" class="order-checkbox" data-order-id="${r.id}" ${w.has(r.id)?"checked":""}></td>
                <td>#${r.id.slice(0,8)}</td>
                <td>
                    <div class="customer-info">
                        <div class="customer-name">${r.customerName||"N/A"}</div>
                        <div class="customer-phone">${r.customerPhone||"Not provided"}</div>
                    </div>
                </td>
                <td>
                    ${((o=r.items)==null?void 0:o.filter(d=>{var i;return d.farmerId===((i=p.currentUser)==null?void 0:i.uid)}).map(d=>d.name||"Unknown Item").join(", "))||"No items"}
                </td>
                <td>
                    ${((n=r.items)==null?void 0:n.filter(d=>{var i;return d.farmerId===((i=p.currentUser)==null?void 0:i.uid)}).map(d=>`${d.quantity||0} ${d.unit||"unit"}`).join(", "))||"N/A"}
                </td>
                <td>₹${g(r).toFixed(2)}</td>
                <td>${b((s=r.createdAt)==null?void 0:s.toDate())}</td>
                <td><span class="status-badge ${(r.status||"pending").toLowerCase()}">${r.status||"pending"}</span></td>
                <td>
                    <button class="btn-text view-details-btn" data-order-id="${r.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `}).join(""),ht(),Nt(),M()}function g(e){return e.items?e.items.filter(t=>{var r;return t.farmerId===((r=p.currentUser)==null?void 0:r.uid)}).reduce((t,r)=>t+(r.price||0)*(r.quantity||0),0):0}function V(e){var r;const t=h.find(o=>o.id===e);if(!t){a("Order not found","error");return}x=e,dt.innerHTML=`
            <div class="order-details-grid">
                <div class="order-section">
                    <h3>Order Information</h3>
                    <div class="order-info">
                        <div class="order-info-label">Order ID</div>
                        <div class="order-info-value">#${t.id}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Date</div>
                        <div class="order-info-value">${b((r=t.createdAt)==null?void 0:r.toDate())}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Status</div>
                        <div class="order-info-value"><span class="status-badge ${(t.status||"pending").toLowerCase()}">${t.status||"pending"}</span></div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Payment Method</div>
                        <div class="order-info-value">${t.paymentMethod||"Not specified"}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Delivery Date</div>
                        <div class="order-info-value">${t.deliveryDate||"Not specified"}</div>
                    </div>
                </div>

                <div class="order-section">
                    <h3>Customer Information</h3>
                    <div class="order-info">
                        <div class="order-info-label">Name</div>
                        <div class="order-info-value">${t.customerName||"N/A"}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Phone</div>
                        <div class="order-info-value">${t.customerPhone||"Not provided"}</div>
                    </div>
                    <div class="order-info">
                    <div class="order-info-label">Delivery Address</div>
                    <div class="order-info-value">${t.customerAddress||t.deliveryAddress||t.delivery||"Not provided"}</div>
                </div>
                </div>

                <div class="order-section" style="grid-column: 1 / -1">
                    <h3>Order Items</h3>
                    <table class="order-items-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                                <th>Stock Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(t.items||[]).filter(o=>{var n;return o.farmerId===((n=p.currentUser)==null?void 0:n.uid)}).map(o=>`
                                <tr>
                                    <td>${o.name||"Unknown Item"}</td>
                                    <td>${o.quantity||0} ${o.unit||"unit"}</td>
                                    <td>₹${(o.price||0).toFixed(2)}</td>
                                    <td>₹${((o.quantity||0)*(o.price||0)).toFixed(2)}</td>
                                    <td>
                                        <span class="stock-status" id="stock-status-${o.id}">
                                            <i class="fas fa-spinner fa-spin"></i> Checking...
                                        </span>
                                    </td>
                                </tr>
                              `).join("")}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4" class="text-right"><strong>Subtotal:</strong></td>
                                <td>₹${g(t).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `,ft(t),yt(t.status),$.style.display="flex",document.body.style.overflow="hidden",$.removeAttribute("aria-hidden")}async function ft(e){if(e.items)for(const t of e.items.filter(r=>{var o;return r.farmerId===((o=p.currentUser)==null?void 0:o.uid)})){const r=t.id;if(!r){k(t.id,"error","No crop ID");continue}try{const o=q(D,"products",r),n=await U(o);if(!n.exists()){k(t.id,"error","Crop not found");continue}const d=n.data().quantity||0,i=t.quantity||0;d>=i?k(t.id,"sufficient",`In stock (${d})`):d>0?k(t.id,"low",`Low stock (${d}/${i})`):k(t.id,"out-of-stock","Out of stock")}catch(o){console.error("Error checking stock for crop:",r,o),k(t.id,"error","Check failed")}}}function k(e,t,r){const o=document.getElementById(`stock-status-${e}`);if(o){o.innerHTML="",o.className=`stock-status ${t}`;let n="";switch(t){case"sufficient":n='<i class="fas fa-check-circle" style="color: green;"></i>';break;case"low":n='<i class="fas fa-exclamation-triangle" style="color: orange;"></i>';break;case"out-of-stock":n='<i class="fas fa-times-circle" style="color: red;"></i>';break;case"error":n='<i class="fas fa-question-circle" style="color: gray;"></i>';break}o.innerHTML=`${n} ${r}`}}async function T(e){if(x)try{const t=q(D,"orders",x);if(e==="accepted"){const r=await U(t);if(!r.exists()){a("Order not found","error");return}const o=r.data();for(const n of(o.items||[]).filter(s=>{var d;return s.farmerId===((d=p.currentUser)==null?void 0:d.uid)})){const s=n.id;if(!s){console.log("No ID for item:",n.name);continue}try{const d=q(D,"products",s),i=await U(d);if(i.exists()){const l=(i.data().quantity||0)-(n.quantity||0);await X(d,{quantity:Math.max(0,l),status:l>0?"available":"sold",updatedAt:C()})}}catch(d){console.error("Error updating stock for crop:",s,d)}}}await X(t,{status:e,updatedAt:C()}),a(`Order status updated to ${e}`,"success"),R()}catch(t){console.error("Error updating order status:",t),a(`Failed to update status: ${t.message}`,"error")}}function E(){const e=F.value,t=B.value.toLowerCase(),r=O.value,o=new Date;c=h.filter(n=>{if(!(n.items||[]).some(m=>{var I;return m.farmerId===((I=p.currentUser)==null?void 0:I.uid)}))return!1;const d=(n.status||"pending").toLowerCase(),i=e==="all"||d===e.toLowerCase(),f=(n.customerName||"").toLowerCase().includes(t)||n.id.toLowerCase().includes(t)||(n.items||[]).some(m=>{var I;return m.farmerId===((I=p.currentUser)==null?void 0:I.uid)&&(m.name||"").toLowerCase().includes(t)});let l=!0;if(r!=="all"&&n.createdAt){const m=n.createdAt.toDate();switch(r){case"today":l=wt(m,o);break;case"week":l=kt(m,o);break;case"month":l=Et(m,o);break;case"custom":l=!0;break}}return i&&f&&l}),u=1,gt(),v()}function gt(){const e=h.filter(r=>(r.items||[]).some(o=>{var n;return o.farmerId===((n=p.currentUser)==null?void 0:n.uid)}));tt.textContent=e.length;const t=e.reduce((r,o)=>r+g(o),0);et.textContent=t.toFixed(2),ot.textContent=e.filter(r=>(r.status||"pending")==="pending").length,nt.textContent=e.filter(r=>r.status==="accepted").length,rt.textContent=e.filter(r=>r.status==="completed").length}function ht(){const e=Math.ceil(c.length/y),t=(u-1)*y+1,r=Math.min(u*y,c.length);Z.textContent=`Showing ${t}-${r} of ${c.length} orders`,document.getElementById("firstPageBtn").disabled=u===1,document.getElementById("prevPageBtn").disabled=u===1,document.getElementById("nextPageBtn").disabled=u===e||e===0,document.getElementById("lastPageBtn").disabled=u===e||e===0;const o=document.getElementById("pageNumbers");o.innerHTML="";const n=5;let s=Math.max(1,u-Math.floor(n/2)),d=Math.min(e,s+n-1);d-s+1<n&&(s=Math.max(1,d-n+1));for(let i=s;i<=d;i++){const f=document.createElement("button");f.className=`page-number ${i===u?"active":""}`,f.textContent=i,f.addEventListener("click",()=>{u=i,v()}),o.appendChild(f)}}function yt(e){switch(P.style.display="none",S.style.display="none",N.style.display="none",(e||"pending").toLowerCase()){case"pending":P.style.display="block",S.style.display="block";break;case"accepted":N.style.display="block";break}}function M(){H.disabled=w.size===0}function R(){$.style.display="none",document.body.style.overflow="",x=null,$.setAttribute("aria-hidden","true")}function xt(){A.innerHTML=`
            <tr class="loading-skeleton">
                <td colspan="9">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line short"></div>
                </td>
            </tr>
        `.repeat(5)}function vt(){A.innerHTML="",G.hidden=!1}function bt(e){if(document.hidden)return;const t=document.createElement("div");t.className="notification new-order-notification",t.innerHTML=`
            <div class="notification-header">
                <span class="notification-title">New Order Received</span>
                <span class="notification-time">Just now</span>
            </div>
            <div class="notification-body">
                Order #${e.id.slice(0,8)} from ${e.customerName||"Customer"}
            </div>
        `,document.body.appendChild(t),setTimeout(()=>{t.classList.add("fade-out"),setTimeout(()=>t.remove(),300)},5e3)}function a(e,t="info"){const r=document.createElement("div");r.className=`toast ${t}`,r.textContent=e,document.body.appendChild(r),setTimeout(()=>{r.classList.add("fade-out"),setTimeout(()=>r.remove(),300)},3e3)}function b(e){return e?new Intl.DateTimeFormat("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(e):"N/A"}function wt(e,t){return e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth()&&e.getDate()===t.getDate()}function kt(e,t){return Math.round(Math.abs((e-t)/864e5))<=7}function Et(e,t){return e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth()}async function $t(){var t;if(!x){a("No order selected","warning");return}const e=h.find(r=>r.id===x);if(!e){a("Order not found","error");return}try{a("Generating PDF...","info");const{jsPDF:r}=window.jspdf,o=new r;o.setFillColor(76,175,80),o.rect(0,0,210,30,"F"),o.setTextColor(255,255,255),o.setFontSize(20),o.text("FARMER CONNECT",105,15,{align:"center"}),o.setFontSize(12),o.text("ORDER RECEIPT",105,25,{align:"center"}),o.setTextColor(0,0,0);let n=45;o.setFontSize(14),o.text(`Order #${e.id}`,14,n),n+=8,o.setFontSize(10),o.text(`Date: ${b((t=e.createdAt)==null?void 0:t.toDate())}`,14,n),o.text(`Status: ${e.status||"pending"}`,100,n),n+=6,o.text(`Customer: ${e.customerName||"N/A"}`,14,n),o.text(`Phone: ${e.customerPhone||"N/A"}`,100,n),n+=6,o.text(`Delivery Address: ${e.deliveryAddress||"Not provided"}`,14,n),n+=10,o.setFillColor(240,240,240),o.rect(14,n,182,6,"F"),o.setTextColor(60,60,60),o.setFontSize(8),o.text("Item",16,n+4),o.text("Quantity",80,n+4),o.text("Unit Price",120,n+4),o.text("Total",160,n+4),n+=6,(e.items||[]).filter(d=>{var i;return d.farmerId===((i=p.currentUser)==null?void 0:i.uid)}).forEach(d=>{o.setTextColor(40,40,40),o.text(d.name||"Unknown Item",16,n+4),o.text(`${d.quantity||0} ${d.unit||"unit"}`,80,n+4),o.text(`₹${(d.price||0).toFixed(2)}`,120,n+4),o.text(`₹${((d.quantity||0)*(d.price||0)).toFixed(2)}`,160,n+4),n+=6}),n+=4,o.setFontSize(10),o.setTextColor(0,0,0),o.text(`Subtotal: ₹${g(e).toFixed(2)}`,140,n),n+=20,o.setFontSize(8),o.setTextColor(100,100,100),o.text("Thank you for your business!",105,n,{align:"center"}),n+=4,o.text("Generated by Farmer Connect",105,n,{align:"center"}),o.save(`order_${e.id.slice(0,8)}_receipt.pdf`),a("PDF downloaded successfully","success")}catch(r){console.error("Error generating PDF:",r),a("Failed to generate PDF","error")}}function It(){var o;if(!x){a("No order selected","warning");return}const e=h.find(n=>n.id===x);if(!e){a("Order not found","error");return}const t=window.open("","_blank"),r=(e.items||[]).filter(n=>{var s;return n.farmerId===((s=p.currentUser)==null?void 0:s.uid)});t.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Order Receipt - #${e.id}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        color: #333;
                        max-width: 800px;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #4CAF50;
                        padding-bottom: 10px;
                    }
                    .order-info { 
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 20px;
                    }
                    .info-section {
                        background: #f9f9f9;
                        padding: 15px;
                        border-radius: 5px;
                    }
                    .order-items { 
                        width: 100%; 
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    .order-items th, .order-items td {
                        border: 1px solid #ddd;
                        padding: 10px;
                        text-align: left;
                    }
                    .order-items th {
                        background-color: #4CAF50;
                        color: white;
                    }
                    .total-row {
                        background-color: #f8f9fa;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="color: #4CAF50; margin: 0;">FARMER CONNECT</h1>
                    <h2 style="margin: 5px 0;">ORDER RECEIPT</h2>
                </div>
                
                <div class="order-info">
                    <div class="info-section">
                        <h3>Order Information</h3>
                        <p><strong>Order ID:</strong> #${e.id}</p>
                        <p><strong>Date:</strong> ${b((o=e.createdAt)==null?void 0:o.toDate())}</p>
                        <p><strong>Status:</strong> ${e.status||"pending"}</p>
                        <p><strong>Payment Method:</strong> ${e.paymentMethod||"Not specified"}</p>
                    </div>
                    
                    <div class="info-section">
                        <h3>Customer Information</h3>
                        <p><strong>Name:</strong> ${e.customerName||"N/A"}</p>
                        <p><strong>Phone:</strong> ${e.customerPhone||"N/A"}</p>
                        <p><strong>Delivery Address:</strong> ${e.deliveryAddress||"Not provided"}</p>
                    </div>
                </div>
                
                <h3>Order Items</h3>
                <table class="order-items">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${r.map(n=>`
                            <tr>
                                <td>${n.name||"Unknown Item"}</td>
                                <td>${n.quantity||0} ${n.unit||"unit"}</td>
                                <td>₹${(n.price||0).toFixed(2)}</td>
                                <td>₹${((n.quantity||0)*(n.price||0)).toFixed(2)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                            <td><strong>₹${g(e).toFixed(2)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
                
                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>Generated by Farmer Connect on ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Receipt</button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                    };
                <\/script>
            </body>
            </html>
        `),t.document.close()}function Dt(){const e=document.getElementById("exportDropdown");e||Ct(),e.style.display=e.style.display==="block"?"none":"block"}function Ct(){const e=document.createElement("div");e.id="exportDropdown",e.className="export-dropdown",e.style.cssText=`
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            min-width: 180px;
            margin-top: 5px;
            display: none;
        `,e.innerHTML=`
            <button class="export-option" onclick="exportAsCSV()" style="width: 100%; padding: 12px 16px; border: none; background: none; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #333;">
                <i class="fas fa-file-csv"></i> Export as CSV
            </button>
            <button class="export-option" onclick="exportAsPDF()" style="width: 100%; padding: 12px 16px; border: none; background: none; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #333;">
                <i class="fas fa-file-pdf"></i> Download PDF
            </button>
            <button class="export-option" onclick="printOrders()" style="width: 100%; padding: 12px 16px; border: none; background: none; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #333;">
                <i class="fas fa-print"></i> Print Report
            </button>
        `,z.parentNode.appendChild(e),document.addEventListener("click",t=>{!t.target.closest(".export-dropdown")&&!t.target.matches("#exportBtn")&&(e.style.display="none")})}function At(){if(c.length===0){a("No orders to export","warning");return}const e=["Order ID","Customer Name","Customer Phone","Items","Quantities","Total","Date","Status","Delivery Address"],t=c.map(o=>{var s;const n=(o.items||[]).filter(d=>{var i;return d.farmerId===((i=p.currentUser)==null?void 0:i.uid)});return[o.id,o.customerName||"N/A",o.customerPhone||"N/A",n.map(d=>d.name||"Unknown").join(", "),n.map(d=>`${d.quantity||0} ${d.unit||"unit"}`).join(", "),`₹${g(o).toFixed(2)}`,b((s=o.createdAt)==null?void 0:s.toDate()),o.status||"pending",o.deliveryAddress||"N/A"]}),r=[e.join(","),...t.map(o=>o.map(n=>`"${n}"`).join(","))].join(`
`);Pt(r,`orders_${new Date().toISOString().slice(0,10)}.csv`,"text/csv"),document.getElementById("exportDropdown").style.display="none"}async function Ft(){if(c.length===0){a("No orders to export","warning");return}try{a("Generating PDF report...","info");const{jsPDF:e}=window.jspdf,t=new e;t.setFontSize(20),t.setTextColor(40,40,40),t.text("Orders Report - Farmer Connect",105,15,{align:"center"}),t.setFontSize(10),t.setTextColor(100,100,100),t.text(`Generated on: ${new Date().toLocaleDateString()}`,105,22,{align:"center"}),t.setFontSize(12),t.setTextColor(40,40,40),t.text(`Total Orders: ${c.length}`,14,35);const r=c.reduce((s,d)=>s+g(d),0);t.text(`Total Earnings: ₹${r.toFixed(2)}`,14,42);let o=60;const n=t.internal.pageSize.height;c.forEach((s,d)=>{var f;o>n-50&&(t.addPage(),o=20),t.setFontSize(14),t.setTextColor(30,30,30),t.text(`Order #${s.id.slice(0,8)}`,14,o),o+=8,t.setFontSize(10),t.setTextColor(100,100,100),t.text(`Date: ${b((f=s.createdAt)==null?void 0:f.toDate())}`,14,o),t.text(`Status: ${s.status||"pending"}`,80,o),t.text(`Customer: ${s.customerName||"N/A"}`,130,o),o+=6,t.text(`Phone: ${s.customerPhone||"N/A"}`,14,o),t.text(`Amount: ₹${g(s).toFixed(2)}`,130,o),o+=10,(s.items||[]).filter(l=>{var m;return l.farmerId===((m=p.currentUser)==null?void 0:m.uid)}).forEach(l=>{o>n-20&&(t.addPage(),o=20),t.setTextColor(60,60,60),t.text(`• ${l.name||"Unknown Item"} - ${l.quantity||0} ${l.unit||"unit"} - ₹${((l.quantity||0)*(l.price||0)).toFixed(2)}`,20,o),o+=5}),o+=10,d<c.length-1&&(t.setDrawColor(200,200,200),t.line(14,o,194,o),o+=15)}),t.save(`orders_report_${new Date().toISOString().slice(0,10)}.pdf`),a("PDF report downloaded successfully","success")}catch(e){console.error("Error generating PDF report:",e),a("Failed to generate PDF report","error")}document.getElementById("exportDropdown").style.display="none"}function Bt(){if(c.length===0){a("No orders to print","warning");return}try{a("Preparing print...","info");const e=window.open("","_blank");e.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Orders Report - Farmer Connect</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px; 
                            color: #333;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 30px;
                            border-bottom: 2px solid #4CAF50;
                            padding-bottom: 10px;
                        }
                        .summary {
                            margin-bottom: 20px;
                            padding: 15px;
                            background: #f8f9fa;
                            border-radius: 5px;
                        }
                        .order { 
                            margin-bottom: 25px; 
                            padding: 15px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            page-break-inside: avoid;
                        }
                        .order-header { 
                            background: #f5f5f5; 
                            padding: 10px; 
                            margin: -15px -15px 15px -15px;
                            border-bottom: 1px solid #ddd;
                        }
                        .order-items { 
                            width: 100%; 
                            border-collapse: collapse;
                            margin: 10px 0;
                        }
                        .order-items th, .order-items td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        .order-items th {
                            background-color: #4CAF50;
                            color: white;
                        }
                        @media print {
                            .no-print { display: none; }
                            .order { page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 style="color: #4CAF50;">FARMER CONNECT</h1>
                        <h2>Orders Report</h2>
                        <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="summary">
                        <strong>Summary:</strong> 
                        ${c.length} orders | 
                        Total Earnings: ₹${c.reduce((t,r)=>t+g(r),0).toFixed(2)}
                    </div>
                    
                    ${c.map(t=>{var o;const r=(t.items||[]).filter(n=>{var s;return n.farmerId===((s=p.currentUser)==null?void 0:s.uid)});return`
                            <div class="order">
                                <div class="order-header">
                                    <strong>Order #${t.id.slice(0,8)}</strong> | 
                                    Date: ${b((o=t.createdAt)==null?void 0:o.toDate())} | 
                                    Status: ${t.status||"pending"} |
                                    Customer: ${t.customerName||"N/A"}
                                </div>
                                
                                <div><strong>Customer Phone:</strong> ${t.customerPhone||"N/A"}</div>
                                <div><strong>Delivery Address:</strong> ${t.deliveryAddress||"N/A"}</div>
                                <div><strong>Total Amount:</strong> ₹${g(t).toFixed(2)}</div>
                                
                                <table class="order-items">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Quantity</th>
                                            <th>Unit Price</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${r.map(n=>`
                                            <tr>
                                                <td>${n.name||"Unknown Item"}</td>
                                                <td>${n.quantity||0} ${n.unit||"unit"}</td>
                                                <td>₹${(n.price||0).toFixed(2)}</td>
                                                <td>₹${((n.quantity||0)*(n.price||0)).toFixed(2)}</td>
                                            </tr>
                                        `).join("")}
                                    </tbody>
                                </table>
                            </div>
                        `}).join("")}
                    
                    <div class="no-print" style="margin-top: 20px; text-align: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
                        <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
                    </div>
                    
                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    <\/script>
                </body>
                </html>
            `),e.document.close()}catch(e){console.error("Error printing orders:",e),a("Failed to open print window","error")}document.getElementById("exportDropdown").style.display="none"}function Pt(e,t,r){const o=new Blob([e],{type:r}),n=URL.createObjectURL(o),s=document.createElement("a");s.setAttribute("href",n),s.setAttribute("download",t),s.style.visibility="hidden",document.body.appendChild(s),s.click(),document.body.removeChild(s)}function St(){F.addEventListener("change",E),B.addEventListener("input",Ot(E,300)),O.addEventListener("change",E),it.addEventListener("click",()=>{F.value="all",B.value="",O.value="all",E()}),document.getElementById("firstPageBtn").addEventListener("click",()=>{u=1,v()}),document.getElementById("prevPageBtn").addEventListener("click",()=>{u>1&&(u--,v())}),document.getElementById("nextPageBtn").addEventListener("click",()=>{u<Math.ceil(c.length/y)&&(u++,v())}),document.getElementById("lastPageBtn").addEventListener("click",()=>{u=Math.ceil(c.length/y),v()}),_.addEventListener("change",()=>{y=parseInt(_.value),u=1,v()}),st.addEventListener("click",R),window.addEventListener("click",e=>{e.target===$&&R()}),P.addEventListener("click",()=>T("cancelled")),S.addEventListener("click",()=>T("accepted")),N.addEventListener("click",()=>T("completed")),at.addEventListener("click",It),ct.addEventListener("click",$t),j&&j.addEventListener("click",()=>{window.location.href="farmer-dashboard.html"}),Q.addEventListener("change",e=>{document.querySelectorAll(".order-checkbox").forEach(r=>{r.checked=e.target.checked,e.target.checked?w.add(r.dataset.orderId):w.delete(r.dataset.orderId)}),M()}),H.addEventListener("click",()=>{const e=document.getElementById("bulkStatusDropdown");e.style.display=e.style.display==="block"?"none":"block"}),document.querySelectorAll(".bulk-status-option").forEach(e=>{e.addEventListener("click",()=>{a("Bulk update functionality to be implemented","info"),document.getElementById("bulkStatusDropdown").style.display="none"})}),z.addEventListener("click",Dt)}function Nt(){document.querySelectorAll(".view-details-btn").forEach(e=>{e.addEventListener("click",t=>{t.stopPropagation(),V(e.dataset.orderId)})}),document.querySelectorAll(".order-checkbox").forEach(e=>{e.addEventListener("change",t=>{t.stopPropagation(),e.checked?w.add(e.dataset.orderId):(w.delete(e.dataset.orderId),Q.checked=!1),M()})}),document.querySelectorAll("tr[data-order-id]").forEach(e=>{e.addEventListener("click",t=>{!t.target.classList.contains("order-checkbox")&&!t.target.closest(".order-checkbox")&&V(e.dataset.orderId)})})}function Ot(e,t){let r;return function(){const o=this,n=arguments;clearTimeout(r),r=setTimeout(()=>e.apply(o,n),t)}}window.exportAsCSV=At,window.exportAsPDF=Ft,window.printOrders=Bt});
