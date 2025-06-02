import { auth, db } from '../config.js';
import {
  doc, getDoc, updateDoc, setDoc, serverTimestamp ,deleteField , onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  EmailAuthProvider, reauthenticateWithCredential, updatePassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dtiast5hl',
  uploadPreset: 'farmerconnect',
  folder: 'farmer-connect/profiles',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['jpg', 'png', 'jpeg', 'gif']
};

// DOM Elements
const elements = {
  profilePhoto: document.getElementById('profile-photo'),
  photoUpload: document.getElementById('photo-upload'),
  uploadBtn: document.getElementById('upload-btn'),
  userEmail: document.getElementById('user-email'),
  userName: document.getElementById('user-name'),
  userPhone: document.getElementById('user-phone'),
  userLocation: document.getElementById('user-location'),
  userGender: document.getElementById('user-gender'),
  userAge: document.getElementById('user-age'),
  saveProfileBtn: document.getElementById('save-profile'),
  changePasswordBtn: document.getElementById('change-password'),
  editProfileBtn: document.getElementById('edit-profile'),
  changePasswordBox: document.getElementById('password-change-box'),
  currentPassword: document.getElementById('current-password'),
  newPassword: document.getElementById('new-password'),
  confirmPassword: document.getElementById('confirm-password'),
  submitPasswordChange: document.getElementById('submit-password-change'),
  cancelPasswordChange: document.getElementById('cancel-password-change'),
  passwordChangeMessage: document.getElementById('password-change-message'),
  profileMessage: document.getElementById('profile-update-message'),
  backBtn: document.getElementById('backBtn')
};

let isEditing = false;
let uploadedImageUrl = null;

// Utility
const showMessage = (type, message, target = 'profile') => {
  const el = target === 'profile' ? elements.profileMessage : elements.passwordChangeMessage;
  el.textContent = message;
  el.className = `status-message ${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
};

const validatePhone = (phone) => /^\d{10}$/.test(phone);
const validatePassword = (pwd) => pwd.length >= 8 && /\d/.test(pwd);

// Auth listener
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  console.log('User logged in:', user.email);

  elements.userEmail.textContent = user.email;
  const userRef = doc(db, "users", user.uid);

  onSnapshot(userRef, (docSnap) => {
    console.log('Firestore snapshot update:', docSnap.exists());
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('User data received:', data);
      if (!isEditing) { // Only update UI if not editing
        elements.userName.value = data.name || '';
        elements.userPhone.value = data.phone || '';
        elements.userLocation.value = data.location || '';
        elements.userGender.value = data.gender || '';
        elements.userAge.value = data.age || '';
        elements.profilePhoto.src = data.profileImage || 'assets/profile-placeholder.png';
        uploadedImageUrl = data.profileImage || null;
      }
    }
  });
});



// Cloudinary Widget
const cloudinaryWidget = cloudinary.createUploadWidget({
  cloudName: CLOUDINARY_CONFIG.cloudName,
  uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
  folder: CLOUDINARY_CONFIG.folder,
  cropping: true,
  maxImageFileSize: CLOUDINARY_CONFIG.maxFileSize,
  clientAllowedFormats: CLOUDINARY_CONFIG.allowedFormats
}, async (error, result) => {
  if (!error && result && result.event === "success") {
    const imageUrl = result.info.secure_url;
    elements.profilePhoto.src = imageUrl;
    uploadedImageUrl = imageUrl;

    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, "users", user.uid), {
        profileImage: imageUrl,
        lastUpdated: serverTimestamp()
      });
      showMessage('success', 'Profile photo updated!');
    }
  } else if (error) {
    showMessage('error', 'Image upload failed.');
  }
});

// Event Listeners
elements.uploadBtn.addEventListener('click', () => cloudinaryWidget.open());
elements.photoUpload.addEventListener('change', handlePhotoUpload);
elements.editProfileBtn.addEventListener('click', toggleEditMode);
elements.saveProfileBtn.addEventListener('click', saveProfile);
elements.changePasswordBtn.addEventListener('click', () => elements.changePasswordBox.style.display = 'block');
elements.cancelPasswordChange.addEventListener('click', hidePasswordChangeBox);
elements.submitPasswordChange.addEventListener('click', changePassword);
elements.backBtn.addEventListener('click', () => window.location.href = 'farmer4.html');

document.querySelectorAll('.toggle-password').forEach(icon => {
  icon.addEventListener('click', () => {
    const input = icon.previousElementSibling;
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  });
});

// Functions
function toggleEditMode() {
  isEditing = !isEditing;
  const state = !isEditing;
  elements.userName.disabled = state;
  elements.userPhone.disabled = state;
  elements.userLocation.disabled = state;
  elements.userGender.disabled = state;
  elements.userAge.disabled = state;
  elements.uploadBtn.disabled = state;
  elements.saveProfileBtn.style.display = isEditing ? 'inline-block' : 'none';
  elements.editProfileBtn.innerHTML = isEditing ? '<i class="fas fa-times"></i> Cancel' : '<i class="fas fa-edit"></i> Edit Profile';
}

async function handlePhotoUpload() {
  const file = elements.photoUpload.files[0];
  if (!file || !file.type.startsWith('image/') || file.size > CLOUDINARY_CONFIG.maxFileSize) {
    showMessage('error', 'Invalid image file.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', CLOUDINARY_CONFIG.folder);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    uploadedImageUrl = data.secure_url;
    elements.profilePhoto.src = uploadedImageUrl;

    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, "users", user.uid), {
        profileImage: uploadedImageUrl,
        lastUpdated: serverTimestamp()
      });
      showMessage('success', 'Profile photo updated!');
    }
  } catch (err) {
    showMessage('error', 'Upload failed.');
  }
}
async function saveProfile() {
  const user = auth.currentUser;
  if (!user) return showMessage('error', 'You must be logged in.');

  const name = elements.userName.value.trim();
  const phone = elements.userPhone.value.trim();
  const location = elements.userLocation.value.trim();
  const gender = elements.userGender.value;
  const age = elements.userAge.value;

  const updates = { lastUpdated: serverTimestamp() };

  if (uploadedImageUrl) updates.profileImage = uploadedImageUrl;
  else updates.profileImage = deleteField();

  if (name) updates.name = name;
  else updates.name = deleteField();

  if (phone) updates.phone = phone;
  else updates.phone = deleteField();

  if (location) updates.location = location;
  else updates.location = deleteField();

  if (gender) updates.gender = gender;
  else updates.gender = deleteField();

  if (age) updates.age = age;
  else updates.age = deleteField();

  if (phone && !validatePhone(phone)) {
  return showMessage('error', 'Invalid phone number.');
}

  try {
    await setDoc(doc(db, "users", user.uid), updates, { merge: true });

    showMessage('success', 'Profile updated!');
    toggleEditMode();
    // No need to fetch data again, real-time listener updates UI automatically
  } catch (err) {
    showMessage('error', 'Failed to update profile.');
  }
}

function hidePasswordChangeBox() {
  elements.changePasswordBox.style.display = 'none';
  elements.currentPassword.value = '';
  elements.newPassword.value = '';
  elements.confirmPassword.value = '';
}

async function changePassword() {
  const user = auth.currentUser;
  if (!user) return;

  const currentPwd = elements.currentPassword.value;
  const newPwd = elements.newPassword.value;
  const confirmPwd = elements.confirmPassword.value;

  if (!currentPwd || !newPwd || !confirmPwd) {
    return showMessage('error', 'All password fields required.', 'password');
  }

  if (newPwd !== confirmPwd) {
    return showMessage('error', 'New passwords do not match.', 'password');
  }

  if (!validatePassword(newPwd)) {
    return showMessage('error', 'Password must be 8+ chars with a number.', 'password');
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPwd);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPwd);
    showMessage('success', 'Password changed.', 'password');
    setTimeout(hidePasswordChangeBox, 3000);
  } catch (error) {
    showMessage('error', error.message, 'password');
  }
}
