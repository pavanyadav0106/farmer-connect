import { auth, db } from '../config.js';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";



/* =========================
   DOM ELEMENTS
   ========================= */
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
  uploadStatus: document.getElementById('upload-status'),

  skeleton: document.getElementById('profile-skeleton'),
  toastContainer: document.getElementById('toast-container')
};

/* =========================
   SKELETON LOADER
   ========================= */
// Only toggle skeleton visibility; profile content remains mounted.
function setProfileLoading(isLoading) {
  if (!elements.skeleton) return;
  elements.skeleton.classList.toggle('active', isLoading);
}

/* =========================
   TOAST HELPER
   ========================= */
function showToast(message, type = 'success') {
  if (!elements.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = document.createElement('i');
  icon.className = type === 'success'
    ? 'fas fa-check-circle'
    : 'fas fa-exclamation-circle';

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  elements.toastContainer.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

/* =========================
   CLOUDINARY WIDGET
   ========================= */
let cloudinaryWidget = null;

if (window.cloudinary && typeof window.cloudinary.createUploadWidget === 'function') {
  cloudinaryWidget = window.cloudinary.createUploadWidget({
    cloudName: 'dtiast5hl',
    uploadPreset: 'farmerconnect',
    cropping: true,
    croppingAspectRatio: 1,
    croppingShowBackButton: true,
    folder: 'farmer_profile_photos'
  }, (error, result) => {
    if (!error && result && result.event === "success") {
      handleImageUpload(result.info.secure_url);
    } else if (error) {
      console.error("Cloudinary error:", error);
      showToast('Image upload failed', 'error');
    }
  });
} else {
  console.warn("Cloudinary widget not available");
}

/* =========================
   INIT
   ========================= */
function init() {
  setProfileLoading(true);
  setupEventListeners();
  checkAuthState();
}

/* =========================
   EVENTS
   ========================= */
function setupEventListeners() {
  if (elements.backBtn) {
    elements.backBtn.addEventListener('click', () => {
      window.location.href = 'farmer4.html';
    });
  }

  elements.editProfileBtn?.addEventListener('click', toggleEditMode);

  // Handle form submit for save profile
  elements.profileForm?.addEventListener('submit', saveProfile);

  elements.changePasswordBtn?.addEventListener('click', () => {
    elements.passwordChangeBox.style.display = 'block';
  });

  elements.cancelPasswordBtn?.addEventListener('click', () => {
    elements.passwordChangeBox.style.display = 'none';
    clearPasswordFields();
  });

  elements.submitPasswordBtn?.addEventListener('click', changePassword);

  const openWidget = () => {
    if (cloudinaryWidget) {
      cloudinaryWidget.open();
    } else {
      showToast('Upload service not available', 'error');
    }
  };

  elements.uploadBtn?.addEventListener('click', openWidget);
  elements.uploadOverlay?.addEventListener('click', openWidget);

  // Toggle password visibility
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', function () {
      const input = this.previousElementSibling;
      if (!input) return;
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      this.classList.toggle('fa-eye-slash');
    });
  });
}

/* =========================
   AUTH & PROFILE LOADING
   ========================= */
function checkAuthState() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'main.html';
      return;
    }

    // Show basic info from Firebase Auth immediately
    elements.profileEmail.textContent = user.email || '';
    elements.profileName.value = user.displayName || '';
    elements.profileAvatar.src = user.photoURL || "assets/profile-placeholder.png";

    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      // Create user document if it doesn't exist
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          profileImage: user.photoURL || "assets/profile-placeholder.png",
          createdAt: serverTimestamp()
        });
      }

      // Real-time updates
      onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            updateProfileUI(data);
          }
          setProfileLoading(false);
        },
        (error) => {
          console.error("Snapshot error:", error);
          setProfileLoading(false);
          showToast('Failed to load profile', 'error');
        }
      );
    } catch (error) {
      console.error("Profile load error:", error);
      setProfileLoading(false);
      showToast('Failed to load profile', 'error');
    }
  });
}

/* =========================
   UI UPDATE (SAFE MERGE)
   ========================= */
function updateProfileUI(data) {
  const user = auth.currentUser;

  // Name
  if (data.name) {
    elements.profileName.value = data.name;
  } else if (!elements.profileName.value && user?.displayName) {
    elements.profileName.value = user.displayName;
  }

  // Phone, address, gender, age (only update if key exists)
  if ('phone' in data) elements.profilePhone.value = data.phone || '';
  if ('address' in data) elements.profileAddress.value = data.address || '';
  if ('gender' in data) elements.profileGender.value = data.gender || '';
  if ('age' in data && data.age != null) elements.profileAge.value = data.age;

  // Avatar
  if (data.profileImage) {
    elements.profileAvatar.src = data.profileImage;
  } else if (user?.photoURL) {
    elements.profileAvatar.src = user.photoURL;
  } else {
    elements.profileAvatar.src = 'assets/profile-placeholder.png';
  }
}

/* =========================
   EDIT MODE
   ========================= */
function toggleEditMode() {
  const isEditModeNow = elements.editProfileBtn.style.display === 'none';

  const editableFields = [
    elements.profileName,
    elements.profilePhone,
    elements.profileAddress,
    elements.profileGender,
    elements.profileAge
  ];

  editableFields.forEach(input => {
    if (input) input.disabled = isEditModeNow;
  });

  elements.editProfileBtn.style.display = isEditModeNow ? 'block' : 'none';
  elements.saveProfileBtn.style.display = isEditModeNow ? 'none' : 'block';
  elements.profileUpdateMessage.textContent = '';
}

/* =========================
   SAVE PROFILE
   ========================= */
async function saveProfile(e) {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  const name = elements.profileName.value.trim();
  const phone = elements.profilePhone.value.trim();
  const address = elements.profileAddress.value.trim();
  const gender = elements.profileGender.value;
  const ageValue = elements.profileAge.value;

  // Basic validations
  if (!name) {
    showMessage(elements.profileUpdateMessage, 'Name cannot be empty', 'error');
    return;
  }

  if (phone && !/^\+?\d{7,15}$/.test(phone)) {
    showMessage(elements.profileUpdateMessage, 'Invalid phone number format', 'error');
    return;
  }

  if (ageValue) {
    const age = parseInt(ageValue, 10);
    if (Number.isNaN(age) || age < 18 || age > 100) {
      showMessage(elements.profileUpdateMessage, 'Age must be between 18 and 100', 'error');
      return;
    }
  }

  const updates = {
    name,
    phone: phone || '',
    address: address || '',
    gender: gender || '',
    age: ageValue ? parseInt(ageValue, 10) : null,
    lastUpdated: serverTimestamp()
  };

  try {
    await updateDoc(doc(db, 'users', user.uid), updates);
    toggleEditMode();
    showMessage(elements.profileUpdateMessage, 'Profile updated successfully!', 'success');
  } catch (error) {
    console.error("Update profile error:", error);
    showMessage(
      elements.profileUpdateMessage,
      'Failed to update profile: ' + error.message,
      'error'
    );
  }
}

/* =========================
   PASSWORD CHANGE
   ========================= */
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
    console.error("Password change error:", error);
    showMessage(
      elements.passwordChangeMessage,
      'Password change failed: ' + error.message,
      'error'
    );
  }
}

/* =========================
   IMAGE UPLOAD
   ========================= */
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
      showToast('Profile photo updated!', 'success');
      setTimeout(() => { elements.uploadStatus.textContent = ''; }, 3000);
    })
    .catch(error => {
      console.error("Image upload save error:", error);
      elements.uploadStatus.textContent = 'Upload failed: ' + error.message;
      showToast('Upload failed', 'error');
    });
}

/* =========================
   HELPERS
   ========================= */
function showMessage(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.className = 'status-message ' + type;

  showToast(message, type);

  setTimeout(() => {
    element.textContent = '';
    element.className = 'status-message';
  }, 5000);
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
  }
}

/* =========================
   START APP
   ========================= */
init();
