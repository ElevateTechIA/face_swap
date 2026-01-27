/**
 * Script to update GLOW templates to use the correct Vercel domain
 *
 * Usage:
 * npx tsx scripts/update-glow-domain.ts
 */

import { getAdminFirestore } from '../lib/firebase/admin';

async function updateGlowTemplates() {
  try {
    console.log('🔄 Updating GLOW templates to use Vercel domain...\n');

    const db = getAdminFirestore();
    const vercelDomain = 'face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app';

    // Find templates that should belong to GLOW (nails keywords)
    const nailsKeywords = ['nail', 'uña', 'manicure', 'pedicure', 'french', 'gel'];
    const templatesSnapshot = await db.collection('templates').get();

    const batch = db.batch();
    let updatedCount = 0;

    templatesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const title = (data.title || '').toLowerCase();
      const description = (data.description || '').toLowerCase();

      const isNailsTemplate = nailsKeywords.some(keyword =>
        title.includes(keyword) || description.includes(keyword)
      );

      if (isNailsTemplate && data.websiteUrl !== vercelDomain) {
        batch.update(doc.ref, {
          websiteUrl: vercelDomain,
          updatedAt: new Date(),
        });
        console.log(`✅ Updating "${data.title}" → GLOW (${vercelDomain})`);
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`\n🎉 Updated ${updatedCount} templates to use GLOW domain`);
    } else {
      console.log('\n✅ All templates already have correct domain');
    }

    console.log('\n💡 Now when you visit the Vercel URL, only GLOW templates (nails) should appear');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating templates:', error);
    process.exit(1);
  }
}

updateGlowTemplates();
