'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, getIdToken, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';
import { FirebaseErrorHandler, setupIndexedDBErrorMonitoring } from '@/lib/firebase/error-handler';

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
    // Setup error monitoring for IndexedDB issues
    setupIndexedDBErrorMonitoring();

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        setSigningIn(false);
      },
      (error) => {
        // Handle auth state change errors
        console.error('❌ Auth state change error:', error);
        FirebaseErrorHandler.handleIndexedDBError(error);
        setLoading(false);
        setSigningIn(false);
      }
    );

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
      } else if (error.name === 'AbortError') {
        console.warn('⚠️ AbortError detectado, ignorando...');
        FirebaseErrorHandler.handleIndexedDBError(error);
      } else {
        console.error('❌ Error al iniciar sesión:', error);
        const errorMessage = FirebaseErrorHandler.handleAuthError(error);
        throw new Error(errorMessage);
      }
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('❌ Error al cerrar sesión:', error);
      FirebaseErrorHandler.handleIndexedDBError(error);
    }
  };

  const getUserIdToken = async () => {
    try {
      if (!auth.currentUser) return null;
      return await getIdToken(auth.currentUser, true);
    } catch (error: any) {
      console.error('❌ Error al obtener token:', error);
      FirebaseErrorHandler.handleIndexedDBError(error);
      return null;
    }
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
