/**
 * Script to seed initial brand configurations in Firestore
 *
 * Usage:
 * npx tsx scripts/seed-brand-configs.ts
 */

import { getAdminFirestore } from '../lib/firebase/admin';
import { BrandConfig } from '../types/brand';

const brandConfigs: Omit<BrandConfig, 'id'>[] = [
  {
    domain: 'localhost',
    name: 'GLAMOUR',
    logo: '/logo.png', // Default logo in public folder
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    domain: 'localhost',
    name: 'GLOW',
    logo: '/logo.png', // Nails brand logo
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more brand configurations here as needed
  // Example:
  // {
  //   domain: 'faceswap-pro.com',
  //   name: 'FaceSwap Pro',
  //   logo: 'https://firebasestorage.googleapis.com/.../logo-faceswap-pro.png',
  //   themeId: 'ocean',
  //   isActive: true,
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // },
];

async function seedBrandConfigs() {
  try {
    console.log('🌱 Starting brand configs seeding...');

    const db = getAdminFirestore();

    for (const config of brandConfigs) {
      // Check if brand config already exists by name
      const existingBrand = await db
        .collection('brandConfigs')
        .where('name', '==', config.name)
        .limit(1)
        .get();

      if (!existingBrand.empty) {
        console.log(`⚠️ Brand config for "${config.name}" already exists, skipping...`);
        continue;
      }

      // Create new brand config
      const docRef = await db.collection('brandConfigs').add(config);
      console.log(`✅ Created brand config for "${config.name}" (${config.domain}) - ID: ${docRef.id}`);
    }

    console.log('🎉 Brand configs seeding completed!');
    console.log('\n📝 Instructions:');
    console.log('1. To add a new brand, create a document in the "brandConfigs" collection');
    console.log('2. Required fields: domain, name, logo, isActive');
    console.log('3. Optional fields: favicon, themeId, customColors');
    console.log('4. Templates can be filtered by domain using the "websiteUrl" field');
    console.log('\n💡 Example: If you deploy to "mysite.com", create a brand config with domain="mysite.com"');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding brand configs:', error);
    process.exit(1);
  }
}

seedBrandConfigs();
