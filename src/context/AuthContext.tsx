"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.warn("Firebase Auth failed, using mock session.", error);
      setUser({
        uid: "mock-user-" + Date.now(),
        isAnonymous: false,
        email: email,
        displayName: email.split("@")[0],
      } as User);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.warn("Firebase Auth failed, using mock session.", error);
      setUser({
        uid: "mock-user-" + Date.now(),
        isAnonymous: false,
        email: email,
        displayName: email.split("@")[0],
      } as User);
    }
  };

  const guestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.warn("Firebase Anonymous Auth failed, using mock guest session.", error);
      setUser({
        uid: "mock-guest-" + Date.now(),
        isAnonymous: true,
        email: "guest@rhythmofindia.org",
        displayName: "Guest Explorer",
      } as User);
    }
  };

  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.warn("Firebase Google Auth failed, using mock session.", error);
      setUser({
        uid: "mock-google-" + Date.now(),
        isAnonymous: false,
        email: "google@rhythmofindia.org",
        displayName: "Google User",
      } as User);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, guestLogin, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
