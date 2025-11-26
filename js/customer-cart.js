import { db, auth } from '../config.js';
import { 
  collection, 
  query, 
  where,
  getDocs,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const cartItemsContainer = document.getElementById('cartItems');
  const emptyCartDiv = document.querySelector('.empty-cart');
  const subtotalElement = document.getElementById('subtotal');
  const itemCountElement = document.getElementById('itemCount');
  const cartTotalElement = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutModal = document.getElementById('checkoutModal');
  const closeModalBtn = document.querySelector('.close-btn');
  const cancelCheckoutBtn = document.getElementById('cancelCheckout');
  const confirmOrderBtn = document.getElementById('confirmOrderBtn');
  const checkoutForm = document.getElementById('checkoutForm');
  const orderConfirmationModal = document.getElementById('orderConfirmationModal');
  const toast = document.getElementById('toast');
  const paymentMethodSelect = document.getElementById('paymentMethod');
  const upiField = document.querySelector('.upi-field');
  const cardFields = document.querySelector('.card-fields');
  const deliveryDateInput = document.getElementById('deliveryDate');

  // Set min delivery date to tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  deliveryDateInput.min = minDate;

  // Cart data (would normally come from backend/localStorage)
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Initialize the cart
  renderCart();

  // Event Listeners
  checkoutBtn.addEventListener('click', openCheckoutModal);
  closeModalBtn.addEventListener('click', closeCheckoutModal);
  cancelCheckoutBtn.addEventListener('click', closeCheckoutModal);
  confirmOrderBtn.addEventListener('click', placeOrder);
  paymentMethodSelect.addEventListener('change', togglePaymentFields);
  document.addEventListener('click', handleCartItemActions);

  // Functions
  function renderCart() {
    if (cart.length === 0) {
      emptyCartDiv.style.display = 'block';
      checkoutBtn.disabled = true;
      cartItemsContainer.innerHTML = '';
      cartItemsContainer.appendChild(emptyCartDiv);
    } else {
      emptyCartDiv.style.display = 'none';
      checkoutBtn.disabled = false;
      cartItemsContainer.innerHTML = '';
      
      cart.forEach(item => {
        const cartItemElement = createCartItemElement(item);
        cartItemsContainer.appendChild(cartItemElement);
      });
    }
    
    updateCartSummary();
  }

  function createCartItemElement(item) {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.dataset.id = item.id;
    
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="item-image">
      <div class="item-details">
        <h3 class="item-name">${item.name}</h3>
        <p class="item-price">₹${item.price.toFixed(2)}</p>
        <div class="item-quantity">
          <button class="quantity-btn minus" data-action="decrease">-</button>
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="100">
          <button class="quantity-btn plus" data-action="increase">+</button>
        </div>
      </div>
      <button class="remove-item" data-action="remove">
        <i class="fas fa-trash"></i>
      </button>
    `;
    
    return cartItem;
  }

  function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
    itemCountElement.textContent = totalItems;
    cartTotalElement.textContent = `₹${subtotal.toFixed(2)}`;
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function handleCartItemActions(e) {
    if (e.target.closest('[data-action]')) {
      const action = e.target.closest('[data-action]').dataset.action;
      const cartItem = e.target.closest('.cart-item');
      const itemId = cartItem.dataset.id;
      const itemIndex = cart.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) return;
      
      switch(action) {
        case 'increase':
          cart[itemIndex].quantity += 1;
          break;
        case 'decrease':
          if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
          }
          break;
        case 'remove':
          cart.splice(itemIndex, 1);
          break;
      }
      
      renderCart();
      showToast('Cart updated');
    }
    
    // Handle quantity input changes
    if (e.target.classList.contains('quantity-input')) {
      const cartItem = e.target.closest('.cart-item');
      const itemId = cartItem.dataset.id;
      const itemIndex = cart.findIndex(item => item.id === itemId);
      const newQuantity = parseInt(e.target.value);
      
      if (itemIndex !== -1 && !isNaN(newQuantity) && newQuantity >= 1 && newQuantity <= 100) {
        cart[itemIndex].quantity = newQuantity;
        renderCart();
        showToast('Quantity updated');
      } else {
        // Reset to previous value if invalid
        e.target.value = cart[itemIndex].quantity;
      }
    }
  }

  function openCheckoutModal() {
    checkoutModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeCheckoutModal() {
    checkoutModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  function togglePaymentFields() {
    const paymentMethod = paymentMethodSelect.value;
    
    upiField.classList.add('hidden');
    cardFields.classList.add('hidden');
    
    if (paymentMethod === 'upi') {
      upiField.classList.remove('hidden');
    } else if (paymentMethod === 'card') {
      cardFields.classList.remove('hidden');
    }
  }

async function placeOrder() {
  if (!checkoutForm.checkValidity()) {
    checkoutForm.reportValidity();
    return;
  }

  const formData = {
    deliveryAddress: document.getElementById('deliveryAddress').value,
    contactNumber: document.getElementById('contactNumber').value,
    deliveryDate: document.getElementById('deliveryDate').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    upiId: document.getElementById('upiId')?.value || null,
    cardDetails: paymentMethodSelect.value === 'card' ? {
      cardNumber: document.getElementById('cardNumber').value,
      expiry: document.getElementById('expiry').value,
      cvv: document.getElementById('cvv').value
    } : null
  };

const order = {
  customerId: auth.currentUser.uid,
  createdAt: serverTimestamp(),     // required by rules
  items: [...cart],
  farmerIds: cart.map(i => i.farmerId),  // required by rules
  subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
  delivery: 0,
  total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
  status: 'pending',               // must be 'pending'
  ...formData
};


  try {
    await addDoc(collection(db, 'orders'), order);

    // Clear the cart after successful order placement
    cart = [];
    localStorage.removeItem('cart');
    renderCart();

    closeCheckoutModal();
    showOrderConfirmation(order);
  } catch (error) {
    console.error("Error placing order:", error);
    showToast('Failed to place order. Please try again.');
  }
}

  function showOrderConfirmation(order) {
    document.getElementById('orderConfirmationText').textContent = 
      `Your order #${order.id} has been placed successfully. Expected delivery on ${new Date(order.deliveryDate).toLocaleDateString()}.`;
    
    // Set the view order button to link to the specific order
    document.getElementById('viewOrderBtn').href = `customer-orders.html?order_id=${order.id}`;
    
    orderConfirmationModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Close confirmation modal when clicking outside
    orderConfirmationModal.addEventListener('click', function(e) {
      if (e.target === orderConfirmationModal) {
        orderConfirmationModal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Close modals when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === checkoutModal) {
      closeCheckoutModal();
    }
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  const homeBtn = document.getElementById('homeBtn');

  profileBtn.addEventListener('click', () => {
    profileDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.add('hidden');
    }
  });

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    profileDropdown.classList.add('hidden'); // close dropdown
    const confirmed = confirm('Are you sure you want to logout?');
    if (confirmed) {
      // Add your logout logic here (e.g., clearing auth tokens)
      window.location.href = 'main.html'; // redirect to login
    }
  });

  homeBtn.addEventListener('click', (e) => {
    profileDropdown.classList.add('hidden'); // close dropdown
    // Redirect to dashboard/home page
    window.location.href = 'customer-dashboard.html';
  });
});