"use client";

/**
 * AuthContext — Google Authentication via Firebase
 *
 * Provides:
 *   - user (Firebase User | null)
 *   - email (string | null)
 *   - loading (boolean — true while checking session on mount)
 *   - signInWithGoogle()
 *   - signOut()
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { app } from "./firebase";

// ── Firebase Auth instance ────────────────────────────────────────────────
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ── Context type ──────────────────────────────────────────────────────────
import type { UserCredential } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  email: string | null;
  uid: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<UserCredential | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  email: null,
  uid: null,
  loading: true,
  signInWithGoogle: async () => null,
  signOut: async () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────
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

  const handleSignIn = async (): Promise<UserCredential | null> => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("[Auth] Google sign-in failed:", err);
      return null;
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("[Auth] Sign-out failed:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        email: user?.email ?? null,
        uid: user?.uid ?? null,
        loading,
        signInWithGoogle: handleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
