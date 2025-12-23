import { NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

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
