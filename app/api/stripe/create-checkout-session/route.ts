import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { stripe } from '@/lib/stripe/server';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await verifyUserAuth(request);

    // Obtener body del request
    const body = await request.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({ error: 'packageId es requerido' }, { status: 400 });
    }

    const db = getAdminFirestore();

    // Obtener el paquete de Firestore
    const packageDoc = await db.collection('creditPackages').doc(packageId).get();

    if (!packageDoc.exists) {
      return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 });
    }

    const packageData = packageDoc.data()!;

    if (!packageData.active) {
      return NextResponse.json({ error: 'Paquete no disponible' }, { status: 400 });
    }

    // Obtener o crear el usuario en Firestore
    const userRef = db.collection('users').doc(userId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Crear usuario si no existe
      const auth = getAdminAuth();
      const userRecord = await auth.getUser(userId);

      await userRef.set({
        userId,
        email: userRecord.email || '',
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || '',
        credits: 0,
        totalCreditsEarned: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      userDoc = await userRef.get();
    }

    const userData = userDoc.data()!;

    // Crear o obtener Stripe Customer
    let stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          userId,
        },
      });

      stripeCustomerId = customer.id;

      // Guardar stripeCustomerId en Firestore
      await userRef.update({
        stripeCustomerId,
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Stripe Customer creado: ${stripeCustomerId}`);
    }

    // Crear Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: packageData.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/credits/cancel`,
      metadata: {
        userId,
        packageId,
        credits: packageData.credits.toString(),
      },
    });

    // Guardar sesión en Firestore
    await db.collection('checkoutSessions').doc(session.id).set({
      sessionId: session.id,
      userId,
      packageId,
      credits: packageData.credits,
      amountUSD: packageData.priceUSD,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Checkout session creada: ${session.id}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('❌ Error en POST /api/stripe/create-checkout-session:', error.message);

    if (error.message.includes('autenticado') || error.message.includes('Token')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Error creando sesión de checkout' },
      { status: 500 }
    );
  }
}
