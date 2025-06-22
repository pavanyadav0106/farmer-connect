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
    orDivider: "or",
    verificationSent: "Verification email sent! Please check your inbox.",
    verificationSentAgain: "Verification email sent again!",
    enterEmailReset: "Enter your email to reset password.",
    invalidEmailFormat: "Invalid email format.",
    passwordRequirements: "Password must be 8+ chars, include uppercase, number & special char.",
    passwordsMismatch: "Passwords do not match.",
    selectRole: "Please select a role.",
    noAccountFound: "No account found. Please sign up first.",
    accountExistsGoogle: "This email is registered with Google Sign-In. Please use the 'Sign in with Google' option.",
    incorrectPassword: "Incorrect password. Please try again.",
    accountAlreadyExists: "Account already exists. Please sign in.",
    accountDoesNotExist: "Account does not exist. Please sign up first.",
    emailNotVerified: 'Email not verified. <a onclick="resendVerification()" style="cursor:pointer;color:#42e695;text-decoration:underline;">Resend Verification</a>'
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
    orDivider: "లేదా",
    verificationSent: "సమర్పించిన ఇమెయిల్‌లో ధృవీకరణ ఇమెయిల్ పంపబడింది!",
    verificationSentAgain: "ధృవీకరణ ఇమెయిల్ మళ్లీ పంపబడింది!",
    enterEmailReset: "పాస్వర్డ్ రీసెట్ కోసం మీ ఇమెయిల్ నమోదు చేయండి.",
    invalidEmailFormat: "చెల్లని ఇమెయిల్ ఫార్మాట్.",
    passwordRequirements: "పాస్వర్డ్ కనీసం 8 అక్షరాలు, పెద్ద అక్షరం, సంఖ్య & ప్రత్యేక చిహ్నం కలిగి ఉండాలి.",
    passwordsMismatch: "పాస్వర్డ్‌లు సరిపోలలేదు.",
    selectRole: "దయచేసి పాత్రను ఎంచుకోండి.",
    noAccountFound: "ఖాతా కనుగొనబడలేదు. ముందుగా సైన్ అప్ చేయండి.",
    accountExistsGoogle: "ఈ ఇమెయిల్ గూగుల్ సైన్-ఇన్‌తో నమోదు చేయబడింది. దయచేసి 'గూగుల్ తో సైన్ ఇన్' ను ఉపయోగించండి.",
    incorrectPassword: "తప్పు పాస్వర్డ్. దయచేసి మళ్లీ ప్రయత్నించండి.",
    accountAlreadyExists: "ఖాతా ఇప్పటికే ఉంది. దయచేసి సైన్ ఇన్ చేయండి.",
    accountDoesNotExist: "ఖాతా లేదు. దయచేసి ముందుగా సైన్ అప్ చేయండి.",
    emailNotVerified: 'ఇమెయిల్ ధృవీకరించబడలేదు. <a onclick="resendVerification()" style="cursor:pointer;color:#42e695;text-decoration:underline;">మళ్ళీ ధృవీకరణ పంపండి</a>'
  }
};

const showError = (id, message) => {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = `<div class="error-message"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> ${message}</div>`;
  }
};

const showGeneralError = (message) => {
  const el = document.getElementById("generalError");
  if (el) {
    el.className = "general-error error";
    el.innerHTML = `<div class="error-message-banner"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> ${message}</div>`;
    setTimeout(() => {
      el.innerHTML = '';
      el.className = "general-error";
    }, 7000);
  }
};

const showSuccess = (message) => {
  const el = document.getElementById("generalError");
  if (el) {
    el.className = "general-error success";
    el.innerHTML = `<div class="success-message-banner"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> ${message}</div>`;
    setTimeout(() => {
      el.innerHTML = '';
      el.className = "general-error";
    }, 5000);
  }
};

const clearErrors = () => {
  document.querySelectorAll('.error-message, .error-message-banner').forEach(el => el.remove());
};

const addInputListeners = () => {
  ['email', 'password', 'confirmPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      document.getElementById(`${id}Error`)?.querySelector('.error-message')?.remove();
    });
  });
  const roleEl = document.getElementById('role');
  if (roleEl) roleEl.addEventListener('change', () => {
    document.getElementById('roleError')?.querySelector('.error-message')?.remove();
  });
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
    <div id="emailError"></div>
    <div class="input-wrapper">
      <input type="password" id="password" placeholder="${t.passwordPlaceholder}">
      <span class="toggle-password" onclick="togglePassword('password')">👁️</span>
    </div>
    <div id="passwordError"></div>
    ${isSignUp ? `
      <div class="input-wrapper">
        <input type="password" id="confirmPassword" placeholder="${t.confirmPasswordPlaceholder}">
        <span class="toggle-password" onclick="togglePassword('confirmPassword')">👁️</span>
      </div>
      <div id="confirmPasswordError"></div>
      <select id="role">
        <option value="">${t.selectRole}</option>
        <option value="farmer">Farmer</option>
        <option value="buyer">Buyer</option>
      </select>
      <div id="roleError"></div>
    ` : ''}
    ${!isSignUp ? `<p class="forgot-password" onclick="forgotPassword()">${t.forgotPassword}</p>` : ''}
    <button class="button" id="submitBtn">${isSignUp ? t.signUp : t.logIn}</button>
    <div class="toggle">${isSignUp ? t.toggleToSignIn : t.toggleToSignUp} <a id="toggleForm">${isSignUp ? t.logIn : t.signUp}</a></div>
    <div id="generalError" class="general-error"></div>
  `;

  document.getElementById('submitBtn').onclick = isSignUp ? signUp : signIn;
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
  const t = translations[currentLang];
  
  if (!email) {
    showError('emailError', t.enterEmailReset);
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showSuccess(t.verificationSent);
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
    button.innerHTML = `<span class="loading-spinner"></span> ${text}`;
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
  const t = translations[currentLang];

  if (!email) {
    showError('emailError', t.emailPlaceholder + ' is required.');
    return;
  }
  if (!password) {
    showError('passwordError', t.passwordPlaceholder + ' is required.');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  setLoadingState(submitBtn, true, t.logIn);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    if (!userCredential.user.emailVerified) {
      showGeneralError(t.emailNotVerified);
      await signOut(auth);
      return;
    }

    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (!userDoc.exists()) {
      showGeneralError(t.noAccountFound);
      await signOut(auth);
      return;
    }

    await handleUserRedirect(userCredential.user.uid);

  } catch (err) {
    console.error("Sign In Error:", err);

    if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, email);

        if (methods.length === 0) {
          showGeneralError(t.noAccountFound);
        } else if (methods.includes("google.com")) {
          showGeneralError(t.accountExistsGoogle);
        } else {
          showGeneralError(t.incorrectPassword);
        }
      } catch (fetchErr) {
        console.error("Error fetching sign-in methods:", fetchErr);
        showGeneralError("Invalid login credentials.");
      }
    } else {
      showGeneralError(err.message);
    }
  } finally {
    setLoadingState(submitBtn, false, t.logIn);
  }
};

const signUp = async () => {
  clearErrors();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const role = document.getElementById('role')?.value;
  const t = translations[currentLang];

  let isValid = true;

  if (!validateEmail(email)) {
    showError('emailError', t.invalidEmailFormat);
    isValid = false;
  }
  if (!validatePassword(password)) {
    showError('passwordError', t.passwordRequirements);
    isValid = false;
  }
  if (password !== confirmPassword) {
    showError('confirmPasswordError', t.passwordsMismatch);
    isValid = false;
  }
  if (!role) {
    showError('roleError', t.selectRole);
    isValid = false;
  }

  if (!isValid) return;

  const submitBtn = document.getElementById('submitBtn');
  setLoadingState(submitBtn, true, t.signUp);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await sendEmailVerification(userCredential.user);
    showSuccess(t.verificationSent);

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
    if (error.code === 'auth/email-already-in-use') {
      showError('emailError', t.accountAlreadyExists);
    } else {
      showError('emailError', error.message);
    }
  } finally {
    setLoadingState(submitBtn, false, t.signUp);
  }
};

window.resendVerification = async () => {
  try {
    await sendEmailVerification(auth.currentUser);
    showSuccess(translations[currentLang].verificationSentAgain);
  } catch (error) {
    console.error("Resend Error:", error);
    showGeneralError(error.message);
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
      showGeneralError(translations[currentLang].accountDoesNotExist);
      await signOut(auth);
    }
  } catch (error) {
    console.error("Google Sign-In Error:", error.message);
    showGeneralError(error.message);
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
      showGeneralError(translations[currentLang].accountAlreadyExists);
      await signOut(auth);
      return;
    }

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

    if (role === "farmer") {
      window.location.href = "farmer4.html";
    } else {
      window.location.href = "customer-dashboard.html";
    }
  } catch (error) {
    console.error("Google Sign-Up Error:", error.message);
    showGeneralError(error.message);
  }
};

const showRoleSelectionModal = () => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'role-selection-modal';

    const t = translations[currentLang];
    
    modal.innerHTML = `
      <h3>${t.selectRole}</h3>
      <select id="googleRoleSelect">
        <option value="">-- ${t.selectRole} --</option>
        <option value="farmer">Farmer</option>
        <option value="buyer">Buyer</option>
      </select>
      <div id="googleRoleError" class="modal-error"></div>
      <button id="confirmRoleBtn" class="modal-confirm-btn">
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
        roleError.textContent = t.selectRole;
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
      showGeneralError("Error: User data missing in Firestore. Contact admin.");
      await signOut(auth);
      return;
    }

    const userData = userDoc.data();

    if (userData.role === "farmer") {
      window.location.href = "farmer4.html";
    } else if (userData.role === "buyer") {
      window.location.href = "customer-dashboard.html";
    } else {
      showGeneralError("Invalid user role. Contact admin.");
      await signOut(auth);
    }
  } catch (error) {
    console.error("Redirect Error:", error);
    showGeneralError("An error occurred during redirection.");
    await signOut(auth);
  } finally {
    if (loadingElement) loadingElement.style.display = "none";
  }
};

renderForm();