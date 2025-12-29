import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';

/**
 * Verifica la autenticación del usuario a través del token de Firebase
 * @param request Request de Next.js
 * @returns userId del usuario autenticado
 * @throws Error si no está autenticado o el token es inválido
 */
export async function verifyUserAuth(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization') || '';

  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('No autenticado');
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch (error: any) {
    console.error('Error verificando token:', error.message);
    throw new Error('Token inválido o expirado');
  }
}

/**
 * Verifica que el usuario sea administrador
 * @param request Request de Next.js
 * @returns userId del usuario administrador
 * @throws Error si no está autenticado o no es admin
 */
export async function verifyAdminAuth(request: NextRequest): Promise<string> {
  // Primero verificar autenticación normal
  const userId = await verifyUserAuth(request);

  // Obtener lista de admin emails desde env
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];

  // Obtener email del usuario
  const auth = getAdminAuth();
  const userRecord = await auth.getUser(userId);
  const userEmail = userRecord.email?.toLowerCase();

  if (!userEmail || !adminEmails.includes(userEmail)) {
    throw new Error('No autorizado - Se requieren privilegios de administrador');
  }

  console.log(`✅ Admin verified: ${userEmail}`);
  return userId;
}

/**
 * Verifica si un usuario tiene privilegios de administrador (sin lanzar error)
 * @param userId ID del usuario
 * @returns true si es admin, false si no
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    const auth = getAdminAuth();
    const userRecord = await auth.getUser(userId);
    const userEmail = userRecord.email?.toLowerCase();

    return !!userEmail && adminEmails.includes(userEmail);
  } catch {
    return false;
  }
}
