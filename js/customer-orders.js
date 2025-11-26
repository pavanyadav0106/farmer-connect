import { db, auth } from "../config.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------------------------------------------
   * DOM ELEMENTS
   * ------------------------------------------------------------------ */
  // Header
  const backBtn = document.getElementById("backBtn");
  const customerNameEl = document.getElementById("customerName");
  const lastUpdatedEl = document.getElementById("lastUpdated");
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  // Summary cards
  const totalOrdersCountEl = document.getElementById("totalOrdersCount");
  const activeOrdersCountEl = document.getElementById("activeOrdersCount");
  const completedOrdersCountEl = document.getElementById("completedOrdersCount");
  const cancelledOrdersCountEl = document.getElementById("cancelledOrdersCount");

  // Toolbar
  const statusFilter = document.getElementById("statusFilter");
  const dateFilter = document.getElementById("dateFilter");
  const resetFilters = document.getElementById("resetFilters");
  const orderSearch = document.getElementById("orderSearch");
  const sortFilter = document.getElementById("sortFilter");
  const viewListBtn = document.getElementById("viewListBtn");
  const viewGridBtn = document.getElementById("viewGridBtn");

  // Table / grid / pagination
  const ordersTableBody = document.getElementById("ordersTableBody");
  const ordersList = document.querySelector(".orders-list");
  const ordersGridContainer = document.getElementById("ordersGridContainer");

  const pageSizeSelect = document.getElementById("pageSizeSelect");
  const firstPageBtn = document.getElementById("firstPageBtn");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const lastPageBtn = document.getElementById("lastPageBtn");
  const pageNumbers = document.getElementById("pageNumbers");
  const paginationInfo = document.getElementById("paginationInfo");

  // Empty state
  const emptyState = document.getElementById("emptyState");
  const refreshOrders = document.getElementById("refreshOrders");

  // Modal
  const orderModal = document.getElementById("orderModal");
  const modalBody = document.getElementById("modalBody");
  const closeBtn = document.querySelector(".close-btn");
  const cancelOrderBtn = document.getElementById("cancelOrderBtn");
  const trackOrderBtn = document.getElementById("trackOrderBtn");
  const downloadInvoiceBtn = document.getElementById("downloadInvoiceBtn");
  const modalOrderIdEl = document.getElementById("modalOrderId");
  const modalOrderStatusEl = document.getElementById("modalOrderStatus");

  // Loading Overlay
  const ordersLoadingOverlay = document.getElementById("ordersLoadingOverlay");

  /* ------------------------------------------------------------------
   * STATE
   * ------------------------------------------------------------------ */
  let orders = []; // all orders from Firestore
  let filteredOrders = []; // after filters + search + sort
  let unsubscribe = null;
  let currentPage = 1;
  let pageSize = 10;
  let selectedOrderId = null;

  /* ------------------------------------------------------------------
   * INIT
   * ------------------------------------------------------------------ */
  init();

  function init() {
    setupAuthListener();
    setupEventListeners();
  }

  function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        if (customerNameEl) {
          customerNameEl.textContent = user.displayName || "Customer";
        }
        fetchOrders(user.uid);
      } else {
        if (unsubscribe) unsubscribe();
        window.location.href = "login.html";
      }
    });
  }

  /* ------------------------------------------------------------------
   * FIRESTORE: FETCH ORDERS (REAL-TIME)
   * ------------------------------------------------------------------ */
  function fetchOrders(userId) {
    try {
      showLoadingOverlay(true);

      const q = query(
        collection(db, "orders"),
        where("customerId", "==", userId)
      );

      if (unsubscribe) unsubscribe();

      unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          orders = querySnapshot.docs.map((snap) => {
            const data = snap.data();
            const createdAt =
              data.createdAt && typeof data.createdAt.toDate === "function"
                ? data.createdAt.toDate()
                : new Date();
            const items = Array.isArray(data.items) ? data.items : [];
            const totalAmount = items.reduce(
              (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
              0
            );

            return {
              id: snap.id,
              ...data,
              date: createdAt,
              totalAmount,
            };
          });

          updateSummaryCards();
          updateLastUpdated();
          currentPage = 1;
          applyFiltersAndRender();
          showLoadingOverlay(false);
        },
        (error) => {
          console.error("Error loading orders:", error);
          showToast("Failed to load orders", "error");
          showEmptyState();
          showLoadingOverlay(false);
        }
      );
    } catch (error) {
      console.error("Error loading orders:", error);
      showToast("Failed to load orders", "error");
      showEmptyState();
      showLoadingOverlay(false);
    }
  }

  /* ------------------------------------------------------------------
   * FILTER + SEARCH + SORT + PAGINATION
   * ------------------------------------------------------------------ */
  function applyFiltersAndRender() {
    const status = statusFilter?.value || "all";
    const dateRange = dateFilter?.value || "all";
    const searchTerm = (orderSearch?.value || "").trim().toLowerCase();
    const now = new Date();

    // Filter
    filteredOrders = orders.filter((order) => {
      // Status filter
      const normalizedStatus = normalizeStatus(order.status);
      const statusMatch =
        status === "all" || normalizedStatus === status.toLowerCase();

      // Date filter
      let dateMatch = true;
      if (dateRange !== "all") {
        const orderDate = order.date || new Date();
        const diffTime = now - orderDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (dateRange) {
          case "today":
            dateMatch = diffDays < 1;
            break;
          case "week":
            dateMatch = diffDays < 7;
            break;
          case "month":
            dateMatch = diffDays < 30;
            break;
          default:
            dateMatch = true;
        }
      }

      // Search filter (by order ID, farmer, item names)
      let searchMatch = true;
      if (searchTerm) {
        const farmerName =
          order.farmerName ||
          (order.farmer && order.farmer.name) ||
          "farmer";
        const itemNames = (order.items || [])
          .map((item) => item.name || "")
          .join(" ");
        const haystack = `${order.id} ${farmerName} ${itemNames}`.toLowerCase();
        searchMatch = haystack.includes(searchTerm);
      }

      return statusMatch && dateMatch && searchMatch;
    });

    // Sort
    const sortBy = sortFilter?.value || "latest";
    filteredOrders.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.date - b.date;
        case "amountHigh":
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case "amountLow":
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case "latest":
        default:
          return b.date - a.date;
      }
    });

    // Pagination
    if (!filteredOrders.length) {
      currentPage = 1;
      renderPaginatedOrders([]);
      showEmptyState();
      updatePaginationInfo(0, 0, 0);
      return;
    }

    emptyState.style.display = "none";

    const totalItems = filteredOrders.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    renderPaginatedOrders(paginatedOrders);
    updatePaginationControls(totalPages);
    updatePaginationInfo(startIndex + 1, endIndex, totalItems);
  }

  function renderPaginatedOrders(list) {
    renderTableRows(list);
    renderGridCards(list);
  }

  function renderTableRows(list) {
    if (!ordersTableBody) return;
    ordersTableBody.innerHTML = "";

    list.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const total = order.totalAmount || 0;
      const itemsText = items
        .map((item) => `${item.name} (${item.quantity})`)
        .join(", ");
      const farmerName =
        order.farmerName || (order.farmer && order.farmer.name) || "Farmer";

      const statusLabel = getStatusLabel(order.status);
      const statusClass = getStatusClass(order.status);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${order.id}</td>
        <td>${formatDate(order.date)}</td>
        <td>${itemsText || "-"}</td>
        <td>₹${total.toFixed(2)}</td>
        <td>
          <span class="status-badge ${statusClass}">
            ${statusLabel}
          </span>
        </td>
        <td>${farmerName}</td>
        <td>
          <button
            class="actions-btn view-details-btn"
            data-order-id="${order.id}"
          >
            View
          </button>
        </td>
      `;

      const viewBtn = row.querySelector(".view-details-btn");
      viewBtn.addEventListener("click", () => showOrderDetails(order.id));

      ordersTableBody.appendChild(row);
    });
  }

  function renderGridCards(list) {
    if (!ordersGridContainer) return;
    ordersGridContainer.innerHTML = "";

    if (!list.length) return;

    list.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const total = order.totalAmount || 0;
      const firstItem = items[0]?.name || "Order items";
      const farmerName =
        order.farmerName || (order.farmer && order.farmer.name) || "Farmer";

      const statusLabel = getStatusLabel(order.status);
      const statusClass = getStatusClass(order.status);

      const card = document.createElement("article");
      card.className = "order-card";
      card.innerHTML = `
        <div class="order-card-header">
          <div>
            <h3>#${order.id.slice(0, 8)}</h3>
            <p class="order-card-date">${formatDate(order.date)}</p>
          </div>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="order-card-body">
          <p class="order-card-title">${firstItem}</p>
          <p class="order-card-meta">
            <span>${items.length} item(s)</span> •
            <span>₹${total.toFixed(2)}</span>
          </p>
          <p class="order-card-farmer">Farmer: ${farmerName}</p>
        </div>
        <div class="order-card-footer">
          <button
            class="actions-btn view-details-btn"
            data-order-id="${order.id}"
          >
            View details
          </button>
        </div>
      `;

      card
        .querySelector(".view-details-btn")
        .addEventListener("click", () => showOrderDetails(order.id));

      ordersGridContainer.appendChild(card);
    });
  }

  /* ------------------------------------------------------------------
   * ORDER DETAILS MODAL
   * ------------------------------------------------------------------ */
  function showOrderDetails(orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    selectedOrderId = orderId;

    const items = Array.isArray(order.items) ? order.items : [];
    const total = order.totalAmount || 0;

    // Set modal header info
    if (modalOrderIdEl) {
      modalOrderIdEl.textContent = `Order #${order.id}`;
    }
    if (modalOrderStatusEl) {
      const label = getStatusLabel(order.status);
      const cls = getStatusClass(order.status);
      modalOrderStatusEl.textContent = label;
      modalOrderStatusEl.className = `status-badge ${cls}`;
    }

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
            <div class="order-info-value">
              <span class="status-badge ${getStatusClass(order.status)}">
                ${getStatusLabel(order.status)}
              </span>
            </div>
          </div>
          <div class="order-info">
            <div class="order-info-label">Total</div>
            <div class="order-info-value">₹${total.toFixed(2)}</div>
          </div>
          <div class="order-info">
            <div class="order-info-label">Payment</div>
            <div class="order-info-value">
              ${order.paymentMethod || "Not specified"}
            </div>
          </div>
        </div>

        <div class="order-section">
          <h3>Delivery Information</h3>
          <div class="order-info">
            <div class="order-info-label">Address</div>
            <div class="order-info-value">
              ${order.deliveryAddress || "Not specified"}
            </div>
          </div>
          <div class="order-info">
            <div class="order-info-label">Contact</div>
            <div class="order-info-value">
              ${order.contactNumber || "Not specified"}
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
              ${items
                .map(
                  (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${(item.price || 0).toFixed(2)}</td>
                    <td>₹${((item.price || 0) * (item.quantity || 0)).toFixed(
                      2
                    )}</td>
                  </tr>
                `
                )
                .join("")}
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

    // Cancel button only for pending/processing
    const normalizedStatus = normalizeStatus(order.status);
    if (normalizedStatus === "processing" || normalizedStatus === "pending") {
      cancelOrderBtn.style.display = "inline-flex";
    } else {
      cancelOrderBtn.style.display = "none";
    }

    // Track button hidden only for cancelled
    if (normalizedStatus === "cancelled") {
      trackOrderBtn.style.display = "none";
    } else {
      trackOrderBtn.style.display = "inline-flex";
    }

    orderModal.style.display = "flex";
  }

  async function updateOrderStatus(orderId, newStatus) {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = newStatus;
      applyFiltersAndRender();
      updateSummaryCards();
    }
  }

  /* ------------------------------------------------------------------
   * HELPERS
   * ------------------------------------------------------------------ */
  function formatDate(date) {
    if (!date) return "N/A";
    try {
      return date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  }

  function updateSummaryCards() {
    const total = orders.length;
    const active = orders.filter((o) => {
      const st = normalizeStatus(o.status);
      return st === "processing" || st === "accepted" || st === "pending";
    }).length;
    const completed = orders.filter(
      (o) => normalizeStatus(o.status) === "completed"
    ).length;
    const cancelled = orders.filter(
      (o) => normalizeStatus(o.status) === "cancelled"
    ).length;

    if (totalOrdersCountEl) totalOrdersCountEl.textContent = total;
    if (activeOrdersCountEl) activeOrdersCountEl.textContent = active;
    if (completedOrdersCountEl) completedOrdersCountEl.textContent = completed;
    if (cancelledOrdersCountEl) cancelledOrdersCountEl.textContent = cancelled;
  }

  function updateLastUpdated() {
    if (!lastUpdatedEl) return;
    lastUpdatedEl.textContent = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function showLoadingOverlay(show) {
    if (!ordersLoadingOverlay) return;
    ordersLoadingOverlay.style.display = show ? "flex" : "none";
  }

  function showEmptyState() {
    if (ordersTableBody) ordersTableBody.innerHTML = "";
    if (ordersGridContainer) ordersGridContainer.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
  }

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  function normalizeStatus(status) {
    if (!status) return "unknown";
    const s = String(status).toLowerCase();
    if (s === "pending") return "processing"; // treat pending = processing
    return s;
  }

  function getStatusLabel(status) {
    const s = normalizeStatus(status);
    switch (s) {
      case "processing":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status || "Unknown";
    }
  }

  function getStatusClass(status) {
    const s = normalizeStatus(status);
    switch (s) {
      case "processing":
      case "pending":
        return "status-processing";
      case "accepted":
        return "status-accepted";
      case "completed":
        return "status-completed";
      case "cancelled":
        return "status-cancelled";
      default:
        return "";
    }
  }

  function updatePaginationControls(totalPages) {
    if (!pageNumbers) return;

    pageNumbers.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === currentPage) {
        btn.classList.add("active");
      }
      btn.addEventListener("click", () => {
        if (currentPage !== i) {
          currentPage = i;
          applyFiltersAndRender();
        }
      });
      pageNumbers.appendChild(btn);
    }

    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;
  }

  function updatePaginationInfo(start, end, total) {
    if (!paginationInfo) return;
    if (total === 0) {
      paginationInfo.textContent = "0–0 of 0 orders";
      return;
    }
    paginationInfo.textContent = `${start}–${end} of ${total} orders`;
  }

  /* ------------------------------------------------------------------
   * EVENT LISTENERS
   * ------------------------------------------------------------------ */
  function setupEventListeners() {
    // Filters
    if (statusFilter) {
      statusFilter.addEventListener("change", () => {
        currentPage = 1;
        applyFiltersAndRender();
      });
    }

    if (dateFilter) {
      dateFilter.addEventListener("change", () => {
        currentPage = 1;
        applyFiltersAndRender();
      });
    }

    if (resetFilters) {
      resetFilters.addEventListener("click", () => {
        if (statusFilter) statusFilter.value = "all";
        if (dateFilter) dateFilter.value = "all";
        if (orderSearch) orderSearch.value = "";
        if (sortFilter) sortFilter.value = "latest";
        if (pageSizeSelect) pageSizeSelect.value = "10";
        pageSize = 10;
        currentPage = 1;
        applyFiltersAndRender();
      });
    }

    if (refreshOrders) {
      refreshOrders.addEventListener("click", () => {
        const user = auth.currentUser;
        if (user) {
          fetchOrders(user.uid);
        }
      });
    }

    // Search
    if (orderSearch) {
      orderSearch.addEventListener("input", () => {
        currentPage = 1;
        applyFiltersAndRender();
      });
    }

    // Sort
    if (sortFilter) {
      sortFilter.addEventListener("change", () => {
        currentPage = 1;
        applyFiltersAndRender();
      });
    }

    // Page size
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", (e) => {
        pageSize = Number(e.target.value) || 10;
        currentPage = 1;
        applyFiltersAndRender();
      });
    }

    // Pagination buttons
    if (firstPageBtn) {
      firstPageBtn.addEventListener("click", () => {
        currentPage = 1;
        applyFiltersAndRender();
      });
    }
    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          applyFiltersAndRender();
        }
      });
    }
    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        const totalPages = Math.max(
          1,
          Math.ceil(filteredOrders.length / pageSize)
        );
        if (currentPage < totalPages) {
          currentPage++;
          applyFiltersAndRender();
        }
      });
    }
    if (lastPageBtn) {
      lastPageBtn.addEventListener("click", () => {
        const totalPages = Math.max(
          1,
          Math.ceil(filteredOrders.length / pageSize)
        );
        currentPage = totalPages;
        applyFiltersAndRender();
      });
    }

    // View mode toggle
    if (viewListBtn && viewGridBtn && ordersList) {
      viewListBtn.addEventListener("click", () => {
        viewListBtn.classList.add("active");
        viewGridBtn.classList.remove("active");
        ordersList.dataset.viewMode = "list";
        if (ordersGridContainer) {
          ordersGridContainer.setAttribute("aria-hidden", "true");
        }
      });

      viewGridBtn.addEventListener("click", () => {
        viewGridBtn.classList.add("active");
        viewListBtn.classList.remove("active");
        ordersList.dataset.viewMode = "grid";
        if (ordersGridContainer) {
          ordersGridContainer.setAttribute("aria-hidden", "false");
        }
      });
    }

    // Modal close
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        orderModal.style.display = "none";
      });
    }

    window.addEventListener("click", (e) => {
      if (e.target === orderModal) {
        orderModal.style.display = "none";
      }
    });

    // Cancel order
    if (cancelOrderBtn) {
      cancelOrderBtn.addEventListener("click", async () => {
        if (!selectedOrderId) return;
        try {
          await updateOrderStatus(selectedOrderId, "cancelled");
          showToast("Order cancelled successfully", "success");
          orderModal.style.display = "none";
        } catch (error) {
          console.error(error);
          showToast("Failed to cancel order", "error");
        }
      });
    }

    // Track order
    if (trackOrderBtn) {
      trackOrderBtn.addEventListener("click", () => {
        if (!selectedOrderId) return;
        window.location.href = `#?orderId=${selectedOrderId}`;
      });
    }

    // Download invoice (placeholder)
    if (downloadInvoiceBtn) {
      downloadInvoiceBtn.addEventListener("click", () => {
        showToast("Invoice download will be available soon.", "info");
      });
    }

    // Back button
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.history.back();
      });
    }

    // Theme toggle (simple body class toggle for future use)
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-theme");
      });
    }
  }
});
