'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, getIdToken, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getUserIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      setSigningIn(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // Evitar múltiples intentos de inicio de sesión simultáneos
    if (signingIn) {
      console.log('⚠️ Ya hay un intento de inicio de sesión en progreso');
      return;
    }

    try {
      setSigningIn(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setSigningIn(false);
      
      // Manejar errores comunes
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('ℹ️ Popup cerrado por el usuario');
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('ℹ️ Solicitud de popup cancelada');
      } else {
        console.error('❌ Error al iniciar sesión:', error.message);
        throw error;
      }
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const getUserIdToken = async () => {
    if (!auth.currentUser) return null;
    return getIdToken(auth.currentUser, true);
  };

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, signOutUser, getUserIdToken }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
