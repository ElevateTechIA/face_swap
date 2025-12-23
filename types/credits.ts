import { Timestamp } from 'firebase-admin/firestore';

export interface User {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
  credits: number;
  totalCreditsEarned: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stripeCustomerId?: string;
}

export interface CreditPackage {
  packageId: string;
  name: string;
  credits: number;
  priceUSD: number; // En centavos (999 = $9.99)
  stripePriceId: string;
  stripeProductId: string;
  description: string;
  popular: boolean;
  active: boolean;
  createdAt: Timestamp;
}

export interface Transaction {
  transactionId: string;
  userId: string;
  type: 'purchase' | 'usage' | 'bonus';
  credits: number; // Positivo para compra, negativo para uso
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata?: {
    packageId?: string;
    sessionId?: string;
    faceSwapId?: string;
  };
  createdAt: Timestamp;
}

export interface FaceSwap {
  faceSwapId: string;
  userId: string;
  style: string;
  creditsUsed: number;
  status: 'processing' | 'completed' | 'failed';
  transactionId: string;
  errorMessage?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export interface CheckoutSession {
  sessionId: string;
  userId: string;
  packageId: string;
  credits: number;
  amountUSD: number; // En centavos
  status: 'pending' | 'completed' | 'expired';
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
