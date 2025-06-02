// configuration.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your Firebase config
var firebaseConfig = {
    apiKey: "AIzaSyDPrPDAj7o58AijhzBpytGKcsuxHYCGhaY",
    authDomain: "farmer-connect-8d0ea.firebaseapp.com",
    projectId: "farmer-connect-8d0ea",
    storageBucket: "farmer-connect-8d0ea.appspot.com",
    messagingSenderId: "164327825853",
    appId: "1:164327825853:web:00c05f326aab3c4683b2d4"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Export all needed services
export {
  auth,
  db,
  provider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  doc,
  setDoc,
  getDoc,
  deleteDoc
};
  