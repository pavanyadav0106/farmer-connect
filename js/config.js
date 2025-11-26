// config.js
export const CONFIG = {
  FIREBASE: {
    apiKey: "AIzaSyDPrPDAj7o58AijhzBpytGKcsuxHYCGhaY",
    authDomain: "farmer-connect-8d0ea.firebaseapp.com",
    projectId: "farmer-connect-8d0ea",
    storageBucket: "farmer-connect-8d0ea.appspot.com",
    messagingSenderId: "164327825853",
    appId: "1:164327825853:web:00c05f326aab3c4683b2d4",
    measurementId: "G-B5HJ84QDL6",
  },
  WEATHER_API_KEY: "c3ccd39af45cee6cf2c3536080789469",
  MARKET_API_KEY: "579b464db66ec23bdd0000015f3c4e40d4eb44a367b99b84f37e3c58"
};

// Initialize Firebase here as well if you want
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export const app = initializeApp(CONFIG.FIREBASE);
export const db = getFirestore(app);
export const auth = getAuth(app);