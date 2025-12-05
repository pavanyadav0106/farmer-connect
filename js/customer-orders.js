import { db, auth } from "../config.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  getDocs,
  getDoc
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
  const addReviewBtn = document.getElementById("addReviewBtn");
  const modalOrderIdEl = document.getElementById("modalOrderId");
  const modalOrderStatusEl = document.getElementById("modalOrderStatus");

  // Review Modals
  const reviewModal = document.getElementById("reviewModal");
  const existingReviewsModal = document.getElementById("existingReviewsModal");
  const reviewForm = document.getElementById("reviewForm");
  const starRatings = document.querySelectorAll(".star-rating");
  const reviewRatingInput = document.getElementById("reviewRating");
  const reviewComment = document.getElementById("reviewComment");
  const charCount = document.getElementById("charCount");
  const closeReviewModalBtns = document.querySelectorAll(".close-review-modal");
  const closeReviewsModalBtns = document.querySelectorAll(".close-reviews-modal");
  const reviewsContainer = document.getElementById("reviewsContainer");

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
  let selectedCropForReview = null;
  let selectedCropData = null;
  let currentOrderForReview = null;

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
    currentOrderForReview = order; // Store the order for review context

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
          ${
            order.customerAddress ||
            order.deliveryAddress ||
            order.address ||
            "Not specified"
          }
        </div>
      </div>
      <div class="order-info">
        <div class="order-info-label">Contact</div>
        <div class="order-info-value">
          ${
            order.customerPhone ||
            order.contactNumber ||
            order.phone ||
            "Not specified"
          }
        </div>
      </div>
      <div class="order-info">
        <div class="order-info-label">Delivery Date</div>
        <div class="order-info-value">
          ${order.deliveryDate || "Not specified"}
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

    if (addReviewBtn) {
      const isCompleted = normalizedStatus === "completed";
      if (isCompleted && items.length > 0) {
        addReviewBtn.style.display = "inline-flex";

        // Check if already reviewed
        checkIfAlreadyReviewed(orderId).then(alreadyReviewed => {
          const crop = items[0];  // First item in the order

          if (alreadyReviewed) {
            addReviewBtn.innerHTML = '<i class="fas fa-star"></i> View Review';
            addReviewBtn.onclick = () => {
              let cropId = crop.cropId || crop.id;
              if (!cropId) {
                // Fallback lookup for old orders
                findCropIdByNameAndFarmer(crop.name, order.farmerId || (order.farmer && order.farmer.id))
                  .then(foundId => {
                    if (!foundId) {
                      showToast("Crop not found in database", "error");
                      return;
                    }
                    // Store crop data before showing reviews
                    selectedCropData = {
                      cropName: crop.name,
                      cropId: foundId,           // ← correct cropId from database
                      farmerId: crop.farmerId,   // ← always from item, never from order
                      orderId: order.id,
                      farmerName: crop.farmerName || "Farmer"
                    };
                    showExistingReviews(foundId);


                  });
                return;
              }
              // Store crop data before showing reviews
              selectedCropData = {
                cropName: crop.name,
                cropId: cropId,
                farmerId: order.farmerId,
                orderId: order.id,
                farmerName: order.farmerName || "Farmer"
              };
              console.log("Crop data stored for view:", selectedCropData);
              showExistingReviews(cropId);
            };
          } else {
            addReviewBtn.innerHTML = '<i class="fas fa-star"></i> Add Review';
            addReviewBtn.onclick = () => showReviewModal(orderId);
          }
        });

      } else {
        addReviewBtn.style.display = "none";
      }
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

  async function findCropIdByNameAndFarmer(cropName, farmerId) {
    console.log("Looking for crop:", cropName, "farmer:", farmerId);
    if (!cropName || !farmerId) {
      console.error("Missing cropName or farmerId");
      return null;
    }
    
    try {
      const q = query(
        collection(db, "crops"),
        where("name", "==", cropName),
        where("farmerId", "==", farmerId)
      );
      const snap = await getDocs(q);
      console.log("Found crops:", snap.size);
      
      if (snap.empty) {
        // Try without farmerId filter as fallback
        const q2 = query(
          collection(db, "crops"),
          where("name", "==", cropName)
        );
        const snap2 = await getDocs(q2);
        console.log("Found crops without farmer filter:", snap2.size);
        
        if (snap2.empty) {
          return null;
        }
        return snap2.docs[0].id;
      }
      return snap.docs[0].id;
    } catch (error) {
      console.error("Error finding crop:", error);
      return null;
    }
  }

  /* ------------------------------------------------------------------
   * REVIEW FUNCTIONALITY
   * ------------------------------------------------------------------ */
  
  // Show Review Modal
  function showReviewModal(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.items || order.items.length === 0) {
      showToast("No items found in this order", "error");
      return;
    }
    
    // Store crop data
    const crop = order.items[0];
    selectedCropForReview = crop.cropId || crop.id;
    selectedCropData = {
      orderId: order.id,
      cropName: crop.name,
      cropId: crop.cropId || crop.id,
      farmerId: order.farmerId,
      farmerName: order.farmerName || "Farmer"
    };
    
    console.log("Crop data stored for review:", selectedCropData);
    
    // Reset form
    reviewRatingInput.value = "5";
    if (reviewComment) reviewComment.value = "";
    if (charCount) charCount.textContent = "0";
    
    // Reset star colors
    starRatings.forEach(star => {
      const value = parseInt(star.dataset.value);
      star.style.color = value <= 5 ? "#ffc107" : "#ddd";
    });
    
    // Check if user already reviewed this crop
    checkIfAlreadyReviewed(orderId);
    
    reviewModal.style.display = "flex";
  }

  // Check if Already Reviewed
  async function checkIfAlreadyReviewed(orderId) {
    const user = auth.currentUser;
    if (!user) return false;
    
    try {
      const q = query(
        collection(db, "reviews"),
        where("orderId", "==", orderId),
        where("customerId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        showToast("You've already reviewed this purchase", "info");
        reviewModal.style.display = "none";
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking reviews:", error);
      return false;
    }
  }

  // Submit Review
  async function submitReview(e) {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user || !selectedCropForReview || !selectedCropData) {
      showToast("Please select an item to review", "error");
      return;
    }
    
    const rating = parseInt(reviewRatingInput.value);
    const comment = reviewComment ? reviewComment.value.trim() : "";
    
    if (rating < 1 || rating > 5) {
      showToast("Please select a rating between 1-5 stars", "error");
      return;
    }
    
    try {
      showLoadingOverlay(true);
      
      // Create review data with ALL required fields
      const reviewData = {
        cropId: selectedCropForReview || "unknown_crop",
        cropName: selectedCropData.cropName || "Product",
        orderId: selectedCropData.orderId || "unknown_order",
        customerId: user.uid,
        customerName: user.displayName || "Customer",
        farmerId: selectedCropData.farmerId || "unknown_farmer",
        farmerName: selectedCropData.farmerName || "Unknown Farmer",
        rating: rating,
        comment: comment || "", // Ensure it's never undefined
        createdAt: serverTimestamp(),
        helpfulCount: 0,
        updatedAt: serverTimestamp()
      };
      
      console.log("Submitting review:", reviewData);
      
      // Add to Firestore
      await addDoc(collection(db, "reviews"), reviewData);
      
      // Update crop rating
      await updateCropRating(selectedCropForReview);
      
      showToast("Thank you for your review!", "success");
      reviewModal.style.display = "none";
      showLoadingOverlay(false);
      
    } catch (error) {
      console.error("Error submitting review:", error);
      showToast("Failed to submit review. Please try again.", "error");
      showLoadingOverlay(false);
    }
  }

  // Update Crop Rating
  async function updateCropRating(cropId) {
    try {
      // Get all reviews for this crop
      const q = query(
        collection(db, "reviews"),
        where("cropId", "==", cropId)
      );
      
      const querySnapshot = await getDocs(q);
      let totalRating = 0;
      let reviewCount = 0;
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        totalRating += data.rating || 0;
        reviewCount++;
      });
      
      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      
      // Update crop document with new rating
      const cropRef = doc(db, "crops", cropId);
      await updateDoc(cropRef, {
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviewCount: reviewCount,
        lastReviewed: serverTimestamp()
      });
      
    } catch (error) {
      console.error("Error updating crop rating:", error);
    }
  }

  // Show Existing Reviews - IMPROVED VERSION
  async function showExistingReviews(cropId) {
    try {
      showLoadingOverlay(true);
      
      console.log("Showing reviews for cropId:", cropId);
      console.log("Selected crop data:", selectedCropData);
      console.log("Current order:", currentOrderForReview);

      let cropRef = doc(db, "crops", cropId);
      let cropDoc = await getDoc(cropRef);

      // If crop document doesn't exist, try to find it by name
      if (!cropDoc.exists()) {
        console.log("Crop document not found with ID:", cropId);
        
        // Try to get crop data from available sources
        let cropName = selectedCropData?.cropName;
        let farmerId = selectedCropData?.farmerId || currentOrderForReview?.items?.[0]?.farmerId;
        
        if (!cropName && currentOrderForReview?.items?.[0]) {
          cropName = currentOrderForReview.items[0].name;
        }
        
        if (!farmerId && currentOrderForReview) {
          farmerId = currentOrderForReview.farmerId || 
                     (currentOrderForReview.farmer && currentOrderForReview.farmer.id);
        }
        
        console.log("Looking for crop by name:", cropName, "farmer:", farmerId);
        
        if (!cropName) {
          showToast("Could not find crop information", "error");
          showLoadingOverlay(false);
          return;
        }

        // First try with farmerId if available
        if (farmerId) {
          const q = query(
            collection(db, "crops"),
            where("name", "==", cropName),
            where("farmerId", "==", farmerId)
          );
          const snap = await getDocs(q);

          if (!snap.empty) {
            cropRef = snap.docs[0].ref;
            cropDoc = snap.docs[0];
            cropId = snap.docs[0].id;
            console.log("Found crop with farmer filter:", cropId);
          }
        }
        
        // If still not found, try without farmer filter
        if (!cropDoc.exists()) {
          const q = query(
            collection(db, "crops"),
            where("name", "==", cropName)
          );
          const snap = await getDocs(q);

          if (snap.empty) {
            showToast("Crop not found in database. It may have been removed.", "error");
            showLoadingOverlay(false);
            return;
          }

          // Take the first matching crop
          cropRef = snap.docs[0].ref;
          cropDoc = snap.docs[0];
          cropId = snap.docs[0].id;
          console.log("Found crop without farmer filter:", cropId);
        }
      }

      const cropData = cropDoc.data();
      console.log("Crop data loaded:", cropData);

      // Update modal title
      const titleEl = document.getElementById("reviewsModalTitle");
      if (titleEl) {
        titleEl.textContent = `Reviews for ${cropData.name}`;
      }

      // Fetch all reviews for this crop
      const q = query(collection(db, "reviews"), where("cropId", "==", cropId));
      const querySnapshot = await getDocs(q);

      let totalRating = 0;
      const reviews = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({ id: doc.id, ...data });
        totalRating += data.rating || 0;
      });

      const avg = reviews.length > 0 ? totalRating / reviews.length : 0;
      console.log("Found reviews:", reviews.length, "Average:", avg);

      renderReviews(reviews, avg);
      existingReviewsModal.style.display = "flex";
      showLoadingOverlay(false);

    } catch (err) {
      console.error("Error loading reviews:", err);
      showToast("Failed to load reviews. Please try again.", "error");
      showLoadingOverlay(false);
    }
  }

  // Render Reviews
  function renderReviews(reviews, averageRating) {
    if (!reviewsContainer) return;
    
    if (reviews.length === 0) {
      reviewsContainer.innerHTML = `
        <div class="empty-state" style="margin: 20px 0; text-align: center;">
          <i class="fas fa-comment-alt" style="font-size: 3rem; color: #ddd; margin-bottom: 10px;"></i>
          <h3>No reviews yet</h3>
          <p>Be the first to review this crop!</p>
        </div>
      `;
      return;
    }
    
    // Sort by date (newest first)
    reviews.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    
    let html = `
      <div class="average-rating">
        <div class="average-rating-value">${averageRating.toFixed(1)}</div>
        <div class="average-rating-stars">
          ${getStarRatingHTML(averageRating)}
        </div>
        <div class="average-rating-count">
          Based on ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}
        </div>
      </div>
    `;
    
    reviews.forEach(review => {
      const date = review.createdAt?.toDate?.() || new Date();
      const formattedDate = date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      const initials = review.customerName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      
      html += `
        <div class="review-item">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar">${initials}</div>
              <div>
                <div class="reviewer-name">${review.customerName}</div>
                <div class="review-date">${formattedDate}</div>
              </div>
            </div>
            <div class="review-rating">
              <div class="review-stars">
                ${getStarRatingHTML(review.rating)}
              </div>
              <span>${review.rating}.0</span>
            </div>
          </div>
          ${review.comment ? `<p class="review-comment">${review.comment}</p>` : ''}
        </div>
      `;
    });
    
    reviewsContainer.innerHTML = html;
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
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Add styles if not already added
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
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
      `;
      document.head.appendChild(style);
    }

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

  // Get Star Rating HTML
  function getStarRatingHTML(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    let stars = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
  }

  // Get Star Color
  function getStarColor(value) {
    switch(value) {
      case 1: return "#ff6b6b";
      case 2: return "#ffa94d";
      case 3: return "#ffd43b";
      case 4: return "#a5d6a7";
      case 5: return "#4caf50";
      default: return "#ffc107";
    }
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
      if (e.target === reviewModal) {
        reviewModal.style.display = "none";
      }
      if (e.target === existingReviewsModal) {
        existingReviewsModal.style.display = "none";
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

    // Review functionality
    if (addReviewBtn) {
      // Handler will be set dynamically in showOrderDetails
    }

    // Star Rating Selection
    if (starRatings) {
      starRatings.forEach(star => {
        star.addEventListener("click", () => {
          const value = parseInt(star.dataset.value);
          if (reviewRatingInput) {
            reviewRatingInput.value = value;
          }
          
          // Update star colors
          starRatings.forEach(s => {
            const sValue = parseInt(s.dataset.value);
            if (sValue <= value) {
              s.style.color = getStarColor(sValue);
            } else {
              s.style.color = "#ddd";
            }
          });
        });
        
        star.addEventListener("mouseover", () => {
          const value = parseInt(star.dataset.value);
          starRatings.forEach(s => {
            const sValue = parseInt(s.dataset.value);
            if (sValue <= value) {
              s.style.color = getStarColor(sValue);
            }
          });
        });
        
        star.addEventListener("mouseout", () => {
          const currentValue = reviewRatingInput ? parseInt(reviewRatingInput.value) : 5;
          starRatings.forEach(s => {
            const sValue = parseInt(s.dataset.value);
            if (sValue <= currentValue) {
              s.style.color = getStarColor(sValue);
            } else {
              s.style.color = "#ddd";
            }
          });
        });
      });
    }

    // Character counter for review comment
    if (reviewComment && charCount) {
      reviewComment.addEventListener("input", () => {
        charCount.textContent = reviewComment.value.length;
      });
    }

    // Review form submission
    if (reviewForm) {
      reviewForm.addEventListener("submit", submitReview);
    }

    // Close review modals
    if (closeReviewModalBtns) {
      closeReviewModalBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          reviewModal.style.display = "none";
        });
      });
    }

    if (closeReviewsModalBtns) {
      closeReviewsModalBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          existingReviewsModal.style.display = "none";
        });
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