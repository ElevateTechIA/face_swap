import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await verifyUserAuth(request);

    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    // Si el usuario no existe, crearlo con créditos de bienvenida
    if (!userDoc.exists) {
      const auth = getAdminAuth();
      const userRecord = await auth.getUser(userId);

      // 10 créditos de bienvenida (valor: ~$1.40 USD)
      const welcomeCredits = parseInt(process.env.WELCOME_CREDITS || '10');

      const newUserData = {
        userId,
        email: userRecord.email || '',
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || '',
        credits: welcomeCredits,
        totalCreditsEarned: welcomeCredits,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await userRef.set(newUserData);

      // Crear transacción de bienvenida
      await db.collection('transactions').add({
        userId,
        type: 'bonus',
        credits: welcomeCredits,
        balanceBefore: 0,
        balanceAfter: welcomeCredits,
        description: 'Créditos de bienvenida',
        createdAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Usuario nuevo creado con ${welcomeCredits} créditos:`, userId);

      return NextResponse.json({
        credits: welcomeCredits,
        userId,
      });
    }

    // Usuario existe, retornar su balance
    const userData = userDoc.data();
    const credits = userData?.credits || 0;

    return NextResponse.json({
      credits,
      userId,
    });
  } catch (error: any) {
    console.error('❌ Error en GET /api/credits/balance:', error.message);

    if (error.message.includes('autenticado') || error.message.includes('Token')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Error al obtener balance de créditos' },
      { status: 500 }
    );
  }
}
