/**
 * Script para agregar el campo 'categories' a templates existentes en Firestore
 *
 * Este script:
 * 1. Lee todos los templates en Firestore
 * 2. Para cada template sin el campo 'categories', lo agrega basándose en metadata.occasion
 * 3. Siempre incluye 'trending' como categoría por defecto
 *
 * Uso:
 *   npx tsx scripts/add-categories-field.ts
 */

// Cargar variables de entorno
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Cargar .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Variables de entorno cargadas desde .env.local\n');
}

import { getAdminFirestore } from '../lib/firebase/admin';
import { Category } from '../types/template';

// Mapeo de occasions a categories
const OCCASION_TO_CATEGORY: Record<string, Category> = {
  'new-year': 'new-year',
  'birthday': 'birthday',
  'wedding': 'wedding',
  'casual': 'casual',
  'professional': 'professional',
  'date': 'date',
  'party': 'party',
};

async function addCategoriesField() {
  console.log('🚀 Iniciando actualización de templates con campo categories...\n');

  try {
    const db = getAdminFirestore();
    const templatesRef = db.collection('templates');

    // Obtener todos los templates
    const snapshot = await templatesRef.get();
    console.log(`📁 Encontrados ${snapshot.size} templates en Firestore\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const templateId = doc.id;
      const title = data.title || 'Sin título';

      try {
        // Verificar si ya tiene el campo categories
        if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          console.log(`⏭️  Saltando: ${title} (ya tiene categories: ${data.categories.join(', ')})`);
          skippedCount++;
          continue;
        }

        // Crear categories basado en metadata.occasion
        const categories: Category[] = ['trending']; // Siempre incluir trending

        if (data.metadata && data.metadata.occasion && Array.isArray(data.metadata.occasion)) {
          for (const occasion of data.metadata.occasion) {
            const category = OCCASION_TO_CATEGORY[occasion];
            if (category && !categories.includes(category)) {
              categories.push(category);
            }
          }
        }

        // También revisar el campo category (singular) legacy
        if (data.category) {
          const legacyCategory = OCCASION_TO_CATEGORY[data.category];
          if (legacyCategory && !categories.includes(legacyCategory)) {
            categories.push(legacyCategory);
          }
        }

        // Actualizar el documento
        await templatesRef.doc(templateId).update({
          categories,
        });

        console.log(`✅ Actualizado: ${title}`);
        console.log(`   Categories: ${categories.join(', ')}`);
        console.log('');
        updatedCount++;

      } catch (error: any) {
        console.error(`❌ Error actualizando ${title}:`, error.message);
        console.log('');
        errorCount++;
      }
    }

    console.log('\n📊 Resumen de actualización:');
    console.log(`   ✅ Actualizados: ${updatedCount}`);
    console.log(`   ⏭️  Saltados (ya tenían categories): ${skippedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📝 Total: ${snapshot.size}`);

    if (updatedCount > 0) {
      console.log('\n🎉 Actualización completada! Todos los templates ahora tienen el campo categories.');
    }

  } catch (error: any) {
    console.error('❌ Error fatal en actualización:', error.message);
    process.exit(1);
  }
}

// Ejecutar actualización
addCategoriesField()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
