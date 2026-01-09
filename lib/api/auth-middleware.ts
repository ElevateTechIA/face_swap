import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';

/**
 * Verifica la autenticación del usuario a través del token de Firebase
 * @param request Request de Next.js
 * @returns userId del usuario autenticado
 * @throws Error si no está autenticado o el token es inválido
 */
export async function verifyUserAuth(request: NextRequest): Promise<string> {
  console.log('🔍 [verifyUserAuth] Iniciando verificación de usuario...');

  const authHeader = request.headers.get('authorization') || '';
  console.log(`🔍 [verifyUserAuth] Authorization header: ${authHeader ? `${authHeader.substring(0, 20)}...` : 'VACÍO'}`);

  if (!authHeader.startsWith('Bearer ')) {
    console.log('❌ [verifyUserAuth] No se encontró Bearer token');
    throw new Error('No autenticado');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  console.log(`🔍 [verifyUserAuth] Token extraído (primeros 20 chars): ${token.substring(0, 20)}...`);

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    console.log(`✅ [verifyUserAuth] Token válido. UID: ${decoded.uid}`);
    return decoded.uid;
  } catch (error: any) {
    console.error('❌ [verifyUserAuth] Error verificando token:', error.message);
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
  console.log('🔍 [verifyAdminAuth] Iniciando verificación de admin...');

  // Primero verificar autenticación normal
  const userId = await verifyUserAuth(request);
  console.log(`🔍 [verifyAdminAuth] UserId obtenido: ${userId}`);

  // Obtener lista de admin emails desde env
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  console.log(`🔍 [verifyAdminAuth] Admin emails configurados: ${adminEmails.join(', ')}`);

  // Obtener email del usuario
  const auth = getAdminAuth();
  const userRecord = await auth.getUser(userId);
  const userEmail = userRecord.email?.toLowerCase();
  console.log(`🔍 [verifyAdminAuth] Email del usuario: ${userEmail}`);

  if (!userEmail || !adminEmails.includes(userEmail)) {
    console.log(`❌ [verifyAdminAuth] Usuario NO es admin. Email: ${userEmail}, Admins: ${adminEmails.join(', ')}`);
    throw new Error('No autorizado - Se requieren privilegios de administrador');
  }

  console.log(`✅ [verifyAdminAuth] Admin verificado: ${userEmail}`);
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
