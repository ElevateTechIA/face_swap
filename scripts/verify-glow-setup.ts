/**
 * Script to verify GLOW brand and template setup
 *
 * Usage:
 * npx tsx scripts/verify-glow-setup.ts
 */

import { getAdminFirestore } from '../lib/firebase/admin';

async function verifySetup() {
  try {
    const db = getAdminFirestore();
    const vercelDomain = 'face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app';

    console.log('🔍 Verifying GLOW setup...\n');

    // Check brand config
    const brandSnapshot = await db.collection('brandConfigs')
      .where('domain', '==', vercelDomain)
      .limit(1)
      .get();

    if (brandSnapshot.empty) {
      console.log('❌ No brand config found for Vercel domain');
    } else {
      const brand = brandSnapshot.docs[0].data();
      console.log('✅ Brand Config Found:');
      console.log('   Name:', brand.name);
      console.log('   Domain:', brand.domain);
      console.log('   Active:', brand.isActive);
      console.log('');
    }

    // Check templates
    const templatesSnapshot = await db.collection('templates').get();

    console.log('📋 Templates by websiteUrl:\n');

    let glowCount = 0;
    let localhostCount = 0;
    let sharedCount = 0;

    const glowTemplates: string[] = [];
    const localhostTemplates: string[] = [];
    const sharedTemplates: string[] = [];

    templatesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const url = data.websiteUrl;

      if (url === vercelDomain) {
        glowCount++;
        glowTemplates.push(data.title);
      } else if (url === 'localhost') {
        localhostCount++;
        localhostTemplates.push(data.title);
      } else if (!url) {
        sharedCount++;
        sharedTemplates.push(data.title);
      }
    });

    console.log(`GLOW (${vercelDomain}): ${glowCount} templates`);
    glowTemplates.forEach(title => console.log(`  - ${title}`));
    console.log('');

    console.log(`Localhost: ${localhostCount} templates`);
    localhostTemplates.slice(0, 5).forEach(title => console.log(`  - ${title}`));
    if (localhostCount > 5) console.log(`  ... and ${localhostCount - 5} more`);
    console.log('');

    console.log(`Shared: ${sharedCount} templates`);
    console.log('');

    console.log('📊 Summary:');
    console.log(`   Total templates: ${templatesSnapshot.size}`);
    console.log(`   GLOW templates: ${glowCount}`);
    console.log(`   Localhost templates: ${localhostCount}`);
    console.log(`   Shared templates: ${sharedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifySetup();
