import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBVlxgdjBdX4Yk871QNuslHZE14dV-2rJ0",
  authDomain: "rhythm-of-india.firebaseapp.com",
  projectId: "rhythm-of-india",
  storageBucket: "rhythm-of-india.firebasestorage.app",
  messagingSenderId: "284984606125",
  appId: "1:284984606125:web:7d7daa19a9a3ae4542f524",
  measurementId: "G-E0D2PSN2CY"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, analytics };
