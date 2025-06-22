import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc   // <-- from firestore only
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
  fetchSignInMethodsForEmail
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
  app,
  db,
  auth,
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
};
