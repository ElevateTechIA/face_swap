import { getApps, initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync } from "fs";
import { join } from "path";

let serviceAccount: ServiceAccount | null = null;

function getServiceAccount(): ServiceAccount | null {
  if (serviceAccount) {
    return serviceAccount;
  }

  try {
    // Intenta cargar desde archivo JSON
    const filePath = join(process.cwd(), 'firebase-service-account.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    serviceAccount = JSON.parse(fileContent);
    console.log('✅ Service Account cargado desde archivo JSON');
    return serviceAccount;
  } catch (fileError) {
    // Si no existe el archivo, intenta usar variables de entorno
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "";
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "";
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      serviceAccount = {
        projectId,
        clientEmail,
        privateKey,
      } as ServiceAccount;
      console.log('✅ Service Account cargado desde variables de entorno');
      return serviceAccount;
    }

    console.log('⚠️ No se encontró Service Account (ni archivo ni env vars)');
    return null;
  }
}

export function isAdminConfigured() {
  const account = getServiceAccount();
  const isConfigured = account !== null;
  console.log('🔧 Firebase Admin Config Check:', {
    isConfigured,
    source: account ? (serviceAccount ? 'file' : 'env') : 'none'
  });
  return isConfigured;
}

export function getAdminAuth() {
  const account = getServiceAccount();
  
  if (!account) {
    throw new Error("Missing Firebase Admin credentials.");
  }

  try {
    if (!getApps().length) {
      console.log('🚀 Inicializando Firebase Admin...');
      initializeApp({
        credential: cert(account),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('✅ Firebase Admin inicializado correctamente');
    }

    return getAuth();
  } catch (error: any) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    throw error;
  }
}

export function getAdminFirestore() {
  const account = getServiceAccount();

  if (!account) {
    throw new Error("Missing Firebase Admin credentials.");
  }

  try {
    if (!getApps().length) {
      console.log('🚀 Inicializando Firebase Admin...');
      initializeApp({
        credential: cert(account),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('✅ Firebase Admin inicializado correctamente');
    }

    return getFirestore();
  } catch (error: any) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    throw error;
  }
}

export function getAdminStorage() {
  const account = getServiceAccount();

  if (!account) {
    throw new Error("Missing Firebase Admin credentials.");
  }

  try {
    if (!getApps().length) {
      console.log('🚀 Inicializando Firebase Admin...');
      initializeApp({
        credential: cert(account),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('✅ Firebase Admin inicializado correctamente');
    }

    return getStorage();
  } catch (error: any) {
    console.error('❌ Error inicializando Firebase Storage:', error.message);
    throw error;
  }
}
