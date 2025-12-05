import { db, auth } from '../config.js';
import { 
    collection, 
    query, 
    where, 
    onSnapshot,
    getDoc,
    getDocs,
    doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {
    const cropsGrid = document.getElementById('cropsGrid');
    const searchInput = document.getElementById('searchCrops');
    const categoryFilter = document.getElementById('categoryFilter');
    const cartCount = document.querySelector('.cart-count');
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
                window.location.href = "main.html";
            } else {
                loadCrops();
            }
        });
    }

    function loadCrops() {
        const q = query(collection(db, 'products'), where('status', '==', 'available'));

        onSnapshot(q, async snapshot => {
            crops = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            
            // DEBUG: Check first crop's data structure
            if (crops.length > 0) {
            }
            
            // Enrich every crop with farmer details and reviews
            for (let crop of crops) {
                await enrichCropDetails(crop);
            }

            filteredCrops = crops;
            currentPage = 1;
            renderPage();
            renderPagination();
        });
    }

    async function enrichCropDetails(crop) {
        // Fetch farmer details
        if (crop.farmerId) {
            try {
                const farmerSnap = await getDoc(doc(db, "users", crop.farmerId));
                if (farmerSnap.exists()) {
                    const farmer = farmerSnap.data();
                    
                    // Map all possible farmer fields
                    crop.farmerName = farmer.name || farmer.fullName || farmer.displayName || "Unknown Farmer";
                    crop.farmerLocation = farmer.location || farmer.address || farmer.city || farmer.village || farmer.area || "Location not specified";
                    crop.farmerPhoto = farmer.photoURL || farmer.profileImage || farmer.avatar || null;
                    crop.farmerPhone = farmer.phone || farmer.mobile || farmer.contact || null;
                }
            } catch (error) {
                console.error("Error fetching farmer details:", error);
                // Set defaults if fetch fails
                crop.farmerName = "Unknown Farmer";
                crop.farmerLocation = "Location not available";
            }
        }

        // Fetch reviews from TOP-LEVEL reviews collection (not nested)
        // AND also check product-specific reviews
        try {
            // Check top-level reviews collection first
            const topLevelReviewsQuery = query(
                collection(db, "reviews"),
                where("cropId", "==", crop.id)
            );
            
            const topLevelReviewsSnap = await getDocs(topLevelReviewsQuery);
            let allReviews = [];
            
            topLevelReviewsSnap.forEach(doc => {
                const data = doc.data();
                allReviews.push(data);
            });
            
            // Also check nested reviews for backward compatibility
            try {
                const nestedReviewsSnap = await getDocs(collection(db, "products", crop.id, "reviews"));
                nestedReviewsSnap.forEach(doc => {
                    const data = doc.data();
                    allReviews.push(data);
                });
            } catch (nestedError) {
                console.log("No nested reviews found or no access:", nestedError);
            }
            
            // Calculate average rating
            crop.reviewCount = allReviews.length;
            if (allReviews.length > 0) {
                const totalRating = allReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
                crop.avgRating = parseFloat((totalRating / allReviews.length).toFixed(1));
                crop.rating = crop.avgRating; // For star display
            } else {
                crop.avgRating = 0;
                crop.rating = 0;
            }
            
            console.log(`Crop ${crop.name}: ${crop.reviewCount} reviews, avg rating: ${crop.avgRating}`);
            
        } catch (error) {
            console.error("Error fetching reviews:", error);
            crop.reviewCount = 0;
            crop.avgRating = 0;
            crop.rating = 0;
        }

        return crop;
    }

    function renderPage() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const cropsToRender = filteredCrops.slice(start, end);

        if (cropsToRender.length === 0) {
            cropsGrid.innerHTML = '<div class="empty-state">No crops available</div>';
            return;
        }

        cropsGrid.innerHTML = cropsToRender.map(crop => {
            // Get description from various possible field names
            const description = crop.description || crop.desc || crop.details || crop.info || '';
            
            // Generate star rating HTML
            const starRatingHTML = getStarRatingHTML(crop.rating || crop.avgRating || 0);
            
            return `
            <div class="crop-card" data-id="${crop.id}">
                ${crop.imageUrl 
                    ? `<img src="${crop.imageUrl}" alt="${crop.name}" class="crop-image">`
                    : '<div class="crop-image no-image"><i class="fas fa-seedling"></i></div>'}
                
                <div class="crop-info">
                    <h3 class="crop-name">${crop.name}</h3>
                    <p class="crop-price">₹${crop.price}/kg</p>

                    <!-- DESCRIPTION - Show only if it exists -->
                    ${description ? `
                        <div class="description-container">
                            <p class="crop-description">${description}</p>
                        </div>
                    ` : ''}

                    <!-- RATING SECTION WITH VIEW REVIEWS BUTTON -->
                    <div class="rating-container">
                        <div class="rating-display">
                            ${starRatingHTML}
                            <span class="rating-text">
                                ${crop.avgRating ? crop.avgRating.toFixed(1) : "0.0"} 
                                (${crop.reviewCount || 0} ${crop.reviewCount === 1 ? 'review' : 'reviews'})
                            </span>
                        </div>
                        ${(crop.reviewCount || 0) > 0 ? `
                            <button class="view-reviews-btn" data-crop-id="${crop.id}">
                                <i class="fas fa-comment-alt"></i> View Reviews
                            </button>
                        ` : ''}
                    </div>

                    <!-- FARMER DETAILS -->
                    <div class="farmer-details">
                        ${crop.farmerPhoto ? `<img src="${crop.farmerPhoto}" alt="${crop.farmerName}" class="farmer-avatar">` : ''}
                        <div class="farmer-info">
                            <p class="farmer-name">
                                <i class="fas fa-user"></i> ${crop.farmerName || "Unknown Farmer"}
                            </p>
                            <p class="farmer-location">
                                <i class="fas fa-map-marker-alt"></i> ${crop.farmerLocation || "Location not specified"}
                            </p>
                        </div>
                    </div>

                    <!-- CROP META DATA -->
                    <div class="crop-meta">
                        <span class="quantity">
                            <i class="fas fa-weight-hanging"></i> ${crop.quantity} kg
                        </span>
                        <span class="category">
                            <i class="fas fa-tag"></i> ${crop.category || 'Uncategorized'}
                        </span>
                        ${crop.status === 'organic' ? '<span class="organic-badge"><i class="fas fa-leaf"></i> Organic</span>' : ''}
                    </div>
                </div>
            </div>
            `;
        }).join("");

        // Add click event listeners for crop cards
        document.querySelectorAll('.crop-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on view reviews button
                if (!e.target.closest('.view-reviews-btn')) {
                    openAddToCartModal(card.dataset.id);
                }
            });
        });

        // Add click event listeners for view reviews buttons
        document.querySelectorAll('.view-reviews-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cropId = btn.dataset.cropId;
                console.log("View reviews clicked for crop:", cropId); // Debug log
                showCropReviews(cropId);
            });
        });
    }

    // Helper function to generate star rating HTML
    function getStarRatingHTML(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
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
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return `<span class="rating-stars">${stars}</span>`;
    }

    async function showCropReviews(cropId) {
    const crop = crops.find(c => c.id === cropId);
    if (!crop) {
        showToast("Product not found", "error");
        return;
    }
    
    try {
        // Create or get reviews modal
        let reviewsModal = document.getElementById('reviewsModal');
        if (!reviewsModal) {
            reviewsModal = document.createElement('div');
            reviewsModal.id = 'reviewsModal';
            reviewsModal.className = 'reviews-modal';
            reviewsModal.innerHTML = `
                <div class="reviews-modal-content">
                    <div class="reviews-header">
                        <h2 id="reviewsModalTitle">Reviews</h2>
                        <button class="close-reviews">&times;</button>
                    </div>
                    <div id="reviewsContent" class="reviews-container">
                        Loading reviews...
                    </div>
                </div>
            `;
            document.body.appendChild(reviewsModal);
            
            // Add close functionality
            reviewsModal.querySelector('.close-reviews').addEventListener('click', () => {
                reviewsModal.style.display = 'none';
                document.body.style.overflow = '';
            });
            
            // Close when clicking outside
            reviewsModal.addEventListener('click', (e) => {
                if (e.target === reviewsModal) {
                    reviewsModal.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
        }
        
        // Show loading
        document.getElementById('reviewsContent').innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="spinner"></div>
                <p>Loading reviews...</p>
            </div>
        `;
        
        // Show modal
        reviewsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Set title
        document.getElementById('reviewsModalTitle').textContent = `Reviews for ${crop.name}`;
        
        // Fetch reviews from both top-level and nested collections
        const reviews = await fetchCropReviews(cropId);
        
        // Render reviews
        renderCropReviews(reviews, crop);
        
    } catch (error) {
        console.error("Error showing reviews:", error);
        showToast("Failed to load reviews", "error");
    }
}

// Function to fetch reviews for a crop
async function fetchCropReviews(cropId) {
    const allReviews = [];
    
    try {
        // Fetch from top-level reviews collection
        const topLevelQuery = query(
            collection(db, "reviews"),
            where("cropId", "==", cropId)
        );
        
        const topLevelSnapshot = await getDocs(topLevelQuery);
        topLevelSnapshot.forEach(doc => {
            const data = doc.data();
            allReviews.push({
                id: doc.id,
                ...data,
                // Ensure all required fields exist
                customerName: data.customerName || "Anonymous Customer",
                rating: data.rating || 0,
                comment: data.comment || "",
                createdAt: data.createdAt || new Date()
            });
        });
        
        // Try to fetch from nested reviews collection (for backward compatibility)
        try {
            const nestedQuery = collection(db, "products", cropId, "reviews");
            const nestedSnapshot = await getDocs(nestedQuery);
            nestedSnapshot.forEach(doc => {
                const data = doc.data();
                allReviews.push({
                    id: doc.id,
                    ...data,
                    customerName: data.customerName || data.name || "Anonymous Customer",
                    rating: data.rating || 0,
                    comment: data.comment || "",
                    createdAt: data.createdAt || new Date()
                });
            });
        } catch (nestedError) {
            console.log("No nested reviews found:", nestedError);
        }
        
    } catch (error) {
        console.error("Error fetching reviews:", error);
        throw error;
    }
    
    return allReviews;
}

// Function to render reviews in the modal
function renderCropReviews(reviews, crop) {
    const reviewsContent = document.getElementById('reviewsContent');
    
    if (!reviews || reviews.length === 0) {
        reviewsContent.innerHTML = `
            <div class="empty-reviews">
                <i class="fas fa-comment-slash" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                <h3>No Reviews Yet</h3>
                <p>Be the first to review this product!</p>
            </div>
        `;
        return;
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);
    
    let html = `
        <div class="average-rating-summary" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: #4CAF50;">${averageRating}</div>
                    <div style="color: #666;">out of 5</div>
                </div>
                <div>
                    <div style="margin-bottom: 5px;">${getStarRatingHTML(parseFloat(averageRating))}</div>
                    <div style="color: #666;">Based on ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}</div>
                </div>
            </div>
        </div>
        
        <div class="reviews-list">
    `;
    
    // Sort reviews by date (newest first)
    reviews.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
    });
    
    reviews.forEach((review, index) => {
        // Format date
        let reviewDate = "Date not available";
        if (review.createdAt) {
            try {
                if (review.createdAt.toDate) {
                    reviewDate = review.createdAt.toDate().toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } else if (review.createdAt instanceof Date) {
                    reviewDate = review.createdAt.toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            } catch (error) {
                console.log("Error formatting date:", error);
            }
        }
        
        // Get reviewer initials for avatar
        const initials = review.customerName
            ? review.customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            : "??";
        
        html += `
            <div class="review-item" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: white;">
                <div class="review-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div class="reviewer-info" style="display: flex; align-items: center; gap: 10px;">
                        <div class="reviewer-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: #4CAF50; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${initials}
                        </div>
                        <div>
                            <div class="reviewer-name" style="font-weight: bold;">${review.customerName}</div>
                            <div class="review-date" style="font-size: 12px; color: #666;">${reviewDate}</div>
                        </div>
                    </div>
                    <div class="review-rating" style="display: flex; align-items: center; gap: 5px;">
                        <div class="review-stars" style="color: #FFD700;">
                            ${getStarRatingHTML(review.rating)}
                        </div>
                        <span style="font-weight: bold;">${review.rating}.0</span>
                    </div>
                </div>
                ${review.comment ? `
                    <div class="review-comment" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; color: #333;">
                        ${review.comment}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += `</div>`;
    reviewsContent.innerHTML = html;
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

        // Modal close buttons
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

        // Setup profile dropdown
        setupProfileDropdown();
        
        // Setup logout functionality
        setupLogout();
    }

    function setupProfileDropdown() {
        const profileIcon = document.getElementById('profileIcon');
        const profileDropdown = document.getElementById('profileDropdown');

        if (profileIcon && profileDropdown) {
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
        }
    }

    function setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutConfirmModal');
        const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
        const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

        if (logoutBtn && logoutModal && confirmLogoutBtn && cancelLogoutBtn) {
            logoutBtn.addEventListener('click', e => {
                e.preventDefault();
                logoutModal.classList.remove('hidden');
            });

            cancelLogoutBtn.addEventListener('click', () => {
                logoutModal.classList.add('hidden');
            });

            confirmLogoutBtn.addEventListener('click', async () => {
                try {
                    await signOut(auth);
                    localStorage.removeItem('cart'); // Clear cart on logout
                    window.location.href = "main.html";
                } catch (error) {
                    console.error("Logout error:", error);
                    showToast("Error during logout. Please try again.", "error");
                }
            });
        }
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
                farmerName: crop.farmerName,
                unit: 'kg'
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showToast(`${quantity} kg ${crop.name} added to cart`, 'success');
    }


    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});