import { auth, db } from '../config.js';
import {
  doc, getDoc, updateDoc, setDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  EmailAuthProvider, reauthenticateWithCredential, updatePassword, onAuthStateChanged
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
  uploadBtn: document.getElementById('upload-btn'),
  uploadOverlay: document.getElementById('upload-overlay'),

  profileForm: document.getElementById('profile-form'),
  passwordChangeBox: document.getElementById('password-change-box'),

  profileUpdateMessage: document.getElementById('profile-update-message'),
  passwordChangeMessage: document.getElementById('password-change-message'),
  uploadStatus: document.getElementById('upload-status')
};

// Cloudinary
const cloudinaryWidget = cloudinary.createUploadWidget({
  cloudName: 'dtiast5hl',
  uploadPreset: 'farmerconnect',
  cropping: true,
  croppingAspectRatio: 1,
  croppingShowBackButton: true,
  folder: 'farmer_profile_photos'
}, (error, result) => {
  if (!error && result && result.event === "success") {
    handleImageUpload(result.info.secure_url);
  }
});

// Init
function init() {
  setupEventListeners();
  checkAuthState();
}

// Events
function setupEventListeners() {
  elements.backBtn.addEventListener('click', () => {
    window.location.href = 'farmer4.html';
  });
  elements.editProfileBtn.addEventListener('click', toggleEditMode);
  elements.saveProfileBtn.addEventListener('click', saveProfile);
  elements.changePasswordBtn.addEventListener('click', () => {
    elements.passwordChangeBox.style.display = 'block';
  });
  elements.cancelPasswordBtn.addEventListener('click', () => {
    elements.passwordChangeBox.style.display = 'none';
    clearPasswordFields();
  });
  elements.submitPasswordBtn.addEventListener('click', changePassword);
  elements.uploadBtn.addEventListener('click', () => cloudinaryWidget.open());
  elements.uploadOverlay.addEventListener('click', () => cloudinaryWidget.open());

  // Toggle password visibility
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', function () {
      const input = this.previousElementSibling;
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      this.classList.toggle('fa-eye-slash');
    });
  });
}

// Auth
function checkAuthState() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    // Show email + Google name/photo right away
    elements.profileEmail.textContent = user.email;
    elements.profileName.value = user.displayName || "";
    elements.profileAvatar.src = user.photoURL || "assets/profile-placeholder.png";

    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "",
        profileImage: user.photoURL || "assets/profile-placeholder.png",
        createdAt: serverTimestamp()
      });
    }

    // Realtime updates
    onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        updateProfileUI(data);
      }
    });
  });
}

// UI Update
function updateProfileUI(data) {
  const user = auth.currentUser;

  elements.profileName.value = data.name || (user ? user.displayName : "") || "";
  elements.profilePhone.value = data.phone || "";
  elements.profileAddress.value = data.address || "";
  elements.profileGender.value = data.gender || "";
  elements.profileAge.value = data.age || "";
  elements.profileAvatar.src =
    data.profileImage || (user ? user.photoURL : "") || "assets/profile-placeholder.png";
}

// Edit mode
function toggleEditMode() {
  const isEditMode = elements.editProfileBtn.style.display === 'none';
  [elements.profileName, elements.profilePhone, elements.profileAddress, elements.profileGender, elements.profileAge]
    .forEach(input => input.disabled = isEditMode);

  elements.editProfileBtn.style.display = isEditMode ? 'block' : 'none';
  elements.saveProfileBtn.style.display = isEditMode ? 'none' : 'block';
  elements.profileUpdateMessage.textContent = '';
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
    await updateDoc(doc(db, 'users', user.uid), updates);
    toggleEditMode();
    showMessage(elements.profileUpdateMessage, 'Profile updated successfully!', 'success');
  } catch (error) {
    showMessage(elements.profileUpdateMessage, 'Failed to update profile: ' + error.message, 'error');
  }
}

// Password
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
    setTimeout(() => {
      elements.passwordChangeBox.style.display = 'none';
    }, 1500);
  } catch (error) {
    showMessage(elements.passwordChangeMessage, 'Password change failed: ' + error.message, 'error');
  }
}

// Image upload
function handleImageUpload(imageUrl) {
  const user = auth.currentUser;
  if (!user) return;

  elements.uploadStatus.textContent = 'Uploading...';

  updateDoc(doc(db, 'users', user.uid), {
    profileImage: imageUrl,
    lastUpdated: serverTimestamp()
  })
    .then(() => {
      elements.uploadStatus.textContent = 'Profile photo updated!';
      elements.profileAvatar.src = imageUrl;
      setTimeout(() => { elements.uploadStatus.textContent = ''; }, 3000);
    })
    .catch(error => {
      elements.uploadStatus.textContent = 'Upload failed: ' + error.message;
    });
}

// Helpers
function showMessage(element, message, type) {
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
  elements.passwordChangeMessage.textContent = '';
}

// Init app
init();
