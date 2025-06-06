import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  fetchSignInMethodsForEmail
} from "../config.js";

let isSignUp = false;
let currentLang = localStorage.getItem("selectedLang") || 'en';
const container = document.getElementById('authContainer');

const translations = {
  en: {
    appTitle: "Farmer Connect",
    welcomeBack: "Welcome Back",
    createAccount: "Create Account",
    googleButton: "Sign in / Sign up with Google",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    confirmPasswordPlaceholder: "Confirm Password",
    forgotPassword: "Forgot Password?",
    logIn: "Log In",
    signUp: "Sign Up",
    toggleToSignUp: "Don't have an account?",
    toggleToSignIn: "Already have an account?",
    orDivider: "or"
  },
  te: {
    appTitle: "ఫార్మర్ కనెక్ట్",
    welcomeBack: "స్వాగతం",
    createAccount: "ఖాతా సృష్టించండి",
    googleButton: "గూగుల్ తో సైన్ ఇన్ / సైన్ అప్ చేయండి",
    emailPlaceholder: "ఇమెయిల్",
    passwordPlaceholder: "పాస్వర్డ్",
    confirmPasswordPlaceholder: "పాస్వర్డ్ నిర్ధారించండి",
    forgotPassword: "పాస్వర్డ్ మర్చిపోయారా?",
    logIn: "లాగిన్",
    signUp: "సైన్ అప్",
    toggleToSignUp: "ఖాతా లేదు?",
    toggleToSignIn: "ఖాతా ఇప్పటికే ఉందా?",
    orDivider: "లేదా"
  }
};

const showError = (id, message) => {
  const el = document.getElementById(id);
  if (el) el.innerText = message;
};

const clearErrors = () => {
  document.querySelectorAll('.error-message, .error-msg').forEach(el => el.textContent = '');
};


const addInputListeners = () => {
  ['email', 'password', 'confirmPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => showError(`${id}Error`, ''));
  });
  const roleEl = document.getElementById('role');
  if(roleEl) roleEl.addEventListener('change', () => showError('roleError', ''));
};
const toggleForm = () => {
  isSignUp = !isSignUp;
  renderForm();
};

const renderForm = () => {
  const t = translations[currentLang];
  container.innerHTML = `
    <div class="lang-selector">
      <select id="languageSelect">
        <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
        <option value="te" ${currentLang === 'te' ? 'selected' : ''}>తెలుగు</option>
      </select>
    </div>
    <h1 class="app-title">${t.appTitle}</h1>
    <h2>${isSignUp ? t.createAccount : t.welcomeBack}</h2>
    <button class="social-btn" id="googleBtn">
      <img src="https://i.postimg.cc/3Rnc9T4P/images.webp" alt="Google logo"> ${t.googleButton}
    </button>
    <div class="or-divider">${t.orDivider}</div>
    <input type="email" id="email" placeholder="${t.emailPlaceholder}">
    <div id="emailError" class="error-message"></div>
    <div class="input-wrapper">
      <input type="password" id="password" placeholder="${t.passwordPlaceholder}">
      <span class="toggle-password" onclick="togglePassword('password')">👁️</span>
    </div>
    <div id="passwordError" class="error-message"></div>
    ${isSignUp ? `
      <div class="input-wrapper">
        <input type="password" id="confirmPassword" placeholder="${t.confirmPasswordPlaceholder}">
        <span class="toggle-password" onclick="togglePassword('confirmPassword')">👁️</span>
      </div>
      <div id="confirmPasswordError" class="error-message"></div>
      <select id="role">
        <option value="">Select Role</option>
        <option value="farmer">Farmer</option>
        <option value="buyer">Buyer</option>
      </select>
      <div id="roleError" class="error-message"></div>
    ` : ''}
    ${!isSignUp ? `<p class="forgot-password" onclick="forgotPassword()">${t.forgotPassword}</p>` : ''}
    <button class="button" id="submitBtn">${isSignUp ? t.signUp : t.logIn}</button>
    <div class="toggle">${isSignUp ? t.toggleToSignIn : t.toggleToSignUp} <a id="toggleForm">${isSignUp ? t.logIn : t.signUp}</a></div>
    <div id="generalError" class="general-error"></div>
  `;

  document.getElementById('submitBtn').onclick = isSignUp ? signUp : signIn;
  
  // Change Google button behavior based on sign up or sign in mode
  document.getElementById('googleBtn').onclick = () => {
    if (isSignUp) {
      googleSignUp();
    } else {
      googleSignIn();
    }
  };

  document.getElementById('toggleForm').onclick = toggleForm;
  document.getElementById('languageSelect').addEventListener('change', changeLanguage);
  addInputListeners();
};


const changeLanguage = (event) => {
  currentLang = event.target.value;
  localStorage.setItem("selectedLang", currentLang);
  renderForm();
};

window.togglePassword = (fieldId) => {
  const input = document.getElementById(fieldId);
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
};

window.forgotPassword = async () => {
  clearErrors();
  const email = document.getElementById('email')?.value.trim();
  if (!email) return showError('emailError', 'Enter your email to reset password.');

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent! Check your inbox.");
  } catch (error) {
    console.error("Password Reset Error:", error);
    showError('emailError', error.message);
  }
};

const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[gG][mM][aA][iI][lL]\.com$/.test(email.toLowerCase());

const validatePassword = (password) => {
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /\d/.test(password) &&
         /[!@#$%^&*(),.?":{}|<>]/.test(password);
};

const setLoadingState = (button, loading, text) => {
  if (loading) {
    button.innerHTML = `<span class="loading">⏳</span> ${text}`;
    button.disabled = true;
  } else {
    button.innerHTML = text;
    button.disabled = false;
  }
};

const signIn = async () => {
  clearErrors();
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value.trim();

  if (!email) return showError('emailError', 'Email is required.');
  if (!password) return showError('passwordError', 'Password is required.');

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    if (!userCredential.user.emailVerified) {
      showError('generalError', 'Email not verified. <a onclick="resendVerification()">Resend Verification</a>');
      await signOut(auth);
      return;
    }

    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (!userDoc.exists()) {
      showError('generalError', "No account found. Please sign up and try again.");
      await signOut(auth);
      return;
    }

    await handleUserRedirect(userCredential.user.uid);

  } catch (err) {
  console.error("Sign In Error:", err);

  if (err.code === "auth/invalid-login-credentials") {
    // This error covers wrong-password, user-not-found, etc.

    try {
      const methods = await auth.fetchSignInMethodsForEmail(email);

      if (methods.length === 0) {
        // No account with this email
        showError("generalError", "No account found. Please sign up first.");
      } else if (methods.includes("google.com")) {
        // Email registered with Google
        showError("generalError", "This email is registered with Google Sign-In. Please use the 'Sign in with Google' option.");
      } else {
        // Other sign-in methods exist, so password is probably wrong
        showError("generalError", "Incorrect password. Please try again.");
      }
    } catch (fetchErr) {
      console.error("Error fetching sign-in methods:", fetchErr);
      showError("generalError", "Invalid login credentials.");
    }

  } else {
    showError("generalError", err.message);
  }
}

};


const signUp = async () => {
  clearErrors();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const role = document.getElementById('role')?.value;

  if (!validateEmail(email)) return showError('emailError', 'Invalid email format.');
  if (!validatePassword(password)) return showError('passwordError', 'Password does not meet requirements.');
  if (password !== confirmPassword) return showError('confirmPasswordError', 'Passwords do not match.');
  if (!role) return showError('roleError', 'Please select a role.');

  const submitBtn = document.getElementById('submitBtn');
  setLoadingState(submitBtn, true, translations[currentLang].signUp);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await sendEmailVerification(userCredential.user);
    alert("Verification email sent! Please check your inbox.");

    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      role,
      createdAt: new Date().toISOString()
    });

    await signOut(auth);

    isSignUp = false;
    renderForm();
  } catch (error) {
    console.error("Error during sign up:", error);
    showError('emailError', error.message);
  } finally {
    setLoadingState(submitBtn, false, translations[currentLang].signUp);
  }
};

const resendVerification = async () => {
  try {
    await sendEmailVerification(auth.currentUser);
    alert("Verification email sent again!");
  } catch (error) {
    console.error("Resend Error:", error);
    showError('generalError', error.message);
  }
};

const googleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const uid = user.uid;

    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      await handleUserRedirect(uid);
    } else {
      showError('generalError', "Account does not exist. Please sign up first.");
      await signOut(auth);
    }
  } catch (error) {
    console.error("Google Sign-In Error:", error.message);
    showError('generalError', error.message);
  }
};
const googleSignUp = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const uid = user.uid;

    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      showError('generalError', "Account already exists. Please sign in.");
      await signOut(auth);
      return;
    }

    // Show the modal for role selection
    const role = await showRoleSelectionModal();
    if (!role) {
      await signOut(auth);
      return;
    }

    await setDoc(userRef, {
      email: user.email,
      role,
      createdAt: new Date(),
    });

    // Redirect based on role
    if (role === "farmer") {
      window.location.href = "farmer4.html";
    } else {
      window.location.href = "customer-dashboard.html";
    }
  } catch (error) {
    console.error("Google Sign-Up Error:", error.message);
    showError('generalError', error.message);
  }
};



const showRoleSelectionModal = () => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';

    const modal = document.createElement('div');
    modal.style.backgroundColor = 'white';
    modal.style.padding = '20px';
    modal.style.borderRadius = '10px';
    modal.style.width = '300px';
    modal.style.maxWidth = '90%';

    modal.innerHTML = `
      <h3 style="margin-bottom: 15px;">Select Your Role</h3>
      <select id="googleRoleSelect" style="width: 100%; padding: 10px; margin-bottom: 15px;">
        <option value="">-- Select Role --</option>
        <option value="farmer">Farmer</option>
        <option value="buyer">Buyer</option>
      </select>
      <div id="googleRoleError" style="color: red; margin-bottom: 10px;"></div>
      <button id="confirmRoleBtn" style="width: 100%; padding: 10px; background: #42e695; color: white; border: none; border-radius: 5px;">
        Continue
      </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const confirmBtn = modal.querySelector('#confirmRoleBtn');
    const roleSelect = modal.querySelector('#googleRoleSelect');
    const roleError = modal.querySelector('#googleRoleError');

    confirmBtn.addEventListener('click', () => {
      const selectedRole = roleSelect.value;
      if (!selectedRole) {
        roleError.textContent = 'Please select a role';
        return;
      }
      document.body.removeChild(overlay);
      resolve(selectedRole);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resolve(null);
      }
    });
  });
};

const handleUserRedirect = async (uid) => {
  const loadingElement = document.getElementById("loading");
  if (loadingElement) loadingElement.style.display = "block";

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) {
      alert("Error: User data missing in Firestore. Contact support.");
      return;
    }
    const role = userDoc.data().role;
    window.location.href = role === "farmer" ? "farmer4.html" : "customer-dashboard.html";
  } catch (error) {
    console.error("Redirection error:", error);
    alert("Error retrieving user role.");
  } finally {
    if (loadingElement) loadingElement.style.display = "none";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  renderForm();
});
