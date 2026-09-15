import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBStsL792KkLoZCh1tIOPZ0UUtM55fYVv8",
  authDomain: "rhythm-of-india-7ea88.firebaseapp.com",
  projectId: "rhythm-of-india-7ea88",
  storageBucket: "rhythm-of-india-7ea88.firebasestorage.app",
  messagingSenderId: "689991990252",
  appId: "1:689991990252:web:0044f3491a4837b0ae9ec9",
  measurementId: "G-R106T0EFEG",
};

export const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);