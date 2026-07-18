/**
 * Server-side Guest Trial Enforcement
 *
 * La fuente de verdad del trial de invitado vive en Firestore (colección
 * `guestTrials`, solo accesible vía Admin SDK), keyed por hash de IP.
 * El localStorage del cliente (lib/guest-trial.ts) es solo UX; este módulo
 * es quien realmente decide si un guest puede usar su trial.
 */

import { createHash } from 'crypto';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Debe coincidir con TRIAL_EXPIRY_DAYS de lib/guest-trial.ts
const TRIAL_EXPIRY_DAYS = 7;
const TRIAL_EXPIRY_MS = TRIAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export const GUEST_TRIAL_COOKIE = 'fs_guest_trial';
export const GUEST_TRIAL_COOKIE_MAX_AGE = TRIAL_EXPIRY_DAYS * 24 * 60 * 60; // segundos

/**
 * Hash del identificador del guest (IP). No se guarda la IP en claro.
 */
export function hashGuestIdentifier(ip: string): string {
  const salt = process.env.GUEST_TRIAL_SALT || 'face-swap-guest-trial-v1';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 40);
}

// Un swap grupal hace una llamada por cara; se permiten como continuación
// del mismo trial dentro de una ráfaga corta, con tope de caras.
const GROUP_BURST_WINDOW_MS = 15 * 60 * 1000;
const MAX_SWAPS_PER_TRIAL = 6;

/**
 * Consume el trial de forma atómica. Retorna allowed=false si esta IP
 * ya usó su trial dentro de la ventana de expiración.
 *
 * isGroupContinuation: caras 2..N de un swap grupal — se permiten dentro
 * de la ráfaga del trial ya consumido (máx MAX_SWAPS_PER_TRIAL).
 */
export async function consumeGuestTrial(
  ipHash: string,
  opts?: { isGroupContinuation?: boolean }
): Promise<{ allowed: boolean }> {
  const db = getAdminFirestore();
  const ref = db.collection('guestTrials').doc(ipHash);

  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);
    const now = Date.now();

    if (!doc.exists) {
      transaction.set(ref, { usedAt: FieldValue.serverTimestamp(), swapCount: 1 });
      return { allowed: true };
    }

    const data = doc.data()!;
    const usedAtMs = (data.usedAt as Timestamp | undefined)?.toMillis() ?? now;
    const swapCount = (data.swapCount as number) || 1;

    // Trial expirado: resetear y permitir de nuevo
    if (now - usedAtMs >= TRIAL_EXPIRY_MS) {
      transaction.set(ref, { usedAt: FieldValue.serverTimestamp(), swapCount: 1 });
      return { allowed: true };
    }

    // Continuación de swap grupal dentro de la ráfaga
    if (
      opts?.isGroupContinuation &&
      now - usedAtMs < GROUP_BURST_WINDOW_MS &&
      swapCount < MAX_SWAPS_PER_TRIAL
    ) {
      transaction.update(ref, { swapCount: FieldValue.increment(1) });
      return { allowed: true };
    }

    return { allowed: false };
  });
}

/**
 * Devuelve el trial si el swap falló, para que un guest legítimo
 * pueda reintentar. Best-effort: un fallo aquí no debe romper el flujo.
 */
export async function refundGuestTrial(ipHash: string): Promise<void> {
  try {
    const db = getAdminFirestore();
    await db.collection('guestTrials').doc(ipHash).delete();
  } catch (error: any) {
    console.error('⚠️ Error refunding guest trial:', error.message);
  }
}
