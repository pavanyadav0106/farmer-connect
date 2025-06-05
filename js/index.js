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
  deleteDoc
} from "../config.js";

    async function resendVerification() {
  try {
    await sendEmailVerification(auth.currentUser);
    alert("Verification email sent again!");
  } catch (error) {
    console.error("Resend Error:", error);
    showError('generalError', error.message);
  }
}

    async function verifyOtp(email, enteredOtp) {
  const docRef = doc(db, "otps", email);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return "OTP expired or invalid!";

  const { otp, expiresAt } = docSnap.data();
  if (Date.now() > expiresAt) return "OTP expired!";

  if (enteredOtp == otp) {
    await deleteDoc(docRef); // Delete OTP after successful verification
    return "OTP verified!";
  } else {
    return "Incorrect OTP!";
  }
}
    
    let isSignUp = false;
    let currentLang = 'en';
    const container = document.getElementById('authContainer');
    
    // Translation dictionary (English and Telugu)
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
    
    // Helper function to display error messages
    const showError = (id, message) => {
      const el = document.getElementById(id);
      if (el) el.innerText = message;
    };
    
    const clearErrors = () => {
      showError('emailError', '');
      showError('passwordError', '');
      showError('confirmPasswordError', '');
      showError('generalError', '');
    };
    
    // Attach input listeners to clear errors on change
    const addInputListeners = () => {
      document.getElementById("email")?.addEventListener("input", () => showError("emailError", ""));
      document.getElementById("password")?.addEventListener("input", () => showError("passwordError", ""));
      document.getElementById("confirmPassword")?.addEventListener("input", () => showError("confirmPasswordError", ""));
    };
    
    // Render the login form using the current language texts
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
  document.getElementById('googleBtn').onclick = googleSignIn;
  document.getElementById('toggleForm').onclick = toggleForm;
  document.getElementById('languageSelect').addEventListener('change', changeLanguage);
  addInputListeners();
};

    
    // Language change handler (only affects the login page)
    const changeLanguage = (event) => {
      currentLang = event.target.value;
      localStorage.setItem("selectedLang", currentLang);
      renderForm();
    };

    document.addEventListener("DOMContentLoaded", () => {
      currentLang = localStorage.getItem("selectedLang") || 'en';
      renderForm();
    });

    window.forgotPassword = async () => {
      const email = document.getElementById('email')?.value.trim();
      if (!email) {
        showError('emailError', 'Enter your email to reset password.');
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent! Check your inbox.");
      } catch (error) {
        console.error("Password Reset Error:", error);
        showError('emailError', error.message);
      }
    };

    // Toggle password visibility
    window.togglePassword = (fieldId) => {
      const input = document.getElementById(fieldId);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    };

    const toggleForm = () => {
      isSignUp = !isSignUp;
      renderForm();
    };

    const validateEmail = (email) => {
      const re = /^[a-zA-Z0-9._%+-]+@[gG][mM][aA][iI][lL]\.com$/;
      return re.test(email.toLowerCase());
    };

    const validatePassword = (password) => {
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /\d/.test(password) &&
         /[!@#$%^&*(),.?":{}|<>]/.test(password); // Enforce special character
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
  const email = document.getElementById('email')?.value.trim() || "";
  const password = document.getElementById('password')?.value.trim() || "";
  
  if (!email) return showError('emailError', 'Email is required.');
  if (!password) return showError('passwordError', 'Password is required.');
  if (!validateEmail(email)) return showError('emailError', 'Invalid email format.');
  
  const submitBtn = document.getElementById('submitBtn');
  setLoadingState(submitBtn, true, "Logging in...");
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      showError('generalError', 'Email not verified. <a onclick="resendVerification()">Resend Verification</a>');
      await auth.signOut();
      return;
    }
    
    await handleUserRedirect(userCredential.user.uid);
  } catch (err) {
    console.error("Error during sign in:", err);
    switch (err.code) {
  case 'auth/invalid-email':
    showError('emailError', 'Invalid email address.');
    break;
  case 'auth/user-disabled':
    showError('generalError', 'User account is disabled.');
    break;
  case 'auth/user-not-found':
    showError('emailError', 'No account found with this email.');
    break;
  case 'auth/wrong-password':
    showError('passwordError', 'Incorrect password.');
    break;
  default:
    showError('generalError', err.message || 'Login failed.');
}

  } finally {
    setLoadingState(submitBtn, false, translations[currentLang].logIn);
  }
};


const signUp = async () => {
  clearErrors();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const role = document.getElementById('role')?.value; // Get role selection

  if (!validateEmail(email))
    return showError('emailError', 'Invalid email format.');
  if (!validatePassword(password))
    return showError('passwordError', 'Password does not meet requirements.');
  if (password !== confirmPassword)
    return showError('confirmPasswordError', 'Passwords do not match.');
  if (!role)
    return showError('roleError', 'Please select a role.');

  const submitBtn = document.getElementById('submitBtn');
  setLoadingState(submitBtn, true, "Creating account...");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send verification email
    await sendEmailVerification(userCredential.user);
    alert("Verification email sent! Please check your inbox.");
    
    // Save user details along with selected role to Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      role, // Store role
      createdAt: new Date().toISOString()
    });
    
    // Sign out the user so that they must verify their email
    await auth.signOut();
    
    // Switch the form to sign-in mode (on index.html)
    isSignUp = false;
    renderForm();
  } catch (error) {
    console.error("Error during sign up:", error);
    showError('emailError', error.message);
  } finally {
    setLoadingState(submitBtn, false, translations[currentLang].signUp);
  }
};





const googleSignIn = async () => {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
        loadingElement.style.display = "block"; // Show loading indicator
    }

    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const userRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            await setDoc(userRef, {
                email: result.user.email,
                role: 'customer', // Assign default role
                createdAt: new Date().toISOString()
            });
        }

        await handleUserRedirect(result.user.uid);
    } catch (error) {
        console.error("Google Sign-In Error:", error.message);
        if (error.code === 'auth/popup-closed-by-user') {
            showError('generalError', "Sign-in popup closed by user.");
        } else {
            showError('generalError', error.message);
        }
    } finally {
        if (loadingElement) {
            loadingElement.style.display = "none"; // Hide loading indicator
        }
    }
};

    const handleUserRedirect = async (uid) => {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
        loadingElement.style.display = "block"; // Show loading indicator
    }

    try {
        const userRef = doc(db, "users", uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const role = userDoc.data().role;

            // Redirect user based on role
            window.location.href = role === "farmer" ? "farmer4.html" : "customer-dashboard.html";
        } else {
            console.error("User  document not found.");
            alert("Error: User data missing in Firestore. Contact support.");
        }
    } catch (error) {
        console.error("Redirection error:", error);
        alert("Error retrieving user role.");
    } finally {
        if (loadingElement) {
            loadingElement.style.display = "none"; // Hide loading indicator
        }
    }
};


    document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("selectedLang");
  if (savedLang) currentLang = savedLang; // Apply saved language
  renderForm();
});
      
    // Re-bind togglePassword in case of re-rendering
    window.togglePassword = (fieldId) => {
      const input = document.getElementById(fieldId);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    };
    