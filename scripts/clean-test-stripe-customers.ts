/**
 * Script para limpiar los stripeCustomerId de modo TEST
 * Ejecutar: npx tsx scripts/clean-test-stripe-customers.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

// Inicializar Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

    initializeApp({
      credential: cert(serviceAccount),
    });

    console.log('✅ Firebase Admin inicializado');
  } catch (error: any) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = getFirestore();

async function cleanTestStripeCustomers() {
  try {
    console.log('🧹 Limpiando stripeCustomerId de modo TEST...\n');

    const usersSnapshot = await db.collection('users').get();

    let cleaned = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      if (userData.stripeCustomerId && userData.stripeCustomerId.startsWith('cus_T')) {
        console.log(`🔍 Usuario: ${userData.email || userDoc.id}`);
        console.log(`   - Customer ID (TEST): ${userData.stripeCustomerId}`);

        await userDoc.ref.update({
          stripeCustomerId: null,
        });

        console.log(`   ✅ Customer ID eliminado\n`);
        cleaned++;
      }
    }

    if (cleaned === 0) {
      console.log('ℹ️  No se encontraron customers de modo TEST');
    } else {
      console.log(`\n🎉 ¡Limpieza completada!`);
      console.log(`   - Usuarios limpiados: ${cleaned}`);
      console.log(`\n💡 Ahora puedes intentar comprar de nuevo y se creará un customer en modo LIVE`);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error durante la limpieza:', error.message);
    process.exit(1);
  }
}

cleanTestStripeCustomers();
