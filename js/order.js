import { db, auth } from '../config.js';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  getDoc,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const ordersList = document.getElementById('ordersList');
    const statusFilter = document.getElementById('statusFilter');
    const orderSearch = document.getElementById('orderSearch');
    const pageInfo = document.getElementById('pageInfo');
    const totalOrders = document.getElementById('totalOrders');
    const totalEarnings = document.getElementById('totalEarnings');
    const pendingCount = document.getElementById('pendingCount');
    const acceptedCount = document.getElementById('acceptedCount');
    const completedCount = document.getElementById('completedCount');
    const orderModal = document.getElementById('orderModal');
    const modalBody = document.getElementById('modalBody');
    const closeModalBtn = document.querySelector('.close-btn');
    const cancelOrderBtn = document.getElementById('cancelOrderBtn');
    const acceptOrderBtn = document.getElementById('acceptOrderBtn');
    const completeOrderBtn = document.getElementById('completeOrderBtn');
    const backBtn = document.getElementById('backBtn');
    const exportBtn = document.getElementById('exportBtn');
    const bulkUpdateBtn = document.getElementById('bulkUpdateBtn');
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowsPerPage = document.getElementById('rowsPerPage');
    const emptyState = document.getElementById('emptyState');
    const resetFilters = document.getElementById('resetFilters');
    const dateFilter = document.getElementById('dateFilter');

    // State
    let orders = [];
    let filteredOrders = [];
    let currentPage = 1;
    let ordersPerPage = 10;
    let selectedOrderId = null;
    let unsubscribeOrders = null;
    let selectedOrders = new Set();

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
                setupRealTimeListener(user.uid);
            } else {
                if (unsubscribeOrders) unsubscribeOrders();
                window.location.href = "login.html";
            }
        });
    }


async function updateOrderWithFarmerIds(orderData, orderId) {
    const farmerIds = [...new Set(orderData.items.map(item => item.farmerId))];
    await setDoc(doc(db, 'orders', orderId), {
        ...orderData,
        farmerIds
    });
}

async function fetchOrders(farmerId) {
    try {
        showLoadingState();

        const q = query(
            collection(db, 'orders'),
            where('farmerIds', 'array-contains', farmerId)
        );

        const querySnapshot = await getDocs(q);
        orders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt || serverTimestamp()
        }));

        orders.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());

        filterOrders();

    } catch (error) {
        console.error("Error loading orders:", error);
        showToast('Failed to load orders', 'error');
    }
}



    function setupRealTimeListener(farmerId) {
        const q = query(
            collection(db, 'orders'),
where('farmerIds', 'array-contains', farmerId)
        );
        
        unsubscribeOrders = onSnapshot(q, (snapshot) => {
            const updatedOrders = [];
            snapshot.forEach(doc => {
                updatedOrders.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt || serverTimestamp()
                });
            });
            
            // Update orders and maintain sort order
            orders = updatedOrders.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
            filterOrders();
            
            // Check for new orders to show notifications
            if (orders.length > filteredOrders.length) {
                const newOrders = orders.filter(o => 
                    !filteredOrders.some(fo => fo.id === o.id)
                );
                newOrders.forEach(order => showNewOrderNotification(order));
            }
        });
    }

    function renderOrders() {
        if (filteredOrders.length === 0) {
            showEmptyState();
            return;
        }

        emptyState.hidden = true;
        const startIndex = (currentPage - 1) * ordersPerPage;
        const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

        ordersList.innerHTML = paginatedOrders.map(order => `
            <tr data-order-id="${order.id}">
                <td><input type="checkbox" class="order-checkbox" data-order-id="${order.id}" ${selectedOrders.has(order.id) ? 'checked' : ''}></td>
                <td>#${order.id.slice(0,8)}</td>
                <td>
                    <div class="customer-info">
                        <div class="customer-name">${order.customerName}</div>
                        <div class="customer-phone">${order.customerPhone || 'Not provided'}</div>
                    </div>
                </td>
                <td>
                    ${order.items.filter(i => i.farmerId === auth.currentUser.uid)
                      .map(i => i.name)
                      .join(', ')}
                </td>
                <td>
                    ${order.items.filter(i => i.farmerId === auth.currentUser.uid)
                      .map(i => `${i.quantity} ${i.unit || 'unit'}`)
                      .join(', ')}
                </td>
                <td>₹${calculateFarmerTotal(order).toFixed(2)}</td>
                <td>${formatDate(order.createdAt?.toDate())}</td>
                <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    <button class="btn-text view-details-btn" data-order-id="${order.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
        
        updatePaginationInfo();
        setupRowEventListeners();
        updateBulkActions();
    }

    function calculateFarmerTotal(order) {
        return order.items
            .filter(i => i.farmerId === auth.currentUser.uid)
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    function showOrderDetails(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        selectedOrderId = orderId;
        
        modalBody.innerHTML = `
            <div class="order-details-grid">
                <div class="order-section">
                    <h3>Order Information</h3>
                    <div class="order-info">
                        <div class="order-info-label">Order ID</div>
                        <div class="order-info-value">#${order.id}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Date</div>
                        <div class="order-info-value">${formatDate(order.createdAt?.toDate())}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Status</div>
                        <div class="order-info-value"><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Payment Method</div>
                        <div class="order-info-value">${order.paymentMethod || 'Not specified'}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Delivery Date</div>
                        <div class="order-info-value">${order.deliveryDate || 'Not specified'}</div>
                    </div>
                </div>

                <div class="order-section">
                    <h3>Customer Information</h3>
                    <div class="order-info">
                        <div class="order-info-label">Name</div>
                        <div class="order-info-value">${order.customerName}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Phone</div>
                        <div class="order-info-value">${order.customerPhone || 'Not provided'}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Delivery Address</div>
                        <div class="order-info-value">${order.deliveryAddress || 'Not provided'}</div>
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
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.filter(i => i.farmerId === auth.currentUser.uid)
                              .map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity} ${item.unit || 'unit'}</td>
                                    <td>₹${item.price.toFixed(2)}</td>
                                    <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                                </tr>
                              `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
                                <td>₹${calculateFarmerTotal(order).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        
        updateActionButtons(order.status);
        orderModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    async function updateOrderStatus(newStatus) {
        if (!selectedOrderId) return;

        try {
            const orderRef = doc(db, "orders", selectedOrderId);
            
            if (newStatus === 'accepted') {
                const orderSnapshot = await getDoc(orderRef);
                if (!orderSnapshot.exists()) {
                    showToast('Order not found', 'error');
                    return;
                }
                
                const order = orderSnapshot.data();
                
                // Update stock for each item
                for (const item of order.items.filter(i => i.farmerId === auth.currentUser.uid)) {
                    const cropRef = doc(db, 'crops', item.cropId);
                    await runTransaction(db, async (transaction) => {
                        const cropDoc = await transaction.get(cropRef);
                        if (!cropDoc.exists()) {
                            throw new Error("Crop not found");
                        }
                        
                        const newQuantity = cropDoc.data().quantity - item.quantity;
                        if (newQuantity < 0) {
                            throw new Error("Insufficient stock");
                        }
                        
                        transaction.update(cropRef, {
                            quantity: newQuantity,
                            status: newQuantity > 0 ? 'available' : 'sold'
                        });
                    });
                }
            }
            
            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            
            showToast(`Order status updated to ${newStatus}`, 'success');
            closeModal();
        } catch (error) {
            console.error('Error updating order status:', error);
            showToast(`Failed to update status: ${error.message}`, 'error');
        }
    }

    async function bulkUpdateStatus(newStatus) {
        if (selectedOrders.size === 0) return;

        try {
            const batchPromises = [];
            const insufficientStockOrders = [];
            
            for (const orderId of selectedOrders) {
                const orderRef = doc(db, "orders", orderId);
                
                if (newStatus === 'accepted') {
                    const orderSnapshot = await getDoc(orderRef);
                    if (!orderSnapshot.exists()) continue;
                    
                    const order = orderSnapshot.data();
                    
                    try {
                        // Verify stock for each item
                        for (const item of order.items.filter(i => i.farmerId === auth.currentUser.uid)) {
                            const cropRef = doc(db, 'crops', item.cropId);
                            const cropDoc = await getDoc(cropRef);
                            
                            if (!cropDoc.exists()) {
                                throw new Error("Crop not found");
                            }
                            
                            const newQuantity = cropDoc.data().quantity - item.quantity;
                            if (newQuantity < 0) {
                                throw new Error("Insufficient stock");
                            }
                        }
                        
                        // If stock is sufficient, add to batch
                        batchPromises.push(updateDoc(orderRef, {
                            status: newStatus,
                            updatedAt: serverTimestamp()
                        }));
                        
                    } catch (error) {
                        insufficientStockOrders.push({
                            orderId,
                            error: error.message
                        });
                        continue;
                    }
                } else {
                    // For non-accepted statuses, just update
                    batchPromises.push(updateDoc(orderRef, {
                        status: newStatus,
                        updatedAt: serverTimestamp()
                    }));
                }
            }
            
            // Execute all updates
            await Promise.all(batchPromises);
            
            // Show results
            if (insufficientStockOrders.length > 0) {
                showToast(
                    `Updated ${batchPromises.length} orders. ${insufficientStockOrders.length} had insufficient stock.`,
                    'warning'
                );
            } else {
                showToast(`Updated ${batchPromises.length} orders to ${newStatus}`, 'success');
            }
            
            // Clear selection
            selectedOrders.clear();
            selectAllCheckbox.checked = false;
            renderOrders();
            
        } catch (error) {
            console.error('Error in bulk update:', error);
            showToast('Failed to update some orders', 'error');
        }
    }

    function filterOrders() {
        const status = statusFilter.value;
        const searchTerm = orderSearch.value.toLowerCase();
        const dateRange = dateFilter.value;
        const now = new Date();
        
        filteredOrders = orders.filter(order => {
            const hasFarmerItems = order.items.some(i => i.farmerId === auth.currentUser.uid);
            if (!hasFarmerItems) return false;
            
            // Status filter
            const matchesStatus = status === 'all' || order.status.toLowerCase() === status.toLowerCase();
            
            // Search filter
            const matchesSearch = 
                order.customerName?.toLowerCase().includes(searchTerm) ||
                order.id.toLowerCase().includes(searchTerm) ||
                order.items.some(item => 
                    item.farmerId === auth.currentUser.uid &&
                    item.name?.toLowerCase().includes(searchTerm)
                );
            
            // Date filter
            let matchesDate = true;
            if (dateRange !== 'all' && order.createdAt) {
                const orderDate = order.createdAt.toDate();
                
                switch (dateRange) {
                    case 'today':
                        matchesDate = isSameDay(orderDate, now);
                        break;
                    case 'week':
                        matchesDate = isSameWeek(orderDate, now);
                        break;
                    case 'month':
                        matchesDate = isSameMonth(orderDate, now);
                        break;
                    case 'custom':
                        // You would implement custom date range logic here
                        matchesDate = true; // Default to true until custom range is set
                        break;
                }
            }
            
            return matchesStatus && matchesSearch && matchesDate;
        });

        currentPage = 1;
        updateStats();
        renderOrders();
    }

    function updateStats() {
        const farmerOrders = orders.filter(o => 
            o.items.some(i => i.farmerId === auth.currentUser?.uid)
        );
        
        totalOrders.textContent = farmerOrders.length;
        
        const earnings = farmerOrders.reduce((sum, order) => {
            return sum + calculateFarmerTotal(order);
        }, 0);
        
        totalEarnings.textContent = earnings.toFixed(2);
        pendingCount.textContent = farmerOrders.filter(o => o.status === 'pending').length;
        acceptedCount.textContent = farmerOrders.filter(o => o.status === 'accepted').length;
        completedCount.textContent = farmerOrders.filter(o => o.status === 'completed').length;
    }

    function updatePaginationInfo() {
        const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
        const startOrder = (currentPage - 1) * ordersPerPage + 1;
        const endOrder = Math.min(currentPage * ordersPerPage, filteredOrders.length);
        
        pageInfo.textContent = `Showing ${startOrder}-${endOrder} of ${filteredOrders.length} orders`;
        
        // Update pagination buttons
        document.getElementById('firstPageBtn').disabled = currentPage === 1;
        document.getElementById('prevPageBtn').disabled = currentPage === 1;
        document.getElementById('nextPageBtn').disabled = currentPage === totalPages || totalPages === 0;
        document.getElementById('lastPageBtn').disabled = currentPage === totalPages || totalPages === 0;
        
        // Update page numbers
        const pageNumbers = document.getElementById('pageNumbers');
        pageNumbers.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderOrders();
            });
            pageNumbers.appendChild(pageBtn);
        }
    }

    function updateActionButtons(status) {
        cancelOrderBtn.style.display = 'none';
        acceptOrderBtn.style.display = 'none';
        completeOrderBtn.style.display = 'none';

        switch (status.toLowerCase()) {
            case 'pending':
                cancelOrderBtn.style.display = 'block';
                acceptOrderBtn.style.display = 'block';
                break;
            case 'accepted':
                completeOrderBtn.style.display = 'block';
                break;
            case 'completed':
            case 'cancelled':
                // No buttons for these states
                break;
        }
    }

    function updateBulkActions() {
        bulkUpdateBtn.disabled = selectedOrders.size === 0;
    }

    function closeModal() {
        orderModal.style.display = 'none';
        document.body.style.overflow = '';
        selectedOrderId = null;
    }

    function showLoadingState() {
        ordersList.innerHTML = `
            <tr class="loading-skeleton">
                <td colspan="9">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line short"></div>
                </td>
            </tr>
        `.repeat(5);
    }

    function showEmptyState() {
        ordersList.innerHTML = '';
        emptyState.hidden = false;
    }

    function showNewOrderNotification(order) {
        if (document.hidden) return; // Don't show if tab is not active
        
        const notification = document.createElement('div');
        notification.className = 'notification new-order-notification';
        notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">New Order Received</span>
                <span class="notification-time">Just now</span>
            </div>
            <div class="notification-body">
                Order #${order.id.slice(0,8)} from ${order.customerName}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function formatDate(date) {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    function isSameWeek(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round(Math.abs((date1 - date2) / oneDay));
        return diffDays <= 7 && date1.getDay() <= date2.getDay();
    }

    function isSameMonth(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth();
    }

    function setupEventListeners() {
        // Filter event listeners
        statusFilter.addEventListener('change', filterOrders);
        orderSearch.addEventListener('input', debounce(filterOrders, 300));
        dateFilter.addEventListener('change', filterOrders);
        resetFilters.addEventListener('click', () => {
            statusFilter.value = 'all';
            orderSearch.value = '';
            dateFilter.value = 'all';
            filterOrders();
        });

        // Pagination event listeners
        document.getElementById('firstPageBtn').addEventListener('click', () => {
            currentPage = 1;
            renderOrders();
        });
        
        document.getElementById('prevPageBtn').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderOrders();
            }
        });
        
        document.getElementById('nextPageBtn').addEventListener('click', () => {
            if (currentPage < Math.ceil(filteredOrders.length / ordersPerPage)) {
                currentPage++;
                renderOrders();
            }
        });
        
        document.getElementById('lastPageBtn').addEventListener('click', () => {
            currentPage = Math.ceil(filteredOrders.length / ordersPerPage);
            renderOrders();
        });
        
        rowsPerPage.addEventListener('change', () => {
            ordersPerPage = parseInt(rowsPerPage.value);
            currentPage = 1;
            renderOrders();
        });

        // Modal event listeners
        closeModalBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === orderModal) closeModal();
        });
        
        cancelOrderBtn.addEventListener('click', () => updateOrderStatus('cancelled'));
        acceptOrderBtn.addEventListener('click', () => updateOrderStatus('accepted'));
        completeOrderBtn.addEventListener('click', () => updateOrderStatus('completed'));
        
        backBtn.addEventListener('click', () => {
            currentPage = 1;
            renderOrders();
        });
        document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'farmer4.html'; // change to your dashboard URL if different
});
        // Bulk actions
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.order-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
                if (e.target.checked) {
                    selectedOrders.add(checkbox.dataset.orderId);
                } else {
                    selectedOrders.delete(checkbox.dataset.orderId);
                }
            });
            updateBulkActions();
        });
        
        bulkUpdateBtn.addEventListener('click', () => {
            const statusDropdown = document.getElementById('bulkStatusDropdown');
            statusDropdown.style.display = statusDropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        document.querySelectorAll('.bulk-status-option').forEach(option => {
            option.addEventListener('click', () => {
                bulkUpdateStatus(option.dataset.status);
            });
        });
        
        exportBtn.addEventListener('click', exportOrders);
    }

    function setupRowEventListeners() {
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showOrderDetails(btn.dataset.orderId);
            });
        });
        
        document.querySelectorAll('.order-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                if (checkbox.checked) {
                    selectedOrders.add(checkbox.dataset.orderId);
                } else {
                    selectedOrders.delete(checkbox.dataset.orderId);
                    selectAllCheckbox.checked = false;
                }
                updateBulkActions();
            });
        });
        
        document.querySelectorAll('tr[data-order-id]').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.classList.contains('order-checkbox') && 
                    !e.target.closest('.order-checkbox')) {
                    showOrderDetails(row.dataset.orderId);
                }
            });
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function exportOrders() {
        if (filteredOrders.length === 0) {
            showToast('No orders to export', 'warning');
            return;
        }
        
        const headers = [
            'Order ID', 'Customer Name', 'Customer Phone', 'Items', 
            'Quantities', 'Total', 'Date', 'Status', 'Delivery Address'
        ];
        
        const data = filteredOrders.map(order => {
            const farmerItems = order.items.filter(i => i.farmerId === auth.currentUser.uid);
            return [
                order.id,
                order.customerName,
                order.customerPhone || 'N/A',
                farmerItems.map(i => i.name).join(', '),
                farmerItems.map(i => `${i.quantity} ${i.unit || 'unit'}`).join(', '),
                `₹${calculateFarmerTotal(order).toFixed(2)}`,
                formatDate(order.createdAt?.toDate()),
                order.status,
                order.deliveryAddress || 'N/A'
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...data.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});