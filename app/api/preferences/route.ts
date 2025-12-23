import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isAdminConfigured } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

async function getUserIdFromRequest(request: NextRequest) {
  // En desarrollo sin credenciales de Admin, usamos un userId por defecto
  if (!isAdminConfigured()) {
    console.log('⚠️ Firebase Admin no configurado, usando userId de desarrollo');
    return { userId: 'dev-user' };
  }

  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    console.log('✅ Usuario autenticado:', decoded.uid);
    return { userId: decoded.uid };
  } catch (error: any) {
    console.error('❌ Error verificando token:', error.message);
    return { error: NextResponse.json({ error: 'Token inválido' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserIdFromRequest(request);
    if ('error' in auth) return auth.error;
    
    const userId = auth.userId;

    // Obtener de Firestore
    const db = getAdminFirestore();
    const docRef = db.collection('userPreferences').doc(userId);
    const doc = await docRef.get();

    const preferences = doc.exists ? doc.data() : null;

    console.log(`📖 GET preferences para userId: ${userId}`, preferences);
    return NextResponse.json({ preferences });
  } catch (error: any) {
    console.error('❌ Error en GET /api/preferences:', error.message);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserIdFromRequest(request);
    if ('error' in auth) return auth.error;
    
    const userId = auth.userId;
    const body = await request.json();

    // Guardar en Firestore
    const db = getAdminFirestore();
    const docRef = db.collection('userPreferences').doc(userId);
    await docRef.set(body, { merge: true });

    console.log(`💾 POST preferences para userId: ${userId}`, body);
    return NextResponse.json({ success: true, preferences: body });
  } catch (error: any) {
    console.error('❌ Error en POST /api/preferences:', error.message);
    return NextResponse.json({ error: error.message || 'Error al guardar preferencias' }, { status: 500 });
  }
}
