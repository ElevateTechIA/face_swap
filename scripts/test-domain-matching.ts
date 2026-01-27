/**
 * Script to test domain matching logic
 *
 * Usage:
 * npx tsx scripts/test-domain-matching.ts
 */

import { getAdminFirestore } from '../lib/firebase/admin';

async function testDomainMatching() {
  try {
    console.log('🔍 Testing domain matching logic...\n');

    const db = getAdminFirestore();

    // Test various domain formats
    const testDomains = [
      'face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app',
      'face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app:3000',
      'www.face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app',
      'https://face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app',
      'localhost',
      'localhost:3000',
    ];

    // Get all brand configs
    const brandsSnapshot = await db.collection('brandConfigs').get();
    console.log('📋 Brand Configs in Database:\n');
    brandsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - Domain: "${data.domain}"`);
      console.log(`     Name: ${data.name}`);
      console.log(`     Active: ${data.isActive}`);
      console.log('');
    });

    console.log('\n🧪 Testing domain normalization:\n');

    for (const testDomain of testDomains) {
      // Normalize like the brand service does
      const normalizedDomain = testDomain
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .replace(/\/$/, '')
        .replace(/:(\d+)$/, '') // Also remove port
        .toLowerCase();

      console.log(`Input: "${testDomain}"`);
      console.log(`Normalized: "${normalizedDomain}"`);

      // Check if it matches any brand
      const brandSnapshot = await db
        .collection('brandConfigs')
        .where('domain', '==', normalizedDomain)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (brandSnapshot.empty) {
        console.log(`❌ No match found - would use DEFAULT_BRAND`);
      } else {
        const brandData = brandSnapshot.docs[0].data();
        console.log(`✅ Match found: ${brandData.name}`);
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDomainMatching();
