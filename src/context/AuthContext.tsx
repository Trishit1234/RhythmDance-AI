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

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import type { UserProfile, UserRole } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;

  loginWithRole: (
    email: string,
    password: string,
    expectedRole: UserRole
  ) => Promise<void>;

  signup: (email: string, password: string) => Promise<void>;

  guestLogin: () => Promise<void>;

  googleLogin: () => Promise<void>;

  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load Firestore user profile
   */
  const loadProfile = async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setProfile(null);
      setRole(null);
      return;
    }

    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const data = userSnapshot.data();

        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName:
            data.displayName ||
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "User",
          role: data.role || "student",
          photoURL: data.photoURL || firebaseUser.photoURL || undefined,
          createdAt: data.createdAt,
        };

        setProfile(userProfile);
        setRole(userProfile.role);
      } else {
        /**
         * Existing users from your old version may not have
         * a Firestore profile yet.
         *
         * We treat them as students.
         */
        const fallbackProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "Student",
          role: "student",
          photoURL: firebaseUser.photoURL || undefined,
        };

        setProfile(fallbackProfile);
        setRole("student");
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);

      /**
       * Do NOT give admin/tutor privileges if Firestore fails.
       * Safest fallback is student.
       */
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName:
          firebaseUser.displayName ||
          firebaseUser.email?.split("@")[0] ||
          "Student",
        role: "student",
      });

      setRole("student");
    }
  };

  /**
   * Firebase authentication listener
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setProfile(null);
        setRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Normal student login
   */
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  /**
   * Admin / Tutor / Student role-specific login
   */
  const loginWithRole = async (
    email: string,
    password: string,
    expectedRole: UserRole
  ) => {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = credential.user;

    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      await signOut(auth);

      throw new Error(
        "Your account does not have a Rhythm of India role assigned."
      );
    }

    const data = userSnapshot.data();
    const actualRole = data.role as UserRole;

    if (actualRole !== expectedRole) {
      await signOut(auth);

      throw new Error(
        `This account is registered as ${actualRole}. Please use the correct login portal.`
      );
    }

    const userProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName:
        data.displayName ||
        firebaseUser.displayName ||
        email.split("@")[0],
      role: actualRole,
      photoURL: data.photoURL || firebaseUser.photoURL || undefined,
      createdAt: data.createdAt,
    };

    setUser(firebaseUser);
    setProfile(userProfile);
    setRole(actualRole);
  };

  /**
   * Student registration
   */
  const signup = async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = credential.user;

    /**
     * IMPORTANT:
     * Every normal signup is automatically a STUDENT.
     *
     * Users cannot register themselves as admin or tutor.
     */
    await setDoc(doc(db, "users", firebaseUser.uid), {
      uid: firebaseUser.uid,
      email: firebaseUser.email || email,
      displayName: email.split("@")[0],
      role: "student",
      createdAt: serverTimestamp(),
    });

    const studentProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || email,
      displayName: email.split("@")[0],
      role: "student",
    };

    setUser(firebaseUser);
    setProfile(studentProfile);
    setRole("student");
  };

  /**
   * Guest login
   */
  const guestLogin = async () => {
    await signInAnonymously(auth);
  };

  /**
   * Google login
   *
   * Google users are treated as students unless an admin/tutor
   * profile has already been created manually.
   */
  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();

    const credential = await signInWithPopup(auth, provider);

    const firebaseUser = credential.user;

    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "Student",
        role: "student",
        photoURL: firebaseUser.photoURL || null,
        createdAt: serverTimestamp(),
      });
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    await signOut(auth);

    setUser(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        login,
        loginWithRole,
        signup,
        guestLogin,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}