// Import Firebase functions
import { db, auth } from '../config.js';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const overlay = document.querySelector('.overlay');
  const collapseBtn = document.querySelector('.collapse-btn');
  const notificationIcon = document.querySelector('.notification-icon');
  const notificationDropdown = document.querySelector('.notification-dropdown');
  const notificationList = document.getElementById('notificationList');
  const notificationCount = document.getElementById('notificationCount');
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogout = document.getElementById('confirmLogout');
  const cancelLogout = document.getElementById('cancelLogout');
  const closeModal = document.querySelector('.close');
  const loading = document.getElementById('loading');
  const welcomeName = document.getElementById('welcomeName');
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  
  // Content containers
  const ordersContainer = document.getElementById('ordersContainer');
  const productsGrid = document.getElementById('productsGrid');
  const testimonialsContainer = document.getElementById('testimonialsContainer');
  const offersContainer = document.getElementById('offersContainer');

  // Cart state
  let cartItems = [];

  // Initialize dashboard
  initDashboard();

  function initDashboard() {
    // Check authentication state
    auth.onAuthStateChanged(user => {
      if (user) {
        // User is signed in
        loadUserData(user);
        loadDashboardData(user.uid);
        loadCartItems(user.uid);
        hideLoading();
      } else {
        // User is signed out
        hideLoading();
      }
    });

    // Setup event listeners
    setupEventListeners();
  }

  function loadUserData(user) {
    if (user.displayName) {
      welcomeName.textContent = user.displayName;
      userName.textContent = user.displayName;
    }
    
    if (user.photoURL) {
      userAvatar.src = user.photoURL;
    }
  }

  function loadDashboardData(userId) {
    loadNotifications();
    loadRecentOrders(userId);
    loadRecommendedProducts();
    loadTestimonials();
    loadSeasonalOffers();
  }

  // Load cart items from Firestore
  async function loadCartItems(userId) {
    try {
      const cartRef = doc(db, 'users', userId, 'cart', 'items');
      const cartDoc = await getDoc(cartRef);
      
      if (cartDoc.exists()) {
        cartItems = cartDoc.data().items || [];
        updateCartBadge();
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  // Add item to cart
  async function addToCart(product) {
    if (!auth.currentUser) {
      showToast('Please log in to add items to cart', 'error');
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const cartRef = doc(db, 'users', userId, 'cart', 'items');
      
      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex > -1) {
        // Update quantity if item exists
        cartItems[existingItemIndex].quantity += 1;
      } else {
        // Add new item to cart
        cartItems.push({
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          unit: product.unit,
          quantity: 1,
          addedAt: new Date()
        });
      }

      // Update Firestore
      await setDoc(cartRef, { items: cartItems });
      
      // Update UI
      updateCartBadge();
      showToast(`${product.name} added to cart!`);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Error adding item to cart', 'error');
    }
  }

  // Update cart badge
  function updateCartBadge() {
    const cartBadge = document.querySelector('.badge');
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    
    if (cartBadge) {
      cartBadge.textContent = totalItems;
      cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
  }

  function setupEventListeners() {
    // Menu toggle for mobile
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
      });
    }

    // Overlay click to close sidebar
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        if (notificationDropdown) notificationDropdown.classList.remove('show');
      });
    }

    // Sidebar collapse toggle
    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('collapsed');
      });
    }

    // Notification dropdown toggle
    if (notificationIcon) {
      notificationIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('show');
      });
    }

    // Close notification dropdown if clicked outside
    document.addEventListener('click', (e) => {
      if (notificationIcon && !notificationIcon.contains(e.target) && 
          notificationDropdown && !notificationDropdown.contains(e.target)) {
        notificationDropdown.classList.remove('show');
      }
    });

    // Quick actions click handlers
    document.querySelectorAll('.action-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const url = card.getAttribute('data-url');
        if (url) {
          navigateTo(url);
        }
      });
    });

    // Logout functionality
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (logoutModal) logoutModal.style.display = 'flex';
      });
    }

    if (confirmLogout) {
      confirmLogout.addEventListener('click', () => {
        auth.signOut().then(() => {
          window.location.href = 'index.html';
        }).catch((error) => {
          console.error('Logout error:', error);
          showToast('Error logging out. Please try again.', 'error');
        });
      });
    }

    if (cancelLogout) {
      cancelLogout.addEventListener('click', () => {
        if (logoutModal) logoutModal.style.display = 'none';
      });
    }

    if (closeModal) {
      closeModal.addEventListener('click', () => {
        if (logoutModal) logoutModal.style.display = 'none';
      });
    }

    // Add to cart buttons - Event delegation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-to-cart') || 
          e.target.closest('.add-to-cart')) {
        const button = e.target.classList.contains('add-to-cart') ? 
                       e.target : e.target.closest('.add-to-cart');
        const productCard = button.closest('.product-card');
        
        if (productCard) {
          const productId = productCard.getAttribute('data-product-id');
          const productName = productCard.querySelector('h3')?.textContent || 'Product';
          const productPrice = parseFloat(productCard.querySelector('p')?.textContent?.replace('$', '') || '0');
          const productImage = productCard.querySelector('.product-image')?.style.backgroundImage || '';
          
          const product = {
            id: productId,
            name: productName,
            price: productPrice,
            imageUrl: productImage.replace('url("', '').replace('")', ''),
            unit: 'kg'
          };
          
          // Visual feedback
          const originalText = button.innerHTML;
          button.innerHTML = '<i class="fas fa-check"></i> Added to Cart';
          button.style.backgroundColor = '#4CAF50';
          
          setTimeout(() => {
            button.innerHTML = originalText;
            button.style.backgroundColor = '';
          }, 2000);
          
          addToCart(product);
        }
      }
    });

    // Order details buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('order-details') || 
          e.target.closest('.order-details')) {
        navigateTo('customer-orders.html');
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 992) {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
      }
    });
  }

  // Load notifications
  function loadNotifications() {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef);

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = [];
        querySnapshot.forEach((doc) => {
          notifications.push({ id: doc.id, ...doc.data() });
        });
        
        // Filter for current user's notifications client-side
        const userNotifications = notifications
          .filter(note => note.userId === auth.currentUser?.uid && !note.read)
          .sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateB - dateA;
          });
        
        renderNotifications(userNotifications);
        updateNotificationBadge(userNotifications.length);
      }, (error) => {
        console.error('Error loading notifications:', error);
        showEmptyState(notificationList, 'No notifications available');
      });

    } catch (error) {
      console.error('Error setting up notifications:', error);
      showEmptyState(notificationList, 'No notifications available');
    }
  }

  function renderNotifications(notifications) {
    if (!notificationList) return;
    
    if (!notifications.length) {
      showEmptyState(notificationList, 'No new notifications');
      return;
    }

    notificationList.innerHTML = '';
    notifications.forEach((note) => {
      const item = document.createElement('div');
      item.className = 'notification-item';
      item.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <div>
          <p>${note.message || 'New notification'}</p>
          <small>${formatDate(note.date)}</small>
        </div>
      `;
      notificationList.appendChild(item);
    });
  }

  function updateNotificationBadge(count) {
    if (notificationCount) {
      if (count > 0) {
        notificationCount.textContent = count > 9 ? '9+' : count;
        notificationCount.style.display = 'flex';
      } else {
        notificationCount.style.display = 'none';
      }
    }
  }

  // Load recent orders
  function loadRecentOrders(userId) {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('customerId', '==', userId));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const orders = [];
        querySnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by date and get recent ones
        const recentOrders = orders
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
          })
          .slice(0, 3);
        
        renderRecentOrders(recentOrders);
      }, (error) => {
        console.error('Error loading orders:', error);
        showEmptyState(ordersContainer, 'No recent orders found');
      });

    } catch (error) {
      console.error('Error setting up orders:', error);
      showEmptyState(ordersContainer, 'No recent orders found');
    }
  }

  function renderRecentOrders(orders) {
    if (!ordersContainer) return;
    
    if (!orders.length) {
      showEmptyState(ordersContainer, 'No recent orders found');
      return;
    }

    ordersContainer.innerHTML = '';
    orders.forEach((order) => {
      const orderCard = document.createElement('div');
      orderCard.className = 'order-card';
      orderCard.innerHTML = `
        <div class="order-info">
          <h3>Order #${order.orderNumber || order.id.substring(0, 8)}</h3>
          <p>${getOrderItemsPreview(order.items)}</p>
          <span class="order-date">${formatDate(order.createdAt)}</span>
        </div>
        <div class="order-status ${order.status}">
          <i class="fas ${getStatusIcon(order.status)}"></i>
          ${order.status || 'pending'}
        </div>
        <button class="order-details">View</button>
      `;
      ordersContainer.appendChild(orderCard);
    });
  }

  function getOrderItemsPreview(items) {
    if (!items || !items.length) return 'No items';
    const itemNames = items.slice(0, 2).map(item => item.name || 'Item');
    return itemNames.join(', ') + (items.length > 2 ? '...' : '');
  }

  function getStatusIcon(status) {
    const icons = {
      pending: 'fa-clock',
      processing: 'fa-cog',
      shipped: 'fa-shipping-fast',
      delivered: 'fa-check-circle',
      cancelled: 'fa-times-circle'
    };
    return icons[status] || 'fa-info-circle';
  }

  // Load recommended products
  function loadRecommendedProducts() {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef);

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const products = [];
        querySnapshot.forEach((doc) => {
          products.push({ id: doc.id, ...doc.data() });
        });
        
        // Get available products
        const availableProducts = products
          .filter(product => product.status === 'available')
          .slice(0, 4);
        
        renderRecommendedProducts(availableProducts);
      }, (error) => {
        console.error('Error loading products:', error);
        showEmptyState(productsGrid, 'No products available');
      });

    } catch (error) {
      console.error('Error setting up products:', error);
      showEmptyState(productsGrid, 'No products available');
    }
  }

  function renderRecommendedProducts(products) {
    if (!productsGrid) return;
    
    if (!products.length) {
      showEmptyState(productsGrid, 'No products available');
      return;
    }

    productsGrid.innerHTML = '';
    products.forEach((product) => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.setAttribute('data-product-id', product.id);
      productCard.innerHTML = `
        <div class="product-image" style="background-image: url('${product.imageUrl || 'https://images.unsplash.com/photo-1546470427-e212b7d31075?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}')"></div>
        <div class="product-info">
          <h3>${product.name || 'Product'}</h3>
          <p>$${product.price || '0.00'} / ${product.unit || 'kg'}</p>
          <button class="add-to-cart">
            <i class="fas fa-cart-plus"></i>
            Add to Cart
          </button>
        </div>
      `;
      productsGrid.appendChild(productCard);
    });
  }

  // Load testimonials - FIXED with sample data
  function loadTestimonials() {
    try {
      const testimonialsRef = collection(db, 'testimonials');
      const q = query(testimonialsRef);

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const testimonials = [];
        querySnapshot.forEach((doc) => {
          testimonials.push({ id: doc.id, ...doc.data() });
        });
        
        // Get approved testimonials or use sample data if none exist
        const approvedTestimonials = testimonials
          .filter(testimonial => testimonial.approved !== false);
        
        if (approvedTestimonials.length === 0) {
          // Use sample testimonials if no data in Firestore
          renderTestimonials(getSampleTestimonials());
        } else {
          renderTestimonials(approvedTestimonials.slice(0, 3));
        }
      }, (error) => {
        console.error('Error loading testimonials:', error);
        // Use sample testimonials on error
        renderTestimonials(getSampleTestimonials());
      });

    } catch (error) {
      console.error('Error setting up testimonials:', error);
      // Use sample testimonials on error
      renderTestimonials(getSampleTestimonials());
    }
  }

  // Sample testimonials data
  function getSampleTestimonials() {
    return [
      {
        id: '1',
        message: "The freshest vegetables I've ever had delivered! The tomatoes were so flavorful and the service was excellent.",
        authorName: "Sarah Johnson",
        authorType: "Regular Customer",
authorAvatar: "https://i.pravatar.cc/100?img=32"
      },
      {
        id: '2', 
        message: "Love supporting local farmers through this platform. The quality is consistently amazing and delivery is always on time.",
        authorName: "Mike Chen",
        authorType: "Local Chef",
        authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
      },
      {
        id: '3',
        message: "As a busy parent, Farmer Connect has been a lifesaver. Fresh, organic produce delivered right to my door every week!",
        authorName: "Emily Davis",
        authorType: "Busy Parent",
        authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
      }
    ];
  }

  function renderTestimonials(testimonials) {
    if (!testimonialsContainer) return;
    
    if (!testimonials.length) {
      showEmptyState(testimonialsContainer, 'Be the first to leave a testimonial!');
      return;
    }

    testimonialsContainer.innerHTML = '';
    testimonials.forEach((testimonial) => {
      const testimonialCard = document.createElement('div');
      testimonialCard.className = 'testimonial-card';
      testimonialCard.innerHTML = `
        <div class="testimonial-content">
          <p>"${testimonial.message || 'Great service!'}"</p>
        </div>
        <div class="testimonial-author">
          <img src="${testimonial.authorAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(testimonial.authorName || 'Customer') + '&background=4CAF50&color=fff'}" alt="${testimonial.authorName || 'Customer'}">
          <div class="author-info">
            <h4>${testimonial.authorName || 'Happy Customer'}</h4>
            <span>${testimonial.authorType || 'Customer'}</span>
          </div>
        </div>
      `;
      testimonialsContainer.appendChild(testimonialCard);
    });
  }

  // Load seasonal offers
  function loadSeasonalOffers() {
    try {
      const offersRef = collection(db, 'offers');
      const q = query(offersRef);

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const offers = [];
        querySnapshot.forEach((doc) => {
          offers.push({ id: doc.id, ...doc.data() });
        });
        
        // Get active offers
        const activeOffers = offers
          .filter(offer => offer.active !== false)
          .slice(0, 5);
        
        renderSeasonalOffers(activeOffers);
      }, (error) => {
        console.error('Error loading offers:', error);
        showEmptyState(offersContainer, 'No seasonal offers available');
      });

    } catch (error) {
      console.error('Error setting up offers:', error);
      showEmptyState(offersContainer, 'No seasonal offers available');
    }
  }

  function renderSeasonalOffers(offers) {
    if (!offersContainer) return;
    
    if (!offers.length) {
      showEmptyState(offersContainer, 'Check back later for seasonal offers');
      return;
    }

    offersContainer.innerHTML = '';
    offers.forEach((offer) => {
      const offerItem = document.createElement('div');
      offerItem.className = 'offer-item';
      offerItem.innerHTML = `
        <i class="fas fa-tag"></i>
        <span>${offer.title || 'Special Offer'}</span>
      `;
      offerItem.addEventListener('click', () => {
        navigateTo('customer-marketplace.html');
      });
      offersContainer.appendChild(offerItem);
    });
  }

  // Utility functions
  function formatDate(date) {
    if (!date) return 'Recently';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      const now = new Date();
      const diffTime = Math.abs(now - dateObj);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Recently';
    }
  }

  function showEmptyState(container, message) {
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>${message}</p>
        </div>
      `;
    }
  }

  function hideLoading() {
    if (loading) {
      loading.style.display = 'none';
    }
  }
});

// Global functions
function navigateTo(url) {
  window.location.href = url;
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'error' ? '#F44336' : '#4CAF50'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    font-weight: 500;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
// Testimonial Carousel Functionality
document.addEventListener('DOMContentLoaded', function() {
  const testimonialCarousel = document.querySelector('.testimonial-carousel');
  if (!testimonialCarousel) return;

  const slides = testimonialCarousel.querySelectorAll('.testimonial-slide');
  const dots = testimonialCarousel.querySelectorAll('.carousel-dot');
  const prevBtn = testimonialCarousel.querySelector('.carousel-arrow.prev');
  const nextBtn = testimonialCarousel.querySelector('.carousel-arrow.next');
  
  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    currentSlide = (index + slides.length) % slides.length;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  // Auto-advance slides every 5 seconds
  let slideInterval = setInterval(() => {
    showSlide(currentSlide + 1);
  }, 5000);

  // Pause auto-advance on hover
  testimonialCarousel.addEventListener('mouseenter', () => {
    clearInterval(slideInterval);
  });

  testimonialCarousel.addEventListener('mouseleave', () => {
    slideInterval = setInterval(() => {
      showSlide(currentSlide + 1);
    }, 5000);
  });

  // Dot click handlers
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
    });
  });

  // Arrow click handlers
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      showSlide(currentSlide - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      showSlide(currentSlide + 1);
    });
  }
});
