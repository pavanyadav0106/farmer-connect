// customerProfile.js

import { auth, db } from '../config.js';
import {
  doc, getDoc, updateDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  EmailAuthProvider, reauthenticateWithCredential, updatePassword, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// DOM Elements
const elements = {
  profileAvatar: document.getElementById('profile-photo'),
  profileEmail: document.getElementById('user-email'),
  profileName: document.getElementById('user-name'),
  profilePhone: document.getElementById('user-phone'),
  profileAddress: document.getElementById('user-location'),
  profileGender: document.getElementById('user-gender'),
  profileAge: document.getElementById('user-age'),
  
  editProfileBtn: document.getElementById('edit-profile'),
  saveProfileBtn: document.getElementById('save-profile'),
  changePasswordBtn: document.getElementById('change-password'),
  cancelPasswordBtn: document.getElementById('cancel-password-change'),
  submitPasswordBtn: document.getElementById('submit-password-change'),
  backBtn: document.getElementById('backBtn'),
  
  profileForm: document.getElementById('profile-form'),
  passwordChangeBox: document.getElementById('password-change-box'),
  
  profileUpdateMessage: document.getElementById('profile-update-message'),
  passwordChangeMessage: document.getElementById('password-change-message'),
  
  uploadBtn: document.getElementById('upload-btn'),
  photoUpload: document.getElementById('photo-upload'),
  uploadStatus: document.getElementById('upload-status'),
  uploadOverlay: document.getElementById('upload-overlay')
};

// State
let userData = {};
let editMode = false;

// Cloudinary upload widget
const cloudinaryWidget = cloudinary.createUploadWidget({
  cloudName: 'dtiast5hl',
  uploadPreset: 'farmerconnect',
  cropping: true,
  croppingAspectRatio: 1,
  croppingShowBackButton: true,
  folder: 'farmer-connect/profiles'
}, (error, result) => {
  if (!error && result && result.event === "success") {
    handleImageUpload(result.info.secure_url);
  }
});

// Initialize
function init() {
  setupEventListeners();
  checkAuthState();
}

// Event listeners
function setupEventListeners() {
  if (elements.backBtn) {
    elements.backBtn.addEventListener('click', () => {
      window.location.href = 'customer-dashboard.html';
    });
  }

  if (elements.editProfileBtn) {
    elements.editProfileBtn.addEventListener('click', toggleEditMode);
  }

  if (elements.saveProfileBtn) {
    elements.saveProfileBtn.addEventListener('click', saveProfile);
  }

  if (elements.changePasswordBtn) {
    elements.changePasswordBtn.addEventListener('click', () => {
      elements.passwordChangeBox.style.display = 'block';
    });
  }

  if (elements.cancelPasswordBtn) {
    elements.cancelPasswordBtn.addEventListener('click', () => {
      elements.passwordChangeBox.style.display = 'none';
      clearPasswordFields();
    });
  }

  if (elements.submitPasswordBtn) {
    elements.submitPasswordBtn.addEventListener('click', changePassword);
  }

  if (elements.uploadBtn) {
    elements.uploadBtn.addEventListener('click', () => {
      cloudinaryWidget.open();
    });
  }

  if (elements.uploadOverlay) {
    elements.uploadOverlay.addEventListener('click', () => {
      cloudinaryWidget.open();
    });
  }

  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', function() {
      const input = this.previousElementSibling;
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      this.classList.toggle('fa-eye-slash');
    });
  });
}

// ✅ Auth check
function checkAuthState() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    console.log("Auth User:", user);

    // Always from Auth
    if (elements.profileEmail) {
      elements.profileEmail.textContent = user.email;
    }
    if (elements.profileName) {
      elements.profileName.value = user.displayName || '';
    }
    if (elements.profileAvatar) {
      elements.profileAvatar.src = user.photoURL || 'assets/profile-placeholder.png';
    }

    // Firestore user data
    const userRef = doc(db, 'users', user.uid);
    onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        userData = docSnap.data();
        updateProfileUI(userData);

        // Override only if Firestore has these
        if (userData.name) elements.profileName.value = userData.name;
        if (userData.profileImage) elements.profileAvatar.src = userData.profileImage;
      }
    });
  });
}

// UI update
function updateProfileUI(data) {
  if (elements.profileName) elements.profileName.value = data.name || elements.profileName.value;
  if (elements.profilePhone) elements.profilePhone.value = data.phone || '';
  if (elements.profileAddress) elements.profileAddress.value = data.address || '';
  if (elements.profileGender) elements.profileGender.value = data.gender || '';
  if (elements.profileAge) elements.profileAge.value = data.age || '';
  if (elements.profileAvatar) {
    elements.profileAvatar.src = data.profileImage || elements.profileAvatar.src;
  }
}

// Toggle edit
function toggleEditMode() {
  editMode = !editMode;
  const inputs = [elements.profileName, elements.profilePhone, elements.profileAddress, elements.profileGender, elements.profileAge];
  inputs.forEach(input => { if (input) input.disabled = !editMode; });
  if (elements.editProfileBtn && elements.saveProfileBtn) {
    elements.editProfileBtn.style.display = editMode ? 'none' : 'block';
    elements.saveProfileBtn.style.display = editMode ? 'block' : 'none';
  }
  if (elements.profileUpdateMessage) elements.profileUpdateMessage.textContent = '';
}

// Save profile
async function saveProfile(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const updates = {
    name: elements.profileName.value.trim(),
    phone: elements.profilePhone.value.trim(),
    address: elements.profileAddress.value.trim(),
    gender: elements.profileGender.value,
    age: elements.profileAge.value ? parseInt(elements.profileAge.value) : null,
    lastUpdated: serverTimestamp()
  };

  if (updates.phone && !/^\+?\d{7,15}$/.test(updates.phone)) {
    showMessage(elements.profileUpdateMessage, 'Invalid phone number format', 'error');
    return;
  }

  try {
    if (updates.name) {
      await updateProfile(user, { displayName: updates.name });
    }
    await updateDoc(doc(db, 'users', user.uid), updates);
    toggleEditMode();
    showMessage(elements.profileUpdateMessage, 'Profile updated successfully!', 'success');
  } catch (error) {
    showMessage(elements.profileUpdateMessage, 'Failed to update profile: ' + error.message, 'error');
  }
}

// Change password
async function changePassword() {
  const user = auth.currentUser;
  if (!user) return;

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

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
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    showMessage(elements.passwordChangeMessage, 'Password updated successfully!', 'success');
    clearPasswordFields();
    setTimeout(() => { elements.passwordChangeBox.style.display = 'none'; }, 1500);
  } catch (error) {
    showMessage(elements.passwordChangeMessage, 'Password change failed: ' + error.message, 'error');
  }
}

// Image upload
function handleImageUpload(imageUrl) {
  const user = auth.currentUser;
  if (!user) return;

  if (elements.uploadStatus) elements.uploadStatus.textContent = 'Uploading...';
  updateDoc(doc(db, 'users', user.uid), {
    profileImage: imageUrl,
    lastUpdated: serverTimestamp()
  })
  .then(() => {
    if (elements.uploadStatus) elements.uploadStatus.textContent = 'Profile photo updated!';
    if (elements.profileAvatar) elements.profileAvatar.src = imageUrl;
    setTimeout(() => { if (elements.uploadStatus) elements.uploadStatus.textContent = ''; }, 3000);
  })
  .catch(error => {
    if (elements.uploadStatus) elements.uploadStatus.textContent = 'Upload failed: ' + error.message;
  });
}

// Helpers
function showMessage(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.className = 'status-message ' + type;
  setTimeout(() => {
    element.textContent = '';
    element.className = 'status-message';
  }, 5000);
}

function clearPasswordFields() {
  document.getElementById('current-password').value = '';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
  if (elements.passwordChangeMessage) elements.passwordChangeMessage.textContent = '';
}

// Init
init();
