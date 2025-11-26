import { db, auth } from '../config.js'; // ✅ one folder up
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, doc, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dtiast5hl',
  uploadPreset: 'farmerconnect',
  apiKey: '599833551235487', // Add your actual API key
  folder: 'farmer-connect/crops'
};
document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'farmer4.html'; // change to your dashboard URL if different
});

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
  notificationToast: document.getElementById('notificationToast')
};
addNewCropBtn.addEventListener('click', () => {
  cropForm.style.display = 'block';
  elements.cancelEditBtn.style.display='inline-block'; // 👈 Show cancel button
  formTitle.textContent = 'Add New Crop';

  // Optional: clear form fields
  document.getElementById('cropForm').reset();
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('removeImageBtn').style.display = 'none';
});

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
  setupEventListeners();
  checkAuthState();
}

// Set up all event listeners
function setupEventListeners() {
  elements.cropForm.addEventListener('submit', handleFormSubmit);
  
  elements.uploadArea.addEventListener('click', () => elements.cropImage.click());
  elements.cropImage.addEventListener('change', handleImageUpload);
  elements.removeImageBtn.addEventListener('click', removeImage);
  
  elements.cancelEditBtn.addEventListener('click', cancelEdit);
  
  elements.searchInput.addEventListener('input', filterCrops);
  elements.statusFilter.addEventListener('change', filterCrops);
  elements.sortBy.addEventListener('change', filterCrops);
  
  
  elements.modalCancelBtn.addEventListener('click', () => {
    elements.confirmationModal.style.display = 'none';
  });
  elements.modalConfirmBtn.addEventListener('click', handleModalConfirm);
}

// Reset form to initial state
function resetForm() {
  state.currentEditId = null;
  state.currentImageFile = null;
  
  // Reset form fields
  elements.cropForm.reset();
  
  // Reset image preview
  elements.imagePreview.src = '';
  elements.imagePreview.style.display = 'none';
  elements.removeImageBtn.style.display = 'none';
  elements.uploadArea.querySelector('i').style.display = 'block';
  elements.uploadArea.querySelector('p').style.display = 'block';
  
  // Reset form UI
  elements.cancelEditBtn.style.display = 'none';
  elements.formTitle.textContent = 'Add New Crop';
  elements.submitText.textContent = 'Save Crop';
  
  // Clear any validation errors
  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

// Check authentication state
function checkAuthState() {
  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = "main.html";
      return;
    }
    loadCrops(user.uid);
  });
}

// Load crops from Firestore
function loadCrops(userId) {
  const q = query(
    collection(db, 'products'),
    where('farmerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  onSnapshot(q, snapshot => {
    state.crops = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
    filterCrops();
  });
}

// Render crops to the UI
function renderCrops(cropsList) {
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
        <h3 class="crop-card-title">${crop.name}</h3>
        <span class="crop-card-category">${crop.category || 'Uncategorized'}</span>
      </div>
      ${crop.imageUrl ? `<img src="${crop.imageUrl}" alt="${crop.name}" class="crop-card-image">` : ''}
      <div class="crop-card-details">
        <span class="crop-card-price">₹${crop.price}/kg</span>
        <span class="crop-card-quantity">${crop.quantity} kg available</span>
      </div>
      <span class="crop-card-status status-${crop.status === 'available' ? 'available' : 'sold'}">
        ${crop.status === 'available' ? 'Available' : 'Sold Out'}
      </span>
      ${crop.description ? `<p class="crop-card-description">${crop.description}</p>` : ''}
      <div class="crop-card-footer">
        <button class="btn btn-small btn-secondary" onclick="editCrop('${crop.id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-small btn-danger" onclick="showDeleteConfirmation('${crop.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
        <button class="btn btn-small ${crop.status === 'available' ? 'btn-secondary' : 'btn-primary'}" 
                onclick="showStatusToggleConfirmation('${crop.id}', '${crop.status}')">
          <i class="fas fa-sync-alt"></i> ${crop.status === 'available' ? 'Mark Sold' : 'Restock'}
        </button>
      </div>
    `;
    elements.myCropsContainer.appendChild(card);
  });
}

// Filter and sort crops
function filterCrops() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const statusFilterValue = elements.statusFilter.value;
  const sortByValue = elements.sortBy.value;
  
  let filtered = state.crops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchTerm) || 
                         (crop.description && crop.description.toLowerCase().includes(searchTerm));
    const matchesStatus = statusFilterValue === 'all' || crop.status === statusFilterValue;
    return matchesSearch && matchesStatus;
  });
  
  switch(sortByValue) {
    case 'newest':
      filtered.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'oldest':
      filtered.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case 'price-high':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'price-low':
      filtered.sort((a, b) => a.price - b.price);
      break;
  }
  
  renderCrops(filtered);
}

// Handle image upload
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!file.type.match('image.*')) {
    showError('imageError', 'Please select a valid image file');
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
    elements.imagePreview.src = e.target.result;
    elements.imagePreview.style.display = 'block';
    elements.removeImageBtn.style.display = 'block';
    elements.uploadArea.querySelector('i').style.display = 'none';
    elements.uploadArea.querySelector('p').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// Remove selected image
function removeImage() {
  elements.cropImage.value = '';
  elements.imagePreview.style.display = 'none';
  elements.removeImageBtn.style.display = 'none';
  elements.uploadArea.querySelector('i').style.display = 'block';
  elements.uploadArea.querySelector('p').style.display = 'block';
  state.currentImageFile = null;
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Validate form
  if (!validateForm()) {
    showToast('Please fill all required fields correctly', 'error');
    return;
  }
  
  setLoadingState(true);
  
  try {
    const cropData = {
      name: elements.cropName.value.trim(),
      price: parseFloat(elements.cropPrice.value),
      quantity: parseInt(elements.cropQuantity.value),
      category: elements.cropCategory.value,
      description: elements.cropDescription.value.trim() || null,
      status: "available",
      farmerId: auth.currentUser?.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
      
    };

    // Handle image upload if present
    if (state.currentImageFile) {
      cropData.imageUrl = await uploadToCloudinary(state.currentImageFile);
    } else if (state.currentEditId && elements.imagePreview.src) {
      // Keep existing image if editing and no new image was selected
      cropData.imageUrl = null;
    }

    if (state.currentEditId) {
      // Update existing crop
      await updateDoc(doc(db, 'products', state.currentEditId), cropData);
      showToast('Crop updated successfully!');
    } else {
      // Add new crop
      await addDoc(collection(db, 'products'), cropData);
      showToast('Crop added successfully!');
    }

    // Reset form after successful submission
    resetForm();
    elements.cropForm.style.display = 'none'; // Hide form after submission
    
  } catch (error) {
    console.error("Error saving crop:", error);
    showToast('Failed to save crop. Please try again.', 'error');
  } finally {
    setLoadingState(false);
  }
}

// Upload image to Cloudinary
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
formData.append('folder', CLOUDINARY_CONFIG.folder);

  
  try {
    const response = await fetch(
`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Image upload failed. Please try again.');
  }
}

// Set loading state
function setLoadingState(isLoading) {
  elements.submitBtn.disabled = isLoading;
  elements.submitText.textContent = isLoading ? 'Processing...' : 
    (state.currentEditId ? 'Update Crop' : 'Save Crop');
  elements.submitSpinner.style.display = isLoading ? 'inline-block' : 'none';
}

// Validate form fields
function validateForm() {
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

  return isValid;
}

// Show error message
function showError(id, message) {
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
  elements.notificationToast.textContent = message;
  elements.notificationToast.className = `toast toast-${type}`;
  elements.notificationToast.style.display = 'block';
  setTimeout(() => {
    elements.notificationToast.style.display = 'none';
  }, 3500);
}

// Edit crop
window.editCrop = function(id) {
  const crop = state.crops.find(c => c.id === id);
  if (!crop) return;
  
  state.currentEditId = id;
  elements.cropName.value = crop.name;
  elements.cropPrice.value = crop.price;
  elements.cropQuantity.value = crop.quantity;
  elements.cropCategory.value = crop.category || '';
  elements.cropDescription.value = crop.description || '';
  
  if (crop.imageUrl) {
    elements.imagePreview.src = crop.imageUrl;
    elements.imagePreview.style.display = 'block';
    elements.removeImageBtn.style.display = 'block';
    elements.uploadArea.querySelector('i').style.display = 'none';
    elements.uploadArea.querySelector('p').style.display = 'none';
  } else {
    removeImage();
  }
  
  elements.cancelEditBtn.style.display = 'inline-block';
  elements.formTitle.textContent = 'Edit Crop';
  elements.submitText.textContent = 'Update Crop';
  scrollToForm();
};

// Cancel editing
function cancelEdit() {
  resetForm();
}

// Scroll smoothly to the form
function scrollToForm() {
  elements.cropForm.scrollIntoView({ behavior: 'smooth' });
}

// Show delete confirmation modal
window.showDeleteConfirmation = function(id) {
  elements.confirmationModal.style.display = 'block';
  elements.modalTitle.textContent = 'Delete Crop';
  elements.modalMessage.textContent = 'Are you sure you want to delete this crop? This action cannot be undone.';
  state.deleteCallback = () => deleteCrop(id);
};

// Handle modal confirm button click
function handleModalConfirm() {
  if (state.deleteCallback) {
    state.deleteCallback();
  }
  if (state.statusToggleCallback) {
    state.statusToggleCallback();
  }
  elements.confirmationModal.style.display = 'none';
  state.deleteCallback = null;
  state.statusToggleCallback = null;
}

// Delete crop
async function deleteCrop(id) {
  try {
    await deleteDoc(doc(db, 'products', id));
    showToast('Crop deleted successfully!');
  } catch (error) {
    console.error("Delete crop error:", error);
    showToast('Failed to delete crop.', 'error');
  }
}

// Show status toggle confirmation modal
window.showStatusToggleConfirmation = function(id, currentStatus) {
  elements.confirmationModal.style.display = 'block';
  elements.modalTitle.textContent = currentStatus === 'available' ? 'Mark as Sold Out' : 'Restock Crop';
  elements.modalMessage.textContent = currentStatus === 'available' ?
    'Mark this crop as sold out?' :
    'Restock this crop and mark as available?';
  state.statusToggleCallback = () => toggleCropStatus(id, currentStatus);
};

// Toggle crop status between available and sold
async function toggleCropStatus(id, currentStatus) {
  try {
    const newStatus = currentStatus === 'available' ? 'sold' : 'available';
    await updateDoc(doc(db, 'products', id), { status: newStatus });
    showToast(`Crop marked as ${newStatus === 'available' ? 'Available' : 'Sold Out'}`);
  } catch (error) {
    console.error("Toggle status error:", error);
    showToast('Failed to update crop status.', 'error');
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);