import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBStsL792KkLoZCh1tIOPZ0UUtM55fYVv8",
  authDomain: "rhythm-of-india-7ea88.firebaseapp.com",
  projectId: "rhythm-of-india-7ea88",
  storageBucket: "rhythm-of-india-7ea88.firebasestorage.app",
  messagingSenderId: "689991990252",
  appId: "1:689991990252:web:0044f3491a4837b0ae9ec9",
  measurementId: "G-R106T0EFEG",
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export {
  app,
  auth,
  db,
  storage,
  analytics,
};