/**
 * Assigns all templates without a brand (websiteUrl empty/null) to GLOW
 *
 * Usage:
 * npx tsx scripts/assign-unbranded-to-glow.ts
 */

import { getAdminFirestore } from '../lib/firebase/admin';

async function assignUnbrandedToGlow() {
  try {
    const db = getAdminFirestore();

    // Get GLOW domain from brandConfigs
    const brandSnapshot = await db.collection('brandConfigs')
      .where('name', '==', 'GLOW')
      .limit(1)
      .get();

    if (brandSnapshot.empty) {
      console.error('❌ No brand config found with name "GLOW"');
      process.exit(1);
    }

    const glowDomain = brandSnapshot.docs[0].data().domain;
    console.log(`✅ GLOW domain: ${glowDomain}\n`);

    // Find all templates with no websiteUrl
    const templatesSnapshot = await db.collection('templates')
      .where('websiteUrl', '==', null)
      .get();

    // Firestore doesn't query for missing fields, so also fetch all and filter
    const allTemplatesSnapshot = await db.collection('templates').get();
    const unbrandedDocs = allTemplatesSnapshot.docs.filter(doc => {
      const url = doc.data().websiteUrl;
      return !url || url === '';
    });

    console.log(`📋 Templates sin marca encontrados: ${unbrandedDocs.length}\n`);

    if (unbrandedDocs.length === 0) {
      console.log('✅ No hay templates sin marca.');
      process.exit(0);
    }

    const batch = db.batch();
    unbrandedDocs.forEach(doc => {
      batch.update(doc.ref, {
        websiteUrl: glowDomain,
        updatedAt: new Date(),
      });
      console.log(`  → "${doc.data().title}" asignado a GLOW (${glowDomain})`);
    });

    await batch.commit();

    console.log(`\n🎉 Completado! ${unbrandedDocs.length} templates asignados a GLOW.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignUnbrandedToGlow();
