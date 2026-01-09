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
    credits: 1000,
    priceUSD: 800, // $8.00 en centavos
    stripePriceId: 'price_1Sk9xaIGoSU0Z9WxbCZM2m7z',
    stripeProductId: 'prod_ThZ5biI4eGJxFY',
    description: '~12 Face Swaps',
    popular: false,
    active: true,
  },
  {
    packageId: 'creator',
    name: 'Creator',
    credits: 2200,
    priceUSD: 1500, // $15.00 en centavos
    stripePriceId: 'price_1Sk9zVIGoSU0Z9Wx7TDG0ysz',
    stripeProductId: 'prod_ThZ7K1K66rWpqH',
    description: '~27 Face Swaps',
    popular: false,
    active: true,
  },
  {
    packageId: 'pro',
    name: 'Pro',
    credits: 4000,
    priceUSD: 2500, // $25.00 en centavos
    stripePriceId: 'price_1SkA09IGoSU0Z9Wx6BzAIdwb',
    stripeProductId: 'prod_TepjcjMUd6Gq0H',
    description: '~50 Face Swaps',
    popular: true,
    active: true,
  },
  {
    packageId: 'ultra',
    name: 'Ultra',
    credits: 8000,
    priceUSD: 4500, // $45.00 en centavos
    stripePriceId: 'price_1SkA0XIGoSU0Z9WxhMLpeDs0',
    stripeProductId: 'prod_ThZ8889Zcr3qmF',
    description: '~100 Face Swaps',
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
