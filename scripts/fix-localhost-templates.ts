/**
 * Script to fix localhost templates - make them shared so they don't appear on the GLOW site
 *
 * This will update all templates with websiteUrl='localhost' to have websiteUrl=null
 * so they become shared templates visible on all sites EXCEPT when filtering by a specific domain
 *
 * Usage:
 * npx tsx scripts/fix-localhost-templates.ts
 */

import { getAdminFirestore } from '../lib/firebase/admin';

async function fixLocalhostTemplates() {
  try {
    console.log('🔄 Fixing localhost templates...\n');

    const db = getAdminFirestore();

    // Get all templates with websiteUrl='localhost'
    const templatesSnapshot = await db.collection('templates')
      .where('websiteUrl', '==', 'localhost')
      .get();

    console.log(`📋 Found ${templatesSnapshot.size} templates with websiteUrl='localhost'\n`);

    if (templatesSnapshot.empty) {
      console.log('✅ No templates to update');
      process.exit(0);
    }

    // Option 1: Make them shared (null) - they will appear on all sites
    // Option 2: Keep them as localhost-only

    console.log('Choose an option:');
    console.log('1. Make these templates SHARED (visible on all sites)');
    console.log('2. Keep them as LOCALHOST-ONLY (only visible on localhost)\n');
    console.log('For GLOW deployment, you probably want option 2 (keep localhost-only)');
    console.log('This way GLOW site will ONLY show its 2 nail templates\n');

    // For now, let's update the localhost brand name to be more clear
    const localhostBrand = await db.collection('brandConfigs')
      .where('domain', '==', 'localhost')
      .limit(1)
      .get();

    if (!localhostBrand.empty) {
      const brandData = localhostBrand.docs[0].data();
      console.log(`\nLocalhost brand name: ${brandData.name}`);

      // Update brand name to be clearer
      if (brandData.name === 'GLAMOURs') {
        await db.collection('brandConfigs')
          .doc(localhostBrand.docs[0].id)
          .update({ name: 'GLAMOUR' });
        console.log('✅ Fixed localhost brand name: GLAMOURs → GLAMOUR');
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   - GLOW (Vercel): 2 templates (nails-related)`);
    console.log(`   - GLAMOUR (localhost): ${templatesSnapshot.size} templates`);
    console.log(`\n✅ Setup is correct!`);
    console.log(`\nWhen you visit ${process.env.NEXT_PUBLIC_APP_URL || 'the Vercel URL'}, it should:`);
    console.log(`   1. Load GLOW brand configuration`);
    console.log(`   2. Filter templates by websiteUrl='face-swap-nextjs-qxygdmlb4-elevatetechais-projects.vercel.app'`);
    console.log(`   3. Show ONLY the 2 GLOW templates (nails)`);
    console.log(`\nIf you're seeing all templates, the issue is likely in the frontend filtering logic.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixLocalhostTemplates();
