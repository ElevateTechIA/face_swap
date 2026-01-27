/**
 * Script para asignar templates a sus marcas correspondientes
 *
 * Usage:
 * npx tsx scripts/assign-templates-to-brands.ts
 */

import { getAdminFirestore } from '../lib/firebase/admin';

async function assignTemplatesToBrands() {
  try {
    console.log('🔄 Asignando templates a marcas...\n');

    const db = getAdminFirestore();

    // Obtener todos los templates
    const templatesSnapshot = await db.collection('templates').get();
    console.log(`📋 Templates encontrados: ${templatesSnapshot.size}\n`);

    // Obtener configuraciones de marca
    const brandsSnapshot = await db.collection('brandConfigs').get();
    const brands: Record<string, string> = {};

    brandsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      brands[data.name] = data.domain;
      console.log(`✅ Marca encontrada: ${data.name} (${data.domain})`);
    });

    console.log('\n');

    // Palabras clave para identificar templates de uñas/nails
    const nailsKeywords = ['nail', 'uña', 'manicure', 'pedicure', 'french', 'gel'];

    let updatedCount = 0;

    // Procesar cada template
    for (const templateDoc of templatesSnapshot.docs) {
      const template = templateDoc.data();
      const title = template.title?.toLowerCase() || '';
      const description = template.description?.toLowerCase() || '';

      // Determinar si es un template de uñas/nails
      const isNailsTemplate = nailsKeywords.some(keyword =>
        title.includes(keyword) || description.includes(keyword)
      );

      let websiteUrl: string | null = null;
      let brandName = '';

      if (isNailsTemplate) {
        // Asignar a GLOW
        websiteUrl = brands['GLOW'] || 'glow.com';
        brandName = 'GLOW';
      } else {
        // Asignar a GLAMOUR
        websiteUrl = brands['GLAMOUR'] || 'localhost';
        brandName = 'GLAMOUR';
      }

      // Actualizar el template
      await db.collection('templates').doc(templateDoc.id).update({
        websiteUrl: websiteUrl,
        updatedAt: new Date(),
      });

      console.log(`✅ "${template.title}" → ${brandName} (${websiteUrl})`);
      updatedCount++;
    }

    console.log(`\n🎉 Proceso completado!`);
    console.log(`📊 Templates actualizados: ${updatedCount}`);
    console.log(`\n💡 Ahora puedes:`)
    console.log(`   1. Ir a /admin y filtrar por marca`);
    console.log(`   2. Ver que los templates aparecen en su marca correcta`);
    console.log(`   3. Editar cualquier template si la asignación automática no fue correcta`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error asignando templates:', error);
    process.exit(1);
  }
}

assignTemplatesToBrands();
