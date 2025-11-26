// config.js - Complete Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
  getFirestore, 
  collection,
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  getDoc,
  addDoc,
  setDoc,
  orderBy,
  writeBatch,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  fetchSignInMethodsForEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDPrPDAj7o58AijhzBpytGKcsuxHYCGhaY",
  authDomain: "farmer-connect-8d0ea.firebaseapp.com",
  projectId: "farmer-connect-8d0ea",
  storageBucket: "farmer-connect-8d0ea.appspot.com",
  messagingSenderId: "164327825853",
  appId: "1:164327825853:web:00c05f326aab3c4683b2d4",
  measurementId: "G-B5HJ84QDL6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Export everything
export {
  app,
  db,
  auth,
  // Auth functions
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  // Firestore functions
  collection,
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  getDoc,
  addDoc,
  setDoc,
  orderBy,
  writeBatch,
  deleteDoc
};

console.log('Firebase configuration exported successfully');