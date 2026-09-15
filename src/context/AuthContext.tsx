"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth } from "@/lib/firebase";
import { db } from "@/lib/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/* =========================================================
   SAVE USER TO FIRESTORE
========================================================= */

async function saveUserToFirestore(user: User) {
  if (!user || user.isAnonymous) {
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        provider:
          user.providerData[0]?.providerId || "unknown",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("New user created in Firestore");
    } else {
      await setDoc(
        userRef,
        {
          name: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      console.log("User updated in Firestore");
    }
  } catch (error) {
    console.error(
      "Failed to save user to Firestore:",
      error
    );
  }
}

/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------------------------------------------------------
     AUTH STATE
  ------------------------------------------------------- */

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        await setPersistence(
          auth,
          browserLocalPersistence
        );

        unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
              await saveUserToFirestore(firebaseUser);
            }

            setLoading(false);
          }
        );
      } catch (error) {
        console.error(
          "Firebase Auth initialization failed:",
          error
        );

        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /* -------------------------------------------------------
     EMAIL LOGIN
  ------------------------------------------------------- */

  const login = async (
    email: string,
    password: string
  ): Promise<void> => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      throw new Error(
        "Please enter your email and password."
      );
    }

    const result =
      await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

    setUser(result.user);

    await saveUserToFirestore(result.user);
  };

  /* -------------------------------------------------------
     EMAIL SIGNUP
  ------------------------------------------------------- */

  const signup = async (
    email: string,
    password: string
  ): Promise<void> => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      throw new Error(
        "Please enter your email and password."
      );
    }

    if (password.length < 6) {
      throw new Error(
        "Password must be at least 6 characters."
      );
    }

    const result =
      await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

    setUser(result.user);

    await saveUserToFirestore(result.user);
  };

  /* -------------------------------------------------------
     GUEST LOGIN
  ------------------------------------------------------- */

  const guestLogin = async (): Promise<void> => {
    const result = await signInAnonymously(auth);

    setUser(result.user);
  };

  /* -------------------------------------------------------
     GOOGLE LOGIN
  ------------------------------------------------------- */

  const googleLogin = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();

    provider.addScope("profile");
    provider.addScope("email");

    const result = await signInWithPopup(
      auth,
      provider
    );

    setUser(result.user);

    await saveUserToFirestore(result.user);
  };

  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
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

/* =========================================================
   USE AUTH
========================================================= */

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
}