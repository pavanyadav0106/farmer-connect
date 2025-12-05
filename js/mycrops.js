import { db, auth } from '../config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, doc, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dtiast5hl',
  uploadPreset: 'farmerconnect',
  apiKey: '599833551235487',
  folder: 'farmer-connect/crops'
};

// DOM Elements
const elements = {
  cropForm: document.getElementById('cropForm'),
  cropName: document.getElementById('cropName'),
  cropPrice: document.getElementById('cropPrice'),
  cropQuantity: document.getElementById('cropQuantity'),
  cropCategory: document.getElementById('cropCategory'),
  cropDescription: document.getElementById('cropDescription'),
  cropImage: document.getElementById('cropImage'),
  uploadArea: document.getElementById('uploadArea'),
  imagePreview: document.getElementById('imagePreview'),
  removeImageBtn: document.getElementById('removeImageBtn'),
  cancelEditBtn: document.getElementById('cancelEdit'),
  searchInput: document.getElementById('searchInput'),
  statusFilter: document.getElementById('statusFilter'),
  sortBy: document.getElementById('sortBy'),
  myCropsContainer: document.getElementById('myCrops'),
  submitBtn: document.getElementById('submitBtn'),
  submitText: document.getElementById('submitText'),
  submitSpinner: document.getElementById('submitSpinner'),
  addNewCropBtn: document.getElementById('addNewCropBtn'),
  formTitle: document.getElementById('formTitle'),
  confirmationModal: document.getElementById('confirmationModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalMessage: document.getElementById('modalMessage'),
  modalCancelBtn: document.getElementById('modalCancelBtn'),
  modalConfirmBtn: document.getElementById('modalConfirmBtn'),
  notificationToast: document.getElementById('notificationToast'),
  backBtn: document.getElementById('backBtn')
};

// State Management
const state = {
  currentEditId: null,
  crops: [],
  currentImageFile: null,
  deleteCallback: null,
  statusToggleCallback: null
};

// Initialize the app
function init() {
  console.log('Initializing My Crops...');
  setupEventListeners();
  checkAuthState();
}

// Set up all event listeners
function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Back button
  if (elements.backBtn) {
    elements.backBtn.addEventListener('click', () => {
      window.location.href = 'farmer4.html';
    });
  }

  // Add new crop button
  if (elements.addNewCropBtn) {
    elements.addNewCropBtn.addEventListener('click', () => {
      console.log('Add new crop button clicked');
      resetForm();
      elements.cropForm.style.display = 'block';
      elements.cancelEditBtn.style.display = 'inline-block';
      elements.formTitle.textContent = 'Add New Crop';
      
      // Scroll to form
      elements.cropForm.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Form submission
  if (elements.cropForm) {
    elements.cropForm.addEventListener('submit', handleFormSubmit);
  }

  // Image upload
  if (elements.uploadArea) {
    elements.uploadArea.addEventListener('click', () => {
      if (elements.cropImage) elements.cropImage.click();
    });
  }
  
  if (elements.cropImage) {
    elements.cropImage.addEventListener('change', handleImageUpload);
  }

  if (elements.removeImageBtn) {
    elements.removeImageBtn.addEventListener('click', removeImage);
  }

  // Cancel edit
  if (elements.cancelEditBtn) {
    elements.cancelEditBtn.addEventListener('click', cancelEdit);
  }

  // Search and filters
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', filterCrops);
  }
  
  if (elements.statusFilter) {
    elements.statusFilter.addEventListener('change', filterCrops);
  }
  
  if (elements.sortBy) {
    elements.sortBy.addEventListener('change', filterCrops);
  }

  // Modal buttons
  if (elements.modalCancelBtn) {
    elements.modalCancelBtn.addEventListener('click', () => {
      console.log('Modal cancel clicked');
      elements.confirmationModal.style.display = 'none';
      state.deleteCallback = null;
      state.statusToggleCallback = null;
    });
  }

  if (elements.modalConfirmBtn) {
    elements.modalConfirmBtn.addEventListener('click', handleModalConfirm);
  }

  // Close modal when clicking outside
  if (elements.confirmationModal) {
    elements.confirmationModal.addEventListener('click', function(e) {
      if (e.target === elements.confirmationModal) {
        console.log('Modal backdrop clicked');
        elements.confirmationModal.style.display = 'none';
        state.deleteCallback = null;
        state.statusToggleCallback = null;
      }
    });
  }
}


// Reset form to initial state
function resetForm() {
  console.log('Resetting form...');
  
  state.currentEditId = null;
  state.currentImageFile = null;
  
  // Reset form fields
  if (elements.cropForm) {
    elements.cropForm.reset();
  }
  
  // Reset image preview
  if (elements.imagePreview) {
    elements.imagePreview.src = '';
    elements.imagePreview.style.display = 'none';
  }
  
  if (elements.removeImageBtn) {
    elements.removeImageBtn.style.display = 'none';
  }
  
  if (elements.uploadArea) {
    const icon = elements.uploadArea.querySelector('i');
    const text = elements.uploadArea.querySelector('p');
    if (icon) icon.style.display = 'block';
    if (text) text.style.display = 'block';
  }
  
  // Reset form UI
  if (elements.cancelEditBtn) {
    elements.cancelEditBtn.style.display = 'none';
  }
  
  if (elements.formTitle) {
    elements.formTitle.textContent = 'Add New Crop';
  }
  
  if (elements.submitText) {
    elements.submitText.textContent = 'Save Crop';
  }
  
  // Clear any validation errors
  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

// Check authentication state
function checkAuthState() {
  console.log('Checking auth state...');
  
  onAuthStateChanged(auth, user => {
    if (!user) {
      console.log('User not authenticated, redirecting...');
      window.location.href = "main.html";
      return;
    }
    console.log('User authenticated:', user.uid);
    loadCrops(user.uid);
  });
}

// Load crops from Firestore
function loadCrops(userId) {
  console.log('Loading crops for user:', userId);
  
  try {
    const q = query(
      collection(db, 'products'),
      where('farmerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    onSnapshot(q, snapshot => {
      console.log('Crops snapshot received, count:', snapshot.docs.length);
      
      state.crops = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          // Ensure all required fields exist
          name: data.name || 'Unnamed Crop',
          price: data.price || 0,
          quantity: data.quantity || 0,
          category: data.category || 'other',
          status: data.status || 'available',
          farmerId: data.farmerId || userId
        };
      });
      
      console.log('State crops loaded:', state.crops.length);
      filterCrops();
    }, error => {
      console.error('Error loading crops:', error);
      showToast('Error loading crops. Please refresh.', 'error');
    });
    
  } catch (error) {
    console.error('Error setting up crops query:', error);
    showToast('Failed to load crops. Please try again.', 'error');
  }
}

// Render crops to the UI
function renderCrops(cropsList) {
  console.log('Rendering crops, count:', cropsList.length);
  
  if (!elements.myCropsContainer) {
    console.error('Crops container not found!');
    return;
  }
  
  if (cropsList.length === 0) {
    elements.myCropsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-seedling"></i>
        <p>No crops found. Add your first crop!</p>
      </div>
    `;
    return;
  }
  
  elements.myCropsContainer.innerHTML = '';
  
  cropsList.forEach(crop => {
    const card = document.createElement('div');
    card.className = 'crop-card';
    card.innerHTML = `
      <div class="crop-card-header">
        <h3 class="crop-card-title">${crop.name || 'Unnamed Crop'}</h3>
        <span class="crop-card-category">${crop.category || 'Uncategorized'}</span>
      </div>
      ${crop.imageUrl ? `<img src="${crop.imageUrl}" alt="${crop.name}" class="crop-card-image">` : ''}
      <div class="crop-card-details">
        <span class="crop-card-price">₹${crop.price || 0}/kg</span>
        <span class="crop-card-quantity">${crop.quantity || 0} kg available</span>
      </div>
      <span class="crop-card-status status-${crop.status === 'available' ? 'available' : 'sold'}">
        ${crop.status === 'available' ? 'Available' : 'Sold Out'}
      </span>
      ${crop.description ? `<p class="crop-card-description">${crop.description}</p>` : ''}
      <div class="crop-card-footer">
        <button class="btn btn-small btn-secondary edit-btn" data-id="${crop.id}">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-small btn-danger delete-btn" data-id="${crop.id}">
          <i class="fas fa-trash"></i> Delete
        </button>
        <button class="btn btn-small ${crop.status === 'available' ? 'btn-secondary' : 'btn-primary'} status-toggle-btn" 
                data-id="${crop.id}" data-status="${crop.status}">
          <i class="fas fa-sync-alt"></i> ${crop.status === 'available' ? 'Mark Sold' : 'Restock'}
        </button>
      </div>
    `;
    
    // Add event listeners directly to avoid onclick issues
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => showDeleteConfirmation(crop.id));
    }
    
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => editCrop(crop.id));
    }
    
    const statusBtn = card.querySelector('.status-toggle-btn');
    if (statusBtn) {
      statusBtn.addEventListener('click', () => showStatusToggleConfirmation(crop.id, crop.status));
    }
    
    elements.myCropsContainer.appendChild(card);
  });
}

// Filter and sort crops
function filterCrops() {
  console.log('Filtering crops...');
  
  if (!state.crops || state.crops.length === 0) {
    renderCrops([]);
    return;
  }
  
  const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
  const statusFilterValue = elements.statusFilter ? elements.statusFilter.value : 'all';
  const sortByValue = elements.sortBy ? elements.sortBy.value : 'newest';
  
  let filtered = state.crops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchTerm) || 
                         (crop.description && crop.description.toLowerCase().includes(searchTerm));
    const matchesStatus = statusFilterValue === 'all' || crop.status === statusFilterValue;
    return matchesSearch && matchesStatus;
  });
  
  console.log('Filtered crops:', filtered.length);
  
  switch(sortByValue) {
    case 'newest':
      filtered.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'oldest':
      filtered.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case 'price-high':
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'price-low':
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
  }
  
  renderCrops(filtered);
}

// Handle image upload
function handleImageUpload(e) {
  console.log('Handling image upload...');
  
  const file = e.target.files[0];
  if (!file) {
    console.log('No file selected');
    return;
  }
  
  console.log('Selected file:', file.name, file.type, file.size);
  
  if (!file.type.match('image.*')) {
    showError('imageError', 'Please select a valid image file (JPEG, PNG, etc.)');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    showError('imageError', 'Image size should be less than 5MB');
    return;
  }
  
  hideError('imageError');
  state.currentImageFile = file;
  
  const reader = new FileReader();
  reader.onload = e => {
    console.log('File read successfully');
    if (elements.imagePreview) {
      elements.imagePreview.src = e.target.result;
      elements.imagePreview.style.display = 'block';
    }
    
    if (elements.removeImageBtn) {
      elements.removeImageBtn.style.display = 'block';
    }
    
    if (elements.uploadArea) {
      const icon = elements.uploadArea.querySelector('i');
      const text = elements.uploadArea.querySelector('p');
      if (icon) icon.style.display = 'none';
      if (text) text.style.display = 'none';
    }
  };
  
  reader.onerror = () => {
    console.error('Error reading file');
    showError('imageError', 'Error reading image file');
  };
  
  reader.readAsDataURL(file);
}

// Remove selected image
function removeImage() {
  console.log('Removing image...');
  
  if (elements.cropImage) {
    elements.cropImage.value = '';
  }
  
  if (elements.imagePreview) {
    elements.imagePreview.style.display = 'none';
  }
  
  if (elements.removeImageBtn) {
    elements.removeImageBtn.style.display = 'none';
  }
  
  if (elements.uploadArea) {
    const icon = elements.uploadArea.querySelector('i');
    const text = elements.uploadArea.querySelector('p');
    if (icon) icon.style.display = 'block';
    if (text) text.style.display = 'block';
  }
  
  state.currentImageFile = null;
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  console.log('Form submitted');
  
  // Validate form
  if (!validateForm()) {
    showToast('Please fill all required fields correctly', 'error');
    return;
  }
  
  setLoadingState(true);
  
  try {
    const user = auth.currentUser;
    if (!user) {
      showToast('You must be logged in to save crops', 'error');
      window.location.href = "main.html";
      return;
    }
    
    console.log('Fetching user profile...');
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const profile = profileSnap.data() || {};

    console.log('Creating crop data...');
    const cropData = {
      name: elements.cropName.value.trim(),
      price: parseFloat(elements.cropPrice.value),
      quantity: parseInt(elements.cropQuantity.value),
      category: elements.cropCategory.value,
      description: elements.cropDescription.value.trim() || null,
      status: "available",
      farmerId: user.uid,
      
      // Farmer details
      farmerName: profile.name || "",
      farmerLocation: profile.location || profile.address || "",
      farmerPhone: profile.phone || "",
      farmerPhoto: profile.photoURL || "",
      
      // Reviews (initialize as empty)
      avgRating: 0,
      reviewCount: 0,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Crop data created:', cropData);
    
    // Handle image upload if present
    if (state.currentImageFile) {
      console.log('Uploading image to Cloudinary...');
      try {
        cropData.imageUrl = await uploadToCloudinary(state.currentImageFile);
        console.log('Image uploaded successfully:', cropData.imageUrl);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        // Continue without image if upload fails
        cropData.imageUrl = null;
      }
    } else if (state.currentEditId) {
      // Keep existing image if editing and no new image was selected
      const oldCrop = state.crops.find(c => c.id === state.currentEditId);
      cropData.imageUrl = oldCrop?.imageUrl || null;
    }

    if (state.currentEditId) {
      console.log('Updating existing crop:', state.currentEditId);
      
      // Refresh farmer details in case profile changed
      const updatedProfileSnap = await getDoc(doc(db, "users", user.uid));
      const updatedProfile = updatedProfileSnap.data() || {};
      
      cropData.farmerName = updatedProfile.name || "";
      cropData.farmerLocation = updatedProfile.location || updatedProfile.address || "";
      cropData.farmerPhone = updatedProfile.phone || "";
      cropData.farmerPhoto = updatedProfile.photoURL || "";
      
      await updateDoc(doc(db, "products", state.currentEditId), cropData);
      showToast("Crop updated successfully!");
      console.log('Crop updated');
    } else {
      console.log('Adding new crop...');
      await addDoc(collection(db, "products"), cropData);
      showToast("Crop added successfully!");
      console.log('Crop added');
    }

    // Reset form after successful submission
    resetForm();
    
  } catch (error) {
    console.error("Error saving crop:", error);
    showToast('Failed to save crop. Please try again.', 'error');
  } finally {
    setLoadingState(false);
  }
}

// Upload image to Cloudinary
async function uploadToCloudinary(file) {
  console.log('Starting Cloudinary upload...');
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', CLOUDINARY_CONFIG.folder);
  formData.append('api_key', CLOUDINARY_CONFIG.apiKey);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    console.log('Cloudinary response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Cloudinary upload successful:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Image upload failed. Please try again.');
  }
}

// Set loading state
function setLoadingState(isLoading) {
  console.log('Setting loading state:', isLoading);
  
  if (elements.submitBtn) {
    elements.submitBtn.disabled = isLoading;
  }
  
  if (elements.submitText) {
    elements.submitText.textContent = isLoading ? 'Processing...' : 
      (state.currentEditId ? 'Update Crop' : 'Save Crop');
  }
  
  if (elements.submitSpinner) {
    elements.submitSpinner.style.display = isLoading ? 'inline-block' : 'none';
  }
}

// Validate form fields
function validateForm() {
  console.log('Validating form...');
  
  let isValid = true;

  // Reset all errors first
  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });

  // Name validation
  if (!elements.cropName.value.trim()) {
    showError('nameError', 'Crop name is required');
    isValid = false;
  }

  // Price validation
  const price = parseFloat(elements.cropPrice.value);
  if (isNaN(price)){
    showError('priceError', 'Please enter a valid price');
    isValid = false;
  } else if (price <= 0) {
    showError('priceError', 'Price must be greater than 0');
    isValid = false;
  }

  // Quantity validation
  const quantity = parseInt(elements.cropQuantity.value);
  if (isNaN(quantity)) {
    showError('quantityError', 'Please enter a valid quantity');
    isValid = false;
  } else if (quantity <= 0) {
    showError('quantityError', 'Quantity must be at least 1');
    isValid = false;
  }

  // Category validation
  if (!elements.cropCategory.value) {
    showError('categoryError', 'Please select a category');
    isValid = false;
  }

  console.log('Form validation result:', isValid);
  return isValid;
}

// Show error message
function showError(id, message) {
  console.log(`Showing error for ${id}:`, message);
  
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
}

// Hide error message
function hideError(id) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = '';
    el.style.display = 'none';
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  console.log(`Toast (${type}):`, message);
  
  if (!elements.notificationToast) {
    console.warn('Toast element not found');
    return;
  }
  
  elements.notificationToast.textContent = message;
  elements.notificationToast.className = `toast toast-${type}`;
  elements.notificationToast.style.display = 'block';
  
  setTimeout(() => {
    if (elements.notificationToast) {
      elements.notificationToast.style.display = 'none';
    }
  }, 3500);
}

// Edit crop
function editCrop(id) {
  console.log('Editing crop:', id);
  
  const crop = state.crops.find(c => c.id === id);
  if (!crop) {
    console.error('Crop not found for editing:', id);
    showToast('Crop not found', 'error');
    return;
  }
  
  console.log('Crop found:', crop);
  
  state.currentEditId = id;
  
  if (elements.cropName) elements.cropName.value = crop.name || '';
  if (elements.cropPrice) elements.cropPrice.value = crop.price || '';
  if (elements.cropQuantity) elements.cropQuantity.value = crop.quantity || '';
  if (elements.cropCategory) elements.cropCategory.value = crop.category || '';
  if (elements.cropDescription) elements.cropDescription.value = crop.description || '';
  
  if (crop.imageUrl) {
    console.log('Setting existing image:', crop.imageUrl);
    if (elements.imagePreview) {
      elements.imagePreview.src = crop.imageUrl;
      elements.imagePreview.style.display = 'block';
    }
    
    if (elements.removeImageBtn) {
      elements.removeImageBtn.style.display = 'block';
    }
    
    if (elements.uploadArea) {
      const icon = elements.uploadArea.querySelector('i');
      const text = elements.uploadArea.querySelector('p');
      if (icon) icon.style.display = 'none';
      if (text) text.style.display = 'none';
    }
  } else {
    console.log('No existing image, resetting upload area');
    removeImage();
  }
  
  if (elements.cancelEditBtn) {
    elements.cancelEditBtn.style.display = 'inline-block';
  }
  
  if (elements.formTitle) {
    elements.formTitle.textContent = 'Edit Crop';
  }
  
  if (elements.submitText) {
    elements.submitText.textContent = 'Update Crop';
  }
  
  // Show form if hidden
  if (elements.cropForm) {
    elements.cropForm.style.display = 'block';
  }
  
  // Scroll to form
  if (elements.cropForm) {
    elements.cropForm.scrollIntoView({ behavior: 'smooth' });
  }
  
  console.log('Edit form set up successfully');
}

// Cancel editing
function cancelEdit() {
  console.log('Canceling edit...');
  resetForm();
}

// Show delete confirmation modal
// Show delete confirmation modal
function showDeleteConfirmation(id) {
  console.log('Show delete confirmation for crop ID:', id);
  
  const crop = state.crops.find(c => c.id === id);
  if (!crop) {
    showToast('Crop not found', 'error');
    return;
  }
  
  if (crop.farmerId !== auth.currentUser?.uid) {
    showToast('You do not have permission to delete this crop.', 'error');
    return;
  }
  
  if (elements.confirmationModal) {
    // Add a class to show modal instead of inline style
    elements.confirmationModal.classList.add('show');
    elements.confirmationModal.style.display = 'block';
  }
  
  if (elements.modalTitle) {
    elements.modalTitle.textContent = 'Delete Crop';
  }
  
  if (elements.modalMessage) {
    elements.modalMessage.textContent = 'Are you sure you want to delete this crop? This action cannot be undone.';
  }
  
  // Set the delete callback
  state.deleteCallback = async () => {
    console.log('Delete callback executing...');
    await deleteCrop(id);
  };
  
  state.statusToggleCallback = null;
}

// Handle modal confirm button click
function handleModalConfirm() {
  console.log('=== MODAL CONFIRM CLICKED ===');
  
  if (state.deleteCallback) {
    console.log('Executing delete callback...');
    state.deleteCallback();
    state.deleteCallback = null;
  } else if (state.statusToggleCallback) {
    console.log('Executing status toggle callback...');
    state.statusToggleCallback();
    state.statusToggleCallback = null;
  }
  
  // Hide modal
  if (elements.confirmationModal) {
    elements.confirmationModal.classList.remove('show');
    elements.confirmationModal.style.display = 'none';
  }
}

// Update modal cancel event listener
if (elements.modalCancelBtn) {
  elements.modalCancelBtn.addEventListener('click', () => {
    console.log('Modal cancel clicked');
    if (elements.confirmationModal) {
      elements.confirmationModal.classList.remove('show');
      elements.confirmationModal.style.display = 'none';
    }
    state.deleteCallback = null;
    state.statusToggleCallback = null;
  });
}

// Delete crop
async function deleteCrop(id) {
  console.log('Starting delete process for ID:', id);

  try {
    const cropRef = doc(db, 'products', id);
    const cropSnap = await getDoc(cropRef);

    if (!cropSnap.exists()) {
      console.error('Crop does not exist in Firestore');
      showToast('Crop not found.', 'error');
      return;
    }

    const cropData = cropSnap.data();
    console.log('Crop data from Firestore:', cropData);
    
    if (cropData.farmerId !== auth.currentUser?.uid) {
      console.error('Permission denied: User does not own this crop');
      showToast('You do not have permission to delete this crop.', 'error');
      return;
    }

    console.log('Deleting crop from Firestore...');
    await deleteDoc(cropRef);
    console.log('Crop deleted from Firestore');
    showToast('Crop deleted successfully!');

    // Update local state immediately
    state.crops = state.crops.filter(c => c.id !== id);
    console.log('Local state updated, remaining crops:', state.crops.length);
    
    // Refresh the UI
    filterCrops();

  } catch (error) {
    console.error("Delete crop error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Show specific error messages
    if (error.code === 'permission-denied') {
      showToast('Permission denied. You cannot delete this crop.', 'error');
    } else if (error.code === 'not-found') {
      showToast('Crop not found.', 'error');
    } else {
      showToast('Failed to delete crop. Please try again.', 'error');
    }
  }
}

// Show status toggle confirmation modal
function showStatusToggleConfirmation(id, currentStatus) {
  console.log('Show status toggle for crop:', id, 'current status:', currentStatus);
  
  if (elements.confirmationModal) {
    elements.confirmationModal.style.display = 'block';
  }
  
  if (elements.modalTitle) {
    elements.modalTitle.textContent = currentStatus === 'available' ? 'Mark as Sold Out' : 'Restock Crop';
  }
  
  if (elements.modalMessage) {
    elements.modalMessage.textContent = currentStatus === 'available' ?
      'Mark this crop as sold out?' :
      'Restock this crop and mark as available?';
  }
  
  state.statusToggleCallback = () => toggleCropStatus(id, currentStatus);
  state.deleteCallback = null;
}

// Toggle crop status between available and sold
async function toggleCropStatus(id, currentStatus) {
  console.log('Toggling crop status:', id, 'from', currentStatus);
  
  try {
    const newStatus = currentStatus === 'available' ? 'sold' : 'available';
    await updateDoc(doc(db, 'products', id), { 
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    
    showToast(`Crop marked as ${newStatus === 'available' ? 'Available' : 'Sold Out'}`);
    console.log('Status updated to:', newStatus);
    
  } catch (error) {
    console.error("Toggle status error:", error);
    showToast('Failed to update crop status.', 'error');
  }
}

// Attach functions to window for global access
window.editCrop = editCrop;
window.showDeleteConfirmation = showDeleteConfirmation;
window.showStatusToggleConfirmation = showStatusToggleConfirmation;

// Initialize the application when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already loaded
  init();
}

// Export for testing if needed
export { init, editCrop, showDeleteConfirmation, showStatusToggleConfirmation };