import { db, auth } from '../config.js';
import { 
  collection, 
  query, 
  where,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements (same as before)
    const ordersTableBody = document.getElementById('ordersTableBody');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const resetFilters = document.getElementById('resetFilters');
    const refreshOrders = document.getElementById('refreshOrders');
    const emptyState = document.getElementById('emptyState');
    const orderModal = document.getElementById('orderModal');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = document.querySelector('.close-btn');
    const cancelOrderBtn = document.getElementById('cancelOrderBtn');
    const trackOrderBtn = document.getElementById('trackOrderBtn');
    
    // State
    let orders = [];
    let unsubscribe = null;

    // Initialize
    init();

    async function init() {
        await setupAuthListener();
        setupEventListeners();
    }

    async function setupAuthListener() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                await fetchOrders(user.uid);
            } else {
                if (unsubscribe) unsubscribe();
                window.location.href = "login.html";
            }
        });
    }

async function fetchOrders(userId) {
    try {
        showLoadingState();
const q = query(
  collection(db, "orders"),
  where("customerId", "==", auth.currentUser.uid),
);        
        if (unsubscribe) unsubscribe(); // Clean previous listener

        unsubscribe = onSnapshot(q, (querySnapshot) => {
            orders = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate() || new Date()
            }));
            orders.sort((a, b) => b.date - a.date);
            renderOrders();
        });

    } catch (error) {
        console.error("Error loading orders:", error);
        showToast('Failed to load orders', 'error');
        showEmptyState();
    }
}


    function renderOrders() {
        const status = statusFilter.value;
        const dateRange = dateFilter.value;
        const now = new Date();
        
        // Filter orders
        let filteredOrders = orders.filter(order => {
            // Status filter
            const statusMatch = status === 'all' || order.status === status;
            
            // Date filter
            let dateMatch = true;
            if (dateRange !== 'all') {
                const orderDate = order.date;
                const diffTime = now - orderDate;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                
                switch (dateRange) {
                    case 'today':
                        dateMatch = diffDays < 1;
                        break;
                    case 'week':
                        dateMatch = diffDays < 7;
                        break;
                    case 'month':
                        dateMatch = diffDays < 30;
                        break;
                }
            }
            
            return statusMatch && dateMatch;
        });
        
        // Clear table
        ordersTableBody.innerHTML = '';
        
        if (filteredOrders.length === 0) {
            showEmptyState();
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Populate table
        filteredOrders.forEach(order => {
            const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const itemsText = order.items.map(item => `${item.name} (${item.quantity})`).join(', ');
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${formatDate(order.date)}</td>
                <td>${itemsText}</td>
                <td>₹${total.toFixed(2)}</td>
                <td><span class="status-badge ${order.status}">${order.status}</span></td>
                <td><button class="btn-text view-details-btn" data-order-id="${order.id}">View</button></td>
            `;
            
            row.querySelector('.view-details-btn').addEventListener('click', () => {
                showOrderDetails(order.id);
            });
            
            ordersTableBody.appendChild(row);
        });
    }

    async function showOrderDetails(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        
        const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        modalBody.innerHTML = `
            <div class="order-details-grid">
                <div class="order-section">
                    <h3>Order Information</h3>
                    <div class="order-info">
                        <div class="order-info-label">Order ID</div>
                        <div class="order-info-value">${order.id}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Date</div>
                        <div class="order-info-value">${formatDate(order.date)}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Status</div>
                        <div class="order-info-value"><span class="status-badge ${order.status}">${order.status}</span></div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Total</div>
                        <div class="order-info-value">₹${total.toFixed(2)}</div>
                    </div>
                </div>
                
                <div class="order-section">
                    <h3>Delivery Information</h3>
                    <div class="order-info">
                        <div class="order-info-label">Address</div>
                        <div class="order-info-value">${order.deliveryAddress || 'Not specified'}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Contact</div>
                        <div class="order-info-value">${order.contactNumber || 'Not specified'}</div>
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
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>₹${item.price.toFixed(2)}</td>
                                    <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" class="text-right"><strong>Total:</strong></td>
                                <td>₹${total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        
        // Update modal buttons based on status
        cancelOrderBtn.style.display = order.status === 'pending' ? 'block' : 'none';
        trackOrderBtn.style.display = order.status !== 'cancelled' ? 'block' : 'none';
        
        // Set up cancel order functionality
        cancelOrderBtn.onclick = async () => {
            try {
                await updateOrderStatus(orderId, 'cancelled');
                showToast('Order cancelled successfully', 'success');
                orderModal.style.display = 'none';
            } catch (error) {
                showToast('Failed to cancel order', 'error');
                console.error(error);
            }
        };
        
        orderModal.style.display = 'flex';
    }

    async function updateOrderStatus(orderId, newStatus) {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: newStatus,
            updatedAt: serverTimestamp()
        });
        
        // Update local state
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            renderOrders();
        }
    }

    function formatDate(date) {
        if (!date) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function showLoadingState() {
        ordersTableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="6">
                    <div class="loading-skeleton"></div>
                </td>
            </tr>
        `.repeat(3);
    }

    function showEmptyState() {
        ordersTableBody.innerHTML = '';
        emptyState.style.display = 'block';
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function setupEventListeners() {
        // Filters
        statusFilter.addEventListener('change', renderOrders);
        dateFilter.addEventListener('change', renderOrders);
        resetFilters.addEventListener('click', () => {
            statusFilter.value = 'all';
            dateFilter.value = 'all';
            renderOrders();
        });
        refreshOrders.addEventListener('click', () => fetchOrders(auth.currentUser.uid));
        
        // Modal
        closeBtn.addEventListener('click', () => {
            orderModal.style.display = 'none';
        });
        window.addEventListener('click', (e) => {
            if (e.target === orderModal) {
                orderModal.style.display = 'none';
            }
        });
        
        // Track order
        trackOrderBtn.addEventListener('click', () => {
            // Implement your tracking logic here
            window.location.href = `tracking.html?orderId=${selectedOrderId}`;
        });
    }
});
document.querySelector('.btn-back').addEventListener('click', () => {
  window.history.back(); // Takes the user to the previous page
});
