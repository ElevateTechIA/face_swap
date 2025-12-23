/**
 * Script para crear los paquetes de créditos en Firestore
 * Ejecutar una sola vez: npx tsx scripts/seed-credit-packages.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

// Definición de paquetes
const packages = [
  {
    packageId: 'starter',
    name: 'Starter',
    credits: 10,
    priceUSD: 999, // $9.99 en centavos
    stripePriceId: 'price_1ShW1RIGoSU0Z9Wx8YErhZJa',
    stripeProductId: 'prod_TepgcwlafBj39q',
    description: '10 Face Swaps',
    popular: false,
    active: true,
  },
  {
    packageId: 'pro',
    name: 'Pro',
    credits: 30,
    priceUSD: 2499, // $24.99 en centavos
    stripePriceId: 'price_1ShW30IGoSU0Z9Wx5cSre7MC',
    stripeProductId: 'prod_Tepi9qdceb47e8',
    description: '30 Face Swaps',
    popular: true,
    active: true,
  },
  {
    packageId: 'ultimate',
    name: 'Ultimate',
    credits: 100,
    priceUSD: 4999, // $49.99 en centavos
    stripePriceId: 'price_1ShW3uIGoSU0Z9Wxa0E5kS8b',
    stripeProductId: 'prod_TepjcjMUd6Gq0H',
    description: '100 Face Swaps',
    popular: false,
    active: true,
  },
];

async function seedPackages() {
  try {
    console.log('🌱 Iniciando seed de paquetes de créditos...\n');

    for (const pkg of packages) {
      const docRef = db.collection('creditPackages').doc(pkg.packageId);

      // Verificar si ya existe
      const existingDoc = await docRef.get();

      if (existingDoc.exists) {
        console.log(`⚠️  El paquete "${pkg.name}" ya existe, actualizando...`);
        await docRef.update({
          ...pkg,
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`✅ Paquete "${pkg.name}" actualizado`);
      } else {
        await docRef.set({
          ...pkg,
          createdAt: FieldValue.serverTimestamp(),
        });
        console.log(`✅ Paquete "${pkg.name}" creado`);
      }

      // Mostrar resumen
      console.log(`   - ${pkg.credits} créditos por $${(pkg.priceUSD / 100).toFixed(2)}`);
      console.log(`   - Price ID: ${pkg.stripePriceId}`);
      console.log('');
    }

    console.log('🎉 ¡Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   - Total de paquetes: ${packages.length}`);
    console.log(`   - Paquete popular: ${packages.find(p => p.popular)?.name}`);
    console.log('');
    console.log('✨ Puedes verificar los paquetes en Firebase Console:');
    console.log('   https://console.firebase.google.com → Firestore → creditPackages');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error durante el seed:', error.message);
    process.exit(1);
  }
}

// Ejecutar seed
seedPackages();
