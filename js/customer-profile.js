import { auth, db } from '../config.js';
import {
  doc, getDoc, updateDoc, setDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  EmailAuthProvider, reauthenticateWithCredential, updatePassword, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// DOM Elements
const elements = {
  // Skeleton elements
  profileSkeleton: document.getElementById('profile-skeleton'),
  profileContent: document.getElementById('profile-content'),
  
  // Profile elements
  profileAvatar: document.getElementById('profile-photo'),
  profileEmail: document.getElementById('user-email'),
  profileName: document.getElementById('user-name'),
  profilePhone: document.getElementById('user-phone'),
  profileAddress: document.getElementById('user-address'),
  profileGender: document.getElementById('user-gender'),
  profileAge: document.getElementById('user-age'),
  
  // Button elements
  editProfileBtn: document.getElementById('edit-profile'),
  saveProfileBtn: document.getElementById('save-profile'),
  changePasswordBtn: document.getElementById('change-password'),
  cancelPasswordBtn: document.getElementById('cancel-password-change'),
  submitPasswordBtn: document.getElementById('submit-password-change'),
  backBtn: document.getElementById('backBtn'),
  uploadBtn: document.getElementById('upload-btn'),
  uploadOverlay: document.getElementById('upload-overlay'),
  
  // Form elements
  profileForm: document.getElementById('profile-form'),
  passwordChangeBox: document.getElementById('password-change-box'),
  photoUpload: document.getElementById('photo-upload'),
  
  // Message elements
  profileUpdateMessage: document.getElementById('profile-update-message'),
  passwordChangeMessage: document.getElementById('password-change-message'),
  uploadStatus: document.getElementById('upload-status'),
  
  // Loading
  loadingOverlay: document.getElementById('loading-overlay'),
  
  // Toast
  toastContainer: document.getElementById('toast-container')
};

// State
let userData = {};
let editMode = false;
let cloudinaryWidget = null;

// Initialize
function init() {
  
  // Debug element availability
  debugElements();
  
  // Initialize Cloudinary widget
  initializeCloudinary();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check authentication state
  checkAuthState();
}

// Debug function to check element availability
function debugElements() {
  Object.keys(elements).forEach(key => {
    const element = elements[key];
  });
}

// Initialize Cloudinary upload widget
function initializeCloudinary() {
  if (window.cloudinary && window.cloudinary.createUploadWidget) {
    cloudinaryWidget = window.cloudinary.createUploadWidget({
      cloudName: 'dtiast5hl',
      uploadPreset: 'farmerconnect',
      cropping: true,
      croppingAspectRatio: 1,
      croppingShowBackButton: true,
      folder: 'farmer-connect/customer-profiles',
      showPoweredBy: false,
      multiple: false,
      maxFiles: 1
    }, (error, result) => {
      if (!error && result && result.event === "success") {
        handleImageUpload(result.info.secure_url);
      } else if (error) {
        console.error("❌ Cloudinary error:", error);
        showMessage(elements.uploadStatus, 'Upload failed: ' + error.message, 'error');
      }
    });
  } else {
    console.warn("⚠️ Cloudinary widget not available");
  }
}

// Event listeners
function setupEventListeners() {
  // Navigation
  if (elements.backBtn) {
    elements.backBtn.addEventListener('click', () => {
      window.location.href = 'customer-dashboard.html';
    });
  }

  // Profile actions
  if (elements.editProfileBtn) {
    elements.editProfileBtn.addEventListener('click', enableEditMode);
  }

  if (elements.saveProfileBtn) {
    elements.saveProfileBtn.addEventListener('click', saveProfile);
  }

  if (elements.changePasswordBtn) {
    elements.changePasswordBtn.addEventListener('click', showPasswordChange);
  }

  if (elements.cancelPasswordBtn) {
    elements.cancelPasswordBtn.addEventListener('click', hidePasswordChange);
  }

  if (elements.submitPasswordBtn) {
    elements.submitPasswordBtn.addEventListener('click', changePassword);
  }

  // Image upload
  if (elements.uploadBtn) {
    elements.uploadBtn.addEventListener('click', handleUploadClick);
  }

  if (elements.uploadOverlay) {
    elements.uploadOverlay.addEventListener('click', handleUploadClick);
  }

  // Profile pic container accessibility
  if (elements.profileAvatar?.parentElement) {
    elements.profileAvatar.parentElement.addEventListener('keypress', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && editMode) {
        handleUploadClick();
        e.preventDefault();
      }
    });
  }

  // Password visibility toggles
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', function() {
      togglePasswordVisibility(this);
    });
    
    // Add keyboard support
    toggle.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        togglePasswordVisibility(this);
        e.preventDefault();
      }
    });
  });

  // Real-time validation
  setupFieldValidation();
}

// Setup field validation
function setupFieldValidation() {
  const validatedFields = ['user-name', 'user-phone', 'user-age'];
  validatedFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('blur', (e) => {
        if (editMode) validateField(e.target);
      });
    }
  });
}

// Field validation
function validateField(field) {
  const fieldName = field.id.replace('user-', '');
  const value = field.value.trim();
  
  let isValid = true;
  let errorMessage = '';
  
  switch (fieldName) {
    case 'name':
      if (!value) {
        isValid = false;
        errorMessage = 'Name is required';
      } else if (value.length < 2) {
        isValid = false;
        errorMessage = 'Name must be at least 2 characters';
      }
      break;
      
    case 'phone':
      if (value && !/^\+?\d{7,15}$/.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number';
      }
      break;
      
    case 'age':
      if (value) {
        const age = parseInt(value);
        if (isNaN(age) || age < 18 || age > 100) {
          isValid = false;
          errorMessage = 'Age must be between 18 and 100';
        }
      }
      break;
  }
  
  // Update UI
  const fieldContainer = field.parentElement;
  if (fieldContainer) {
    if (!isValid) {
      fieldContainer.classList.add('error');
      showFieldError(fieldName, errorMessage);
    } else {
      fieldContainer.classList.remove('error');
      clearFieldError(fieldName);
    }
  }
  
  return isValid;
}

// Show field error
function showFieldError(fieldName, message) {
  const errorId = `${fieldName}-error`;
  let errorElement = document.getElementById(errorId);
  
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = 'field-error status-message error';
    const field = document.getElementById(`user-${fieldName}`);
    if (field) {
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
  }
  
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

// Clear field error
function clearFieldError(fieldName) {
  const errorElement = document.getElementById(`${fieldName}-error`);
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

// Toggle password visibility
function togglePasswordVisibility(toggleElement) {
  const input = toggleElement.previousElementSibling;
  const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
  input.setAttribute('type', type);
  toggleElement.classList.toggle('fa-eye-slash');
  
  // Update aria-label for accessibility
  const isVisible = type === 'text';
  toggleElement.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
}

// Handle upload click
function handleUploadClick() {
  if (!editMode) {
    showMessage(elements.uploadStatus, 'Please click "Edit Profile" to change your photo', 'info');
    return;
  }
  
  if (cloudinaryWidget) {
    cloudinaryWidget.open();
  } else {
    showMessage(elements.uploadStatus, 'Upload service not available', 'error');
  }
}

// Show password change section
function showPasswordChange() {
  if (elements.passwordChangeBox) {
    elements.passwordChangeBox.style.display = 'block';
    
    // Check if user is Google-only
    const user = auth.currentUser;
    if (user) {
      const isGoogleOnly = user.providerData.some(provider => 
        provider.providerId === 'google.com'
      ) && !user.providerData.some(provider => 
        provider.providerId === 'password'
      );
      
      if (isGoogleOnly) {
        showMessage(
          elements.passwordChangeMessage, 
          '🔐 Your account uses Google Sign-in. Password management is handled by Google.', 
          'info'
        );
        return;
      }
    }
    
    // Focus on first password field
    setTimeout(() => {
      const currentPassword = document.getElementById('current-password');
      if (currentPassword) currentPassword.focus();
    }, 100);
  }
}

// Hide password change section
function hidePasswordChange() {
  if (elements.passwordChangeBox) {
    elements.passwordChangeBox.style.display = 'none';
    clearPasswordFields();
  }
}

// Loading state management
function setLoadingState(isLoading) {
  if (isLoading) {
    // Show skeleton and hide content
    if (elements.profileSkeleton) elements.profileSkeleton.classList.add('active');
    if (elements.profileContent) elements.profileContent.style.display = 'none';
    if (elements.loadingOverlay) elements.loadingOverlay.classList.add('active');
  } else {
    // Hide skeleton and show content with animation
    setTimeout(() => {
      if (elements.profileSkeleton) elements.profileSkeleton.classList.remove('active');
      if (elements.profileContent) {
        elements.profileContent.style.display = 'block';
        setTimeout(() => {
          elements.profileContent.classList.add('loaded');
        }, 50);
      }
      if (elements.loadingOverlay) elements.loadingOverlay.classList.remove('active');
    }, 500);
  }
}

// Auth check
function checkAuthState() {
  setLoadingState(true);
  
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log("❌ No user found, redirecting to login...");
      window.location.href = 'index.html';
      return;
    }

    try {
      // Use 'users' collection
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      // Create user document if it doesn't exist
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          profileImage: user.photoURL || 'assets/profile-placeholder.png',
          userType: 'customer',
          createdAt: serverTimestamp(),
          phone: '',
          address: '',
          gender: '',
          age: null,
          preferences: {
            preferredCategory: '',
            deliveryTime: ''
          }
        });
      } else {
        
        // Check if user is actually a farmer
        const existingData = docSnap.data();
        if (existingData.userType === 'farmer') {
          showMessage(
            elements.profileUpdateMessage, 
            '⚠️ You are registered as a farmer. Redirecting to farmer profile...', 
            'warning'
          );
          setTimeout(() => {
            window.location.href = 'profile.html';
          }, 2000);
          return;
        }
        
        // Ensure userType is set to customer if missing
        if (!existingData.userType) {
          await updateDoc(userRef, {
            userType: 'customer'
          });
        }
      }

      // Real-time updates
      onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            userData = docSnap.data();
            updateProfileUI(userData);
          }
          setLoadingState(false);
        },
        (error) => {
          console.error("❌ Error fetching user data:", error);
          showMessage(elements.profileUpdateMessage, 'Error loading profile data: ' + error.message, 'error');
          setLoadingState(false);
        }
      );

    } catch (error) {
      console.error("❌ Error in profile setup:", error);
      showMessage(elements.profileUpdateMessage, 'Error setting up profile: ' + error.message, 'error');
      setLoadingState(false);
    }
  });
}

// UI update
function updateProfileUI(data) {
  
  // Safe updates with null checks
  if (elements.profileEmail) elements.profileEmail.textContent = data.email || '';
  if (elements.profileName) elements.profileName.value = data.name || '';
  if (elements.profilePhone) elements.profilePhone.value = data.phone || '';
  if (elements.profileAddress) elements.profileAddress.value = data.address || '';
  if (elements.profileGender) elements.profileGender.value = data.gender || '';
  if (elements.profileAge) {
    elements.profileAge.value = data.age ? data.age.toString() : '';
  }
  if (elements.profileAvatar) {
    elements.profileAvatar.src = data.profileImage || 'assets/profile-placeholder.png';
  }
  
  // Ensure all fields are disabled initially
  disableAllFields();
}

// Enable edit mode
function enableEditMode() {
  if (editMode) return;
  
  editMode = true;
  
  const inputs = [
    elements.profileName, 
    elements.profilePhone, 
    elements.profileAddress, 
    elements.profileGender, 
    elements.profileAge
  ];
  
  // Enable all form fields
  inputs.forEach(input => { 
    if (input) {
      input.disabled = false;
      // Clear validation errors
      const fieldName = input.id.replace('user-', '');
      clearFieldError(fieldName);
      if (input.parentElement) {
        input.parentElement.classList.remove('error');
      }
    }
  });
  
  // Update button visibility
  if (elements.editProfileBtn && elements.saveProfileBtn) {
    elements.editProfileBtn.style.display = 'none';
    elements.saveProfileBtn.style.display = 'block';
  }
  
  // Clear any previous messages
  if (elements.profileUpdateMessage) {
    elements.profileUpdateMessage.textContent = '';
    elements.profileUpdateMessage.className = 'status-message';
  }
}

// Disable all fields (read-only mode)
function disableAllFields() {
  editMode = false;
  
  const inputs = [
    elements.profileName, 
    elements.profilePhone, 
    elements.profileAddress, 
    elements.profileGender, 
    elements.profileAge
  ];
  
  inputs.forEach(input => { 
    if (input) input.disabled = true;
  });
  
  // Update button visibility
  if (elements.editProfileBtn && elements.saveProfileBtn) {
    elements.editProfileBtn.style.display = 'block';
    elements.saveProfileBtn.style.display = 'none';
  }
}

// Save profile
async function saveProfile(e) {
  if (e) e.preventDefault();
  
  const user = auth.currentUser;
  if (!user) return;


  // Safely get values with null checks
  const updates = {
    name: elements.profileName ? elements.profileName.value.trim() : '',
    phone: elements.profilePhone ? elements.profilePhone.value.trim() : '',
    address: elements.profileAddress ? elements.profileAddress.value.trim() : '',
    gender: elements.profileGender ? elements.profileGender.value : '',
    age: elements.profileAge && elements.profileAge.value ? parseInt(elements.profileAge.value) : null,
    userType: 'customer',
    lastUpdated: serverTimestamp()
  };


  // Validation
  if (!updates.name) {
    showMessage(elements.profileUpdateMessage, 'Name is required', 'error');
    return;
  }

  if (updates.phone && !/^\+?\d{7,15}$/.test(updates.phone)) {
    showMessage(elements.profileUpdateMessage, 'Please enter a valid phone number', 'error');
    return;
  }

  if (updates.age && (updates.age < 18 || updates.age > 100)) {
    showMessage(elements.profileUpdateMessage, 'Age must be between 18 and 100', 'error');
    return;
  }

  try {
    // Update save button state
    if (elements.saveProfileBtn) {
      elements.saveProfileBtn.disabled = true;
      elements.saveProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    // Update Firebase Auth profile
    if (updates.name) {
      await updateProfile(user, { displayName: updates.name });
    }
    
    // Update Firestore
    await updateDoc(doc(db, 'users', user.uid), updates);
    
    // Return to read-only mode
    disableAllFields();
    showMessage(elements.profileUpdateMessage, 'Profile updated successfully!', 'success');
    showToast('Profile updated successfully!', 'success');
    
  } catch (error) {
    console.error('❌ Profile update error:', error);
    showMessage(elements.profileUpdateMessage, 'Failed to update profile: ' + error.message, 'error');
    showToast('Failed to update profile', 'error');
  } finally {
    // Re-enable save button
    if (elements.saveProfileBtn) {
      elements.saveProfileBtn.disabled = false;
      elements.saveProfileBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  }
}

// Change password
async function changePassword() {
  const user = auth.currentUser;
  if (!user) return;

  const currentPassword = document.getElementById('current-password')?.value || '';
  const newPassword = document.getElementById('new-password')?.value || '';
  const confirmPassword = document.getElementById('confirm-password')?.value || '';

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    showMessage(elements.passwordChangeMessage, 'All fields are required', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showMessage(elements.passwordChangeMessage, 'New passwords do not match', 'error');
    return;
  }
  
  if (newPassword.length < 8) {
    showMessage(elements.passwordChangeMessage, 'Password must be at least 8 characters', 'error');
    return;
  }
  
  if (!/\d/.test(newPassword)) {
    showMessage(elements.passwordChangeMessage, 'Password must contain at least one number', 'error');
    return;
  }

  try {
    // Update button state
    if (elements.submitPasswordBtn) {
      elements.submitPasswordBtn.disabled = true;
      elements.submitPasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    }
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    
    showMessage(elements.passwordChangeMessage, 'Password updated successfully!', 'success');
    showToast('Password updated successfully!', 'success');
    clearPasswordFields();
    
    setTimeout(() => { 
      hidePasswordChange();
    }, 1500);
    
  } catch (error) {
    console.error('❌ Password change error:', error);
    let errorMessage = 'Password change failed: ' + error.message;
    
    // User-friendly error messages
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Current password is incorrect';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'New password is too weak';
    } else if (error.code === 'auth/invalid-login-credentials') {
      errorMessage = 'You signed in with Google. Password management is handled by Google.';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'For security, please sign out and sign in again before changing password';
    }
    
    showMessage(elements.passwordChangeMessage, errorMessage, 'error');
    showToast(errorMessage, 'error');
  } finally {
    // Re-enable button
    if (elements.submitPasswordBtn) {
      elements.submitPasswordBtn.disabled = false;
      elements.submitPasswordBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
    }
  }
}

// Image upload
function handleImageUpload(imageUrl) {
  const user = auth.currentUser;
  if (!user) return;

  if (elements.uploadStatus) {
    elements.uploadStatus.textContent = 'Uploading...';
    elements.uploadStatus.className = 'upload-status';
  }
  
  updateDoc(doc(db, 'users', user.uid), {
    profileImage: imageUrl,
    lastUpdated: serverTimestamp()
  })
  .then(() => {
    if (elements.uploadStatus) {
      elements.uploadStatus.textContent = 'Profile photo updated!';
      elements.uploadStatus.className = 'upload-status';
    }
    if (elements.profileAvatar) elements.profileAvatar.src = imageUrl;
    
    // Also update auth profile
    updateProfile(user, { photoURL: imageUrl });
    
    showToast('Profile photo updated!', 'success');
    
    setTimeout(() => { 
      if (elements.uploadStatus) elements.uploadStatus.textContent = ''; 
    }, 3000);
  })
  .catch(error => {
    console.error('❌ Image upload error:', error);
    if (elements.uploadStatus) {
      elements.uploadStatus.textContent = 'Upload failed: ' + error.message;
      elements.uploadStatus.className = 'upload-status';
    }
    showToast('Upload failed', 'error');
  });
}

// Helpers
function showMessage(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.className = `status-message ${type}`;
  element.style.display = 'block';
  
  // Auto-hide success messages
  if (type === 'success') {
    setTimeout(() => {
      element.textContent = '';
      element.className = 'status-message';
      element.style.display = 'none';
    }, 5000);
  }
}

function showToast(message, type = 'success') {
  if (!elements.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = document.createElement('i');
  icon.className = type === 'success' ? 'fas fa-check-circle' :
                   type === 'error' ? 'fas fa-exclamation-circle' :
                   type === 'warning' ? 'fas fa-exclamation-triangle' :
                   'fas fa-info-circle';

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  elements.toastContainer.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function clearPasswordFields() {
  const current = document.getElementById('current-password');
  const next = document.getElementById('new-password');
  const confirm = document.getElementById('confirm-password');

  if (current) current.value = '';
  if (next) next.value = '';
  if (confirm) confirm.value = '';

  if (elements.passwordChangeMessage) {
    elements.passwordChangeMessage.textContent = '';
    elements.passwordChangeMessage.className = 'status-message';
    elements.passwordChangeMessage.style.display = 'none';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);