// order.js - Complete Version with PDF Download and Print
import { 
  db, 
  auth, 
  onAuthStateChanged,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  serverTimestamp,
  getDoc,
  orderBy
} from '../config.js';

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
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');

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
                console.log('No user authenticated');
                if (unsubscribeOrders) {
                    unsubscribeOrders();
                }
                window.location.href = "login.html";
            }
        });
    }

    async function fetchOrders(farmerId) {
        try {
            showLoadingState();

            const ordersCollection = collection(db, 'orders');
            const q = query(
                ordersCollection,
                where('farmerIds', 'array-contains', farmerId),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            
            orders = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            customerName: doc.data().customerName || 'N/A',
            customerPhone: doc.data().customerPhone || 'Not provided',
            customerAddress: doc.data().customerAddress || doc.data().deliveryAddress || doc.data().delivery || 'Not provided',
            createdAt: doc.data().createdAt || serverTimestamp()

            }));

            filterOrders();

        } catch (error) {
            console.error("Error loading orders:", error);
            showToast('Failed to load orders: ' + error.message, 'error');
        }
    }

    function setupRealTimeListener(farmerId) {
        try {
            const ordersCollection = collection(db, 'orders');
            const q = query(
                ordersCollection,
                where('farmerIds', 'array-contains', farmerId),
                orderBy('createdAt', 'desc')
            );
            
            unsubscribeOrders = onSnapshot(q, 
                (snapshot) => {
                    const updatedOrders = [];
                    snapshot.forEach(doc => {
                        updatedOrders.push({
                            id: doc.id,
                            ...doc.data(),
                            createdAt: doc.data().createdAt || serverTimestamp()
                        });
                    });
                    
                    orders = updatedOrders.sort((a, b) => {
                        const dateA = a.createdAt?.toDate() || new Date(0);
                        const dateB = b.createdAt?.toDate() || new Date(0);
                        return dateB - dateA;
                    });
                    
                    filterOrders();
                    
                    // Check for new orders to show notifications
                    if (orders.length > filteredOrders.length) {
                        const newOrders = orders.filter(o => 
                            !filteredOrders.some(fo => fo.id === o.id)
                        );
                        newOrders.forEach(order => showNewOrderNotification(order));
                    }
                },
                (error) => {
                    console.error('Real-time listener error:', error);
                    showToast('Error connecting to orders', 'error');
                }
            );
        } catch (error) {
            console.error('Error setting up real-time listener:', error);
            showToast('Failed to setup real-time updates', 'error');
        }
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
                        <div class="customer-name">${order.customerName || 'N/A'}</div>
                        <div class="customer-phone">${order.customerPhone || 'Not provided'}</div>
                    </div>
                </td>
                <td>
                    ${order.items?.filter(i => i.farmerId === auth.currentUser?.uid)
                      .map(i => i.name || 'Unknown Item')
                      .join(', ') || 'No items'}
                </td>
                <td>
                    ${order.items?.filter(i => i.farmerId === auth.currentUser?.uid)
                      .map(i => `${i.quantity || 0} ${i.unit || 'unit'}`)
                      .join(', ') || 'N/A'}
                </td>
                <td>₹${calculateFarmerTotal(order).toFixed(2)}</td>
                <td>${formatDate(order.createdAt?.toDate())}</td>
                <td><span class="status-badge ${(order.status || 'pending').toLowerCase()}">${order.status || 'pending'}</span></td>
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
        if (!order.items) return 0;
        
        return order.items
            .filter(i => i.farmerId === auth.currentUser?.uid)
            .reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    }

    function showOrderDetails(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            showToast('Order not found', 'error');
            return;
        }

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
                        <div class="order-info-value"><span class="status-badge ${(order.status || 'pending').toLowerCase()}">${order.status || 'pending'}</span></div>
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
                        <div class="order-info-value">${order.customerName || 'N/A'}</div>
                    </div>
                    <div class="order-info">
                        <div class="order-info-label">Phone</div>
                        <div class="order-info-value">${order.customerPhone || 'Not provided'}</div>
                    </div>
                    <div class="order-info">
                    <div class="order-info-label">Delivery Address</div>
                    <div class="order-info-value">${order.customerAddress || order.deliveryAddress || order.delivery || 'Not provided'}</div>
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
                            ${(order.items || []).filter(i => i.farmerId === auth.currentUser?.uid)
                              .map(item => `
                                <tr>
                                    <td>${item.name || 'Unknown Item'}</td>
                                    <td>${item.quantity || 0} ${item.unit || 'unit'}</td>
                                    <td>₹${(item.price || 0).toFixed(2)}</td>
                                    <td>₹${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                                    <td>
                                        <span class="stock-status" id="stock-status-${item.id}">
                                            <i class="fas fa-spinner fa-spin"></i> Checking...
                                        </span>
                                    </td>
                                </tr>
                              `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4" class="text-right"><strong>Subtotal:</strong></td>
                                <td>₹${calculateFarmerTotal(order).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        
        // Check stock for each item
        checkStockForOrder(order);
        
        updateActionButtons(order.status);
        orderModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Fix for ARIA warning
        orderModal.removeAttribute('aria-hidden');
    }

    async function checkStockForOrder(order) {
        if (!order.items) return;
        
        for (const item of order.items.filter(i => i.farmerId === auth.currentUser?.uid)) {
            const cropId = item.id;
            
            if (!cropId) {
                updateStockStatus(item.id, 'error', 'No crop ID');
                continue;
            }
            
            try {
                const cropRef = doc(db, 'products', cropId);
                const cropDoc = await getDoc(cropRef);
                
                if (!cropDoc.exists()) {
                    updateStockStatus(item.id, 'error', 'Crop not found');
                    continue;
                }
                
                const cropData = cropDoc.data();
                const availableQuantity = cropData.quantity || 0;
                const requiredQuantity = item.quantity || 0;
                
                if (availableQuantity >= requiredQuantity) {
                    updateStockStatus(item.id, 'sufficient', `In stock (${availableQuantity})`);
                } else if (availableQuantity > 0) {
                    updateStockStatus(item.id, 'low', `Low stock (${availableQuantity}/${requiredQuantity})`);
                } else {
                    updateStockStatus(item.id, 'out-of-stock', 'Out of stock');
                }
            } catch (error) {
                console.error('Error checking stock for crop:', cropId, error);
                updateStockStatus(item.id, 'error', 'Check failed');
            }
        }
    }

    function updateStockStatus(itemId, status, message) {
        const statusElement = document.getElementById(`stock-status-${itemId}`);
        if (statusElement) {
            statusElement.innerHTML = '';
            statusElement.className = `stock-status ${status}`;
            
            let icon = '';
            switch (status) {
                case 'sufficient':
                    icon = '<i class="fas fa-check-circle" style="color: green;"></i>';
                    break;
                case 'low':
                    icon = '<i class="fas fa-exclamation-triangle" style="color: orange;"></i>';
                    break;
                case 'out-of-stock':
                    icon = '<i class="fas fa-times-circle" style="color: red;"></i>';
                    break;
                case 'error':
                    icon = '<i class="fas fa-question-circle" style="color: gray;"></i>';
                    break;
            }
            
            statusElement.innerHTML = `${icon} ${message}`;
        }
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
                
                // Update stock for each item using item.id as cropId
                for (const item of (order.items || []).filter(i => i.farmerId === auth.currentUser?.uid)) {
                    const cropId = item.id;
                    
                    if (!cropId) {
                        console.log('No ID for item:', item.name);
                        continue;
                    }
                    
                    try {
                        const cropRef = doc(db, 'products', cropId);
                        const cropDoc = await getDoc(cropRef);
                        
                        if (cropDoc.exists()) {
                            const cropData = cropDoc.data();
                            const newQuantity = (cropData.quantity || 0) - (item.quantity || 0);
                            
                            await updateDoc(cropRef, {
                                quantity: Math.max(0, newQuantity),
                                status: newQuantity > 0 ? 'available' : 'sold',
                                updatedAt: serverTimestamp()
                            });
                        }
                    } catch (error) {
                        console.error('Error updating stock for crop:', cropId, error);
                        // Continue with other items
                    }
                }
            }
            
            // Update order status
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

    function filterOrders() {
        const status = statusFilter.value;
        const searchTerm = orderSearch.value.toLowerCase();
        const dateRange = dateFilter.value;
        const now = new Date();
        
        filteredOrders = orders.filter(order => {
            const hasFarmerItems = (order.items || []).some(i => i.farmerId === auth.currentUser?.uid);
            if (!hasFarmerItems) return false;
            
            // Status filter
            const orderStatus = (order.status || 'pending').toLowerCase();
            const matchesStatus = status === 'all' || orderStatus === status.toLowerCase();
            
            // Search filter
            const matchesSearch = 
                (order.customerName || '').toLowerCase().includes(searchTerm) ||
                order.id.toLowerCase().includes(searchTerm) ||
                (order.items || []).some(item => 
                    item.farmerId === auth.currentUser?.uid &&
                    (item.name || '').toLowerCase().includes(searchTerm)
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
                        matchesDate = true;
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
            (o.items || []).some(i => i.farmerId === auth.currentUser?.uid)
        );
        
        totalOrders.textContent = farmerOrders.length;
        
        const earnings = farmerOrders.reduce((sum, order) => {
            return sum + calculateFarmerTotal(order);
        }, 0);
        
        totalEarnings.textContent = earnings.toFixed(2);
        pendingCount.textContent = farmerOrders.filter(o => (o.status || 'pending') === 'pending').length;
        acceptedCount.textContent = farmerOrders.filter(o => o.status === 'accepted').length;
        completedCount.textContent = farmerOrders.filter(o => o.status === 'completed').length;
    }

    function updatePaginationInfo() {
        const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
        const startOrder = (currentPage - 1) * ordersPerPage + 1;
        const endOrder = Math.min(currentPage * ordersPerPage, filteredOrders.length);
        
        pageInfo.textContent = `Showing ${startOrder}-${endOrder} of ${filteredOrders.length} orders`;
        
        document.getElementById('firstPageBtn').disabled = currentPage === 1;
        document.getElementById('prevPageBtn').disabled = currentPage === 1;
        document.getElementById('nextPageBtn').disabled = currentPage === totalPages || totalPages === 0;
        document.getElementById('lastPageBtn').disabled = currentPage === totalPages || totalPages === 0;
        
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

        const orderStatus = status || 'pending';
        
        switch (orderStatus.toLowerCase()) {
            case 'pending':
                cancelOrderBtn.style.display = 'block';
                acceptOrderBtn.style.display = 'block';
                break;
            case 'accepted':
                completeOrderBtn.style.display = 'block';
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
        
        // Restore aria-hidden when modal is closed
        orderModal.setAttribute('aria-hidden', 'true');
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
        if (document.hidden) return;
        
        const notification = document.createElement('div');
        notification.className = 'notification new-order-notification';
        notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">New Order Received</span>
                <span class="notification-time">Just now</span>
            </div>
            <div class="notification-body">
                Order #${order.id.slice(0,8)} from ${order.customerName || 'Customer'}
            </div>
        `;
        
        document.body.appendChild(notification);
        
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
        return diffDays <= 7;
    }

    function isSameMonth(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth();
    }

    // PDF and Print Functions
    async function downloadOrderPDF() {
        if (!selectedOrderId) {
            showToast('No order selected', 'warning');
            return;
        }

        const order = orders.find(o => o.id === selectedOrderId);
        if (!order) {
            showToast('Order not found', 'error');
            return;
        }

        try {
            showToast('Generating PDF...', 'info');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add header
            doc.setFillColor(76, 175, 80);
            doc.rect(0, 0, 210, 30, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text('FARMER CONNECT', 105, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text('ORDER RECEIPT', 105, 25, { align: 'center' });
            
            // Order details
            doc.setTextColor(0, 0, 0);
            let yPosition = 45;
            
            doc.setFontSize(14);
            doc.text(`Order #${order.id}`, 14, yPosition);
            yPosition += 8;
            
            doc.setFontSize(10);
            doc.text(`Date: ${formatDate(order.createdAt?.toDate())}`, 14, yPosition);
            doc.text(`Status: ${order.status || 'pending'}`, 100, yPosition);
            yPosition += 6;
            doc.text(`Customer: ${order.customerName || 'N/A'}`, 14, yPosition);
            doc.text(`Phone: ${order.customerPhone || 'N/A'}`, 100, yPosition);
            yPosition += 6;
            doc.text(`Delivery Address: ${order.deliveryAddress || 'Not provided'}`, 14, yPosition);
            yPosition += 10;
            
            // Items table header
            doc.setFillColor(240, 240, 240);
            doc.rect(14, yPosition, 182, 6, 'F');
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(8);
            doc.text('Item', 16, yPosition + 4);
            doc.text('Quantity', 80, yPosition + 4);
            doc.text('Unit Price', 120, yPosition + 4);
            doc.text('Total', 160, yPosition + 4);
            
            yPosition += 6;
            
            // Order items
            const farmerItems = (order.items || []).filter(i => i.farmerId === auth.currentUser?.uid);
            farmerItems.forEach(item => {
                doc.setTextColor(40, 40, 40);
                doc.text(item.name || 'Unknown Item', 16, yPosition + 4);
                doc.text(`${item.quantity || 0} ${item.unit || 'unit'}`, 80, yPosition + 4);
                doc.text(`₹${(item.price || 0).toFixed(2)}`, 120, yPosition + 4);
                doc.text(`₹${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`, 160, yPosition + 4);
                yPosition += 6;
            });
            
            // Total
            yPosition += 4;
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Subtotal: ₹${calculateFarmerTotal(order).toFixed(2)}`, 140, yPosition);
            
            // Footer
            yPosition += 20;
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Thank you for your business!', 105, yPosition, { align: 'center' });
            yPosition += 4;
            doc.text('Generated by Farmer Connect', 105, yPosition, { align: 'center' });
            
            // Save the PDF
            doc.save(`order_${order.id.slice(0,8)}_receipt.pdf`);
            showToast('PDF downloaded successfully', 'success');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            showToast('Failed to generate PDF', 'error');
        }
    }

    function printOrderReceipt() {
        if (!selectedOrderId) {
            showToast('No order selected', 'warning');
            return;
        }

        const order = orders.find(o => o.id === selectedOrderId);
        if (!order) {
            showToast('Order not found', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        const farmerItems = (order.items || []).filter(i => i.farmerId === auth.currentUser?.uid);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Order Receipt - #${order.id}</title>
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
                        <p><strong>Order ID:</strong> #${order.id}</p>
                        <p><strong>Date:</strong> ${formatDate(order.createdAt?.toDate())}</p>
                        <p><strong>Status:</strong> ${order.status || 'pending'}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Not specified'}</p>
                    </div>
                    
                    <div class="info-section">
                        <h3>Customer Information</h3>
                        <p><strong>Name:</strong> ${order.customerName || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
                        <p><strong>Delivery Address:</strong> ${order.deliveryAddress || 'Not provided'}</p>
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
                        ${farmerItems.map(item => `
                            <tr>
                                <td>${item.name || 'Unknown Item'}</td>
                                <td>${item.quantity || 0} ${item.unit || 'unit'}</td>
                                <td>₹${(item.price || 0).toFixed(2)}</td>
                                <td>₹${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                            <td><strong>₹${calculateFarmerTotal(order).toFixed(2)}</strong></td>
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
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    function exportOrders() {
        const exportDropdown = document.getElementById('exportDropdown');
        if (!exportDropdown) {
            // Create export dropdown if it doesn't exist
            createExportDropdown();
        }
        exportDropdown.style.display = exportDropdown.style.display === 'block' ? 'none' : 'block';
    }

    function createExportDropdown() {
        const dropdown = document.createElement('div');
        dropdown.id = 'exportDropdown';
        dropdown.className = 'export-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            min-width: 180px;
            margin-top: 5px;
            display: none;
        `;
        
        dropdown.innerHTML = `
            <button class="export-option" onclick="exportAsCSV()" style="width: 100%; padding: 12px 16px; border: none; background: none; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #333;">
                <i class="fas fa-file-csv"></i> Export as CSV
            </button>
            <button class="export-option" onclick="exportAsPDF()" style="width: 100%; padding: 12px 16px; border: none; background: none; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #333;">
                <i class="fas fa-file-pdf"></i> Download PDF
            </button>
            <button class="export-option" onclick="printOrders()" style="width: 100%; padding: 12px 16px; border: none; background: none; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #333;">
                <i class="fas fa-print"></i> Print Report
            </button>
        `;
        
        exportBtn.parentNode.appendChild(dropdown);
        
        // Add click outside listener
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.export-dropdown') && !e.target.matches('#exportBtn')) {
                dropdown.style.display = 'none';
            }
        });
    }

    function exportAsCSV() {
        if (filteredOrders.length === 0) {
            showToast('No orders to export', 'warning');
            return;
        }
        
        const headers = [
            'Order ID', 'Customer Name', 'Customer Phone', 'Items', 
            'Quantities', 'Total', 'Date', 'Status', 'Delivery Address'
        ];
        
        const data = filteredOrders.map(order => {
            const farmerItems = (order.items || []).filter(i => i.farmerId === auth.currentUser?.uid);
            return [
                order.id,
                order.customerName || 'N/A',
                order.customerPhone || 'N/A',
                farmerItems.map(i => i.name || 'Unknown').join(', '),
                farmerItems.map(i => `${i.quantity || 0} ${i.unit || 'unit'}`).join(', '),
                `₹${calculateFarmerTotal(order).toFixed(2)}`,
                formatDate(order.createdAt?.toDate()),
                order.status || 'pending',
                order.deliveryAddress || 'N/A'
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...data.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');
        
        downloadFile(csvContent, `orders_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
        document.getElementById('exportDropdown').style.display = 'none';
    }

    async function exportAsPDF() {
        if (filteredOrders.length === 0) {
            showToast('No orders to export', 'warning');
            return;
        }

        try {
            showToast('Generating PDF report...', 'info');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.setTextColor(40, 40, 40);
            doc.text('Orders Report - Farmer Connect', 105, 15, { align: 'center' });
            
            // Add date
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
            
            // Add summary
            doc.setFontSize(12);
            doc.setTextColor(40, 40, 40);
            doc.text(`Total Orders: ${filteredOrders.length}`, 14, 35);
            const totalEarnings = filteredOrders.reduce((sum, order) => sum + calculateFarmerTotal(order), 0);
            doc.text(`Total Earnings: ₹${totalEarnings.toFixed(2)}`, 14, 42);
            
            let yPosition = 60;
            const pageHeight = doc.internal.pageSize.height;
            
            filteredOrders.forEach((order, index) => {
                // Add new page if needed
                if (yPosition > pageHeight - 50) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                // Order header
                doc.setFontSize(14);
                doc.setTextColor(30, 30, 30);
                doc.text(`Order #${order.id.slice(0, 8)}`, 14, yPosition);
                
                yPosition += 8;
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`Date: ${formatDate(order.createdAt?.toDate())}`, 14, yPosition);
                doc.text(`Status: ${order.status || 'pending'}`, 80, yPosition);
                doc.text(`Customer: ${order.customerName || 'N/A'}`, 130, yPosition);
                
                yPosition += 6;
                doc.text(`Phone: ${order.customerPhone || 'N/A'}`, 14, yPosition);
                doc.text(`Amount: ₹${calculateFarmerTotal(order).toFixed(2)}`, 130, yPosition);
                
                yPosition += 10;
                
                // Items
                const farmerItems = (order.items || []).filter(i => i.farmerId === auth.currentUser?.uid);
                farmerItems.forEach(item => {
                    if (yPosition > pageHeight - 20) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    doc.setTextColor(60, 60, 60);
                    doc.text(`• ${item.name || 'Unknown Item'} - ${item.quantity || 0} ${item.unit || 'unit'} - ₹${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`, 20, yPosition);
                    yPosition += 5;
                });
                
                yPosition += 10;
                
                // Separator line
                if (index < filteredOrders.length - 1) {
                    doc.setDrawColor(200, 200, 200);
                    doc.line(14, yPosition, 194, yPosition);
                    yPosition += 15;
                }
            });
            
            // Save the PDF
            doc.save(`orders_report_${new Date().toISOString().slice(0,10)}.pdf`);
            showToast('PDF report downloaded successfully', 'success');
            
        } catch (error) {
            console.error('Error generating PDF report:', error);
            showToast('Failed to generate PDF report', 'error');
        }
        
        document.getElementById('exportDropdown').style.display = 'none';
    }

    function printOrders() {
        if (filteredOrders.length === 0) {
            showToast('No orders to print', 'warning');
            return;
        }

        try {
            showToast('Preparing print...', 'info');
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
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
                        ${filteredOrders.length} orders | 
                        Total Earnings: ₹${filteredOrders.reduce((sum, order) => sum + calculateFarmerTotal(order), 0).toFixed(2)}
                    </div>
                    
                    ${filteredOrders.map(order => {
                        const farmerItems = (order.items || []).filter(i => i.farmerId === auth.currentUser?.uid);
                        return `
                            <div class="order">
                                <div class="order-header">
                                    <strong>Order #${order.id.slice(0, 8)}</strong> | 
                                    Date: ${formatDate(order.createdAt?.toDate())} | 
                                    Status: ${order.status || 'pending'} |
                                    Customer: ${order.customerName || 'N/A'}
                                </div>
                                
                                <div><strong>Customer Phone:</strong> ${order.customerPhone || 'N/A'}</div>
                                <div><strong>Delivery Address:</strong> ${order.deliveryAddress || 'N/A'}</div>
                                <div><strong>Total Amount:</strong> ₹${calculateFarmerTotal(order).toFixed(2)}</div>
                                
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
                                        ${farmerItems.map(item => `
                                            <tr>
                                                <td>${item.name || 'Unknown Item'}</td>
                                                <td>${item.quantity || 0} ${item.unit || 'unit'}</td>
                                                <td>₹${(item.price || 0).toFixed(2)}</td>
                                                <td>₹${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }).join('')}
                    
                    <div class="no-print" style="margin-top: 20px; text-align: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
                        <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
                    </div>
                    
                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
        } catch (error) {
            console.error('Error printing orders:', error);
            showToast('Failed to open print window', 'error');
        }
        
        document.getElementById('exportDropdown').style.display = 'none';
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function setupEventListeners() {
        statusFilter.addEventListener('change', filterOrders);
        orderSearch.addEventListener('input', debounce(filterOrders, 300));
        dateFilter.addEventListener('change', filterOrders);
        resetFilters.addEventListener('click', () => {
            statusFilter.value = 'all';
            orderSearch.value = '';
            dateFilter.value = 'all';
            filterOrders();
        });

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

        closeModalBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === orderModal) closeModal();
        });
        
        cancelOrderBtn.addEventListener('click', () => updateOrderStatus('cancelled'));
        acceptOrderBtn.addEventListener('click', () => updateOrderStatus('accepted'));
        completeOrderBtn.addEventListener('click', () => updateOrderStatus('completed'));
        
        // PDF and Print buttons
        printReceiptBtn.addEventListener('click', printOrderReceipt);
        downloadReceiptBtn.addEventListener('click', downloadOrderPDF);
        
        backBtn.addEventListener('click', () => {
            window.location.href = 'farmer4.html';
        });

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
                showToast('Bulk update functionality to be implemented', 'info');
                document.getElementById('bulkStatusDropdown').style.display = 'none';
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

    // Make functions available globally for the export dropdown
    window.exportAsCSV = exportAsCSV;
    window.exportAsPDF = exportAsPDF;
    window.printOrders = printOrders;
});