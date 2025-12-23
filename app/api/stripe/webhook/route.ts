import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    console.error('❌ No signature header');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('❌ Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    // Verificar firma de Stripe (crítico para seguridad)
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`✅ Webhook recibido: ${event.type}`);

  // Manejar eventos de Stripe
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`❌ Error procesando webhook ${event.type}:`, error.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { id: sessionId, metadata } = session;

  if (!metadata || !metadata.userId || !metadata.packageId || !metadata.credits) {
    console.error('❌ Missing metadata in checkout session:', sessionId);
    return;
  }

  const { userId, packageId, credits: creditsStr } = metadata;
  const credits = parseInt(creditsStr);

  console.log(`💳 Processing payment for user ${userId}, package ${packageId}, credits ${credits}`);

  const db = getAdminFirestore();

  // Verificar si ya se procesó (idempotencia)
  const sessionDoc = await db.collection('checkoutSessions').doc(sessionId).get();

  if (!sessionDoc.exists) {
    console.error('❌ Session not found in database:', sessionId);
    return;
  }

  const sessionData = sessionDoc.data()!;

  if (sessionData.status === 'completed') {
    console.log('⚠️ Session already processed, skipping:', sessionId);
    return;
  }

  try {
    // Usar transacción atómica de Firestore
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error(`User ${userId} not found`);
      }

      const userData = userDoc.data()!;
      const currentCredits = userData.credits || 0;
      const newCredits = currentCredits + credits;

      // Actualizar créditos del usuario
      transaction.update(userRef, {
        credits: newCredits,
        totalCreditsEarned: FieldValue.increment(credits),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Crear registro de transacción
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        userId,
        type: 'purchase',
        credits,
        balanceBefore: currentCredits,
        balanceAfter: newCredits,
        description: `Compra de paquete: ${packageId}`,
        metadata: {
          packageId,
          sessionId,
        },
        createdAt: FieldValue.serverTimestamp(),
      });

      // Actualizar estado de la sesión
      const sessionRef = db.collection('checkoutSessions').doc(sessionId);
      transaction.update(sessionRef, {
        status: 'completed',
        completedAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Credits granted: ${userId} now has ${newCredits} credits (+${credits})`);
    });
  } catch (error: any) {
    console.error('❌ Transaction failed:', error.message);
    throw error;
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const { id: sessionId } = session;

  console.log(`⏱️ Checkout session expired: ${sessionId}`);

  const db = getAdminFirestore();
  const sessionRef = db.collection('checkoutSessions').doc(sessionId);

  await sessionRef.update({
    status: 'expired',
  });
}
