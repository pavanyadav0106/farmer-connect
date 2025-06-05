import { db, auth } from '../config.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
document.addEventListener('DOMContentLoaded', function () {
    const cropsGrid = document.getElementById('cropsGrid');
    const searchInput = document.getElementById('searchCrops');
    const categoryFilter = document.getElementById('categoryFilter');
    const cartCount = document.querySelector('.cart-count');
const logoutBtn = document.getElementById("logoutBtn");
    const paginationContainer = document.getElementById('pagination');

    let crops = [];
    let filteredCrops = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemsPerPage = 8;
    let currentPage = 1;

    init();

    function init() {
        checkAuthState();
        setupEventListeners();
        updateCartCount();
    }

    function checkAuthState() {
        onAuthStateChanged(auth, user => {
            if (!user) {
                window.location.href = "index.html";
            } else {
                loadCrops();
            }
        });
    }

    function loadCrops() {
        const q = query(collection(db, 'products'), where('status', '==', 'available'));

        onSnapshot(q, snapshot => {
            crops = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            filteredCrops = crops;  // reset filter on load
            currentPage = 1;
            renderPage();
            renderPagination();
        });
    }

    function renderPage() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const cropsToRender = filteredCrops.slice(start, end);

        if (cropsToRender.length === 0) {
            cropsGrid.innerHTML = '<div class="empty-state">No crops available</div>';
            return;
        }

        cropsGrid.innerHTML = cropsToRender.map(crop => `
            <div class="crop-card" data-id="${crop.id}">
                ${crop.imageUrl ? 
                    `<img src="${crop.imageUrl}" alt="${crop.name}" class="crop-image">` : 
                    '<div class="crop-image no-image"><i class="fas fa-seedling"></i></div>'}
                <div class="crop-info">
                    <h3 class="crop-name">${crop.name}</h3>
                    <p class="crop-price">₹${crop.price}/kg</p>
                    <div class="crop-meta">
                        <span>${crop.quantity} kg</span>
                        <span>${crop.category || ''}</span>
                    </div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.crop-card').forEach(card => {
            card.addEventListener('click', () => openAddToCartModal(card.dataset.id));
        });
    }

function renderPagination() {
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(filteredCrops.length / itemsPerPage);
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '« Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage();
            renderPagination();
        }
    });
    paginationContainer.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.classList.add('pagination-btn');
        if (i === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => {
            currentPage = i;
            renderPage();
            renderPagination();
        });
        paginationContainer.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next »';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage();
            renderPagination();
        }
    });
    paginationContainer.appendChild(nextBtn);
}


function filterCrops() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;

    filteredCrops = crops.filter(crop => {
        const matchesSearch = crop.name.toLowerCase().includes(searchTerm) ||
            (crop.description && crop.description.toLowerCase().includes(searchTerm));
        const matchesCategory = category === 'all' || crop.category === category;
        return matchesSearch && matchesCategory;
    });

    console.log('Search term:', searchTerm);
    console.log('Filtered crops:', filteredCrops.map(c => c.name));

    currentPage = 1;
    renderPage();
    renderPagination();
}


    function updateCartCount() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'flex' : 'none';
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', filterCrops);
        categoryFilter.addEventListener('change', filterCrops);

        document.querySelector('#addToCartModal .close-btn').addEventListener('click', () => {
            document.getElementById('addToCartModal').style.display = 'none';
            document.body.style.overflow = '';
        });

        // Close modal when clicking outside modal content
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('addToCartModal')) {
                document.getElementById('addToCartModal').style.display = 'none';
                document.body.style.overflow = '';
            }
        });

    }

    function openAddToCartModal(cropId) {
        const crop = crops.find(c => c.id === cropId);
        if (!crop) return;

        document.getElementById('modalCropName').textContent = crop.name;
        document.getElementById('modalCropPrice').textContent = `₹${crop.price}/kg`;
        document.getElementById('modalCropStock').textContent = `${crop.quantity} kg available`;

        if (crop.imageUrl) {
            document.getElementById('modalCropImage').src = crop.imageUrl;
        } else {
            document.getElementById('modalCropImage').src = 'images/default-crop.jpg';
        }

        const quantityInput = document.getElementById('quantityInput');
        quantityInput.value = 1;
        quantityInput.max = crop.quantity;
        updateModalTotalPrice(crop.price, 1);

        document.getElementById('decrementQty').onclick = () => {
            if (quantityInput.value > 1) quantityInput.value--;
            updateModalTotalPrice(crop.price, quantityInput.value);
        };

        document.getElementById('incrementQty').onclick = () => {
            if (quantityInput.value < crop.quantity) quantityInput.value++;
            updateModalTotalPrice(crop.price, quantityInput.value);
        };

        quantityInput.oninput = () => {
            if (quantityInput.value < 1) quantityInput.value = 1;
            if (quantityInput.value > crop.quantity) quantityInput.value = crop.quantity;
            updateModalTotalPrice(crop.price, quantityInput.value);
        };

        document.getElementById('addToCartBtn').onclick = () => {
            addToCart(crop, parseInt(quantityInput.value));
            document.getElementById('addToCartModal').style.display = 'none';
            document.body.style.overflow = '';
        };

        document.getElementById('addToCartModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function updateModalTotalPrice(price, quantity) {
        document.getElementById('modalTotalPrice').textContent = `₹${(price * quantity).toFixed(2)}`;
    }

    function addToCart(crop, quantity) {
        const existingItem = cart.find(item => item.id === crop.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: crop.id,
                name: crop.name,
                price: crop.price,
                quantity: quantity,
                image: crop.imageUrl || 'images/default-crop.jpg',
                farmerId: crop.farmerId,
                farmerName: crop.farmerName
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showToast(`${quantity} kg ${crop.name} added to cart`, 'success');
    }

    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
const profileIcon = document.getElementById('profileIcon');
const profileDropdown = document.getElementById('profileDropdown');

profileIcon.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.style.display = 
    profileDropdown.style.display === 'block' ? 'none' : 'block';
});

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!profileDropdown.contains(e.target) && e.target !== profileIcon) {
    profileDropdown.style.display = 'none';
  }
});
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutConfirmModal');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

logoutBtn.addEventListener('click', e => {
  e.preventDefault();
  logoutModal.classList.remove('hidden');
});

cancelLogoutBtn.addEventListener('click', () => {
  logoutModal.classList.add('hidden');
});

confirmLogoutBtn.addEventListener('click', () => {
  // Your logout logic here, e.g.
  window.location.href = "index.html";
});




