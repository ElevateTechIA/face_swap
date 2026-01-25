/**
 * Script de migración de templates a Firebase
 *
 * Este script migra los templates hardcodeados actuales a Firebase:
 * 1. Lee las imágenes de la carpeta public/templates/
 * 2. Las sube a Firebase Storage
 * 3. Crea documentos en Firestore con metadata completa
 *
 * Uso:
 *   npx tsx scripts/migrate-templates.ts
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

import { getAdminFirestore, getAdminStorage } from '../lib/firebase/admin';
import { Template, TemplateMetadata } from '../types/template';
import { FieldValue } from 'firebase-admin/firestore';

// Metadata para cada template
const TEMPLATES_METADATA: Record<string, {
  title: string;
  description: string;
  prompt: string;
  metadata: TemplateMetadata;
  isPremium?: boolean;
}> = {
  'Midnight Celebration': {
    title: 'Midnight Celebration',
    description: 'Celebra el Año Nuevo con estilo. Perfecto para la cuenta regresiva de medianoche con un look elegante y festivo.',
    prompt: `Perform a precise face swap: Take ONLY the face from image 2 (the person's face) and seamlessly swap it onto the person in image 1, preserving all other elements of image 1 including clothing, body, background, lighting, and atmosphere. The face from image 2 should blend naturally with the lighting and style of image 1.`,
    metadata: {
      bodyType: ['slim', 'athletic', 'average'],
      style: ['elegant', 'party', 'modern'],
      mood: ['happy', 'confident', 'energetic'],
      occasion: ['new-year', 'party'],
      setting: ['indoor'],
      framing: 'portrait',
      lighting: 'dramatic',
      colorPalette: ['warm', 'vibrant'],
      qualityScore: 90,
      tags: ['año nuevo', 'fiesta', 'elegante', 'medianoche'],
    },
  },
  'The Champagne Toast': {
    title: 'The Champagne Toast',
    description: 'Brinda con champagne en un ambiente sofisticado. Ideal para celebraciones elegantes y momentos especiales.',
    prompt: `Perform a precise face swap: Take ONLY the face from image 2 (the person's face) and seamlessly swap it onto the person in image 1, preserving all other elements of image 1 including clothing, body, background, lighting, and atmosphere. The face from image 2 should blend naturally with the lighting and style of image 1.`,
    metadata: {
      bodyType: ['slim', 'athletic', 'average'],
      style: ['elegant', 'professional', 'romantic'],
      mood: ['confident', 'happy', 'relaxed'],
      occasion: ['new-year', 'wedding', 'party'],
      setting: ['indoor'],
      framing: 'medium',
      lighting: 'soft',
      colorPalette: ['warm', 'neutral'],
      qualityScore: 95,
      tags: ['champagne', 'brindis', 'elegante', 'sofisticado'],
    },
  },
  'Red Velvet Euphoria': {
    title: 'Red Velvet Euphoria',
    description: 'Look glamoroso con terciopelo rojo. Perfecto para destacar en fiestas nocturnas con un estilo audaz.',
    prompt: `Perform a precise face swap: Take ONLY the face from image 2 (the person's face) and seamlessly swap it onto the person in image 1, preserving all other elements of image 1 including clothing, body, background, lighting, and atmosphere. The face from image 2 should blend naturally with the lighting and style of image 1.`,
    metadata: {
      bodyType: ['slim', 'athletic', 'curvy'],
      style: ['elegant', 'edgy', 'party'],
      mood: ['confident', 'mysterious', 'energetic'],
      occasion: ['new-year', 'party', 'date'],
      setting: ['indoor'],
      framing: 'portrait',
      lighting: 'dramatic',
      colorPalette: ['warm', 'vibrant'],
      qualityScore: 92,
      tags: ['rojo', 'glamour', 'terciopelo', 'audaz'],
    },
  },
  'City Lights Glam': {
    title: 'City Lights Glam',
    description: 'Glamour urbano con luces de ciudad. Ideal para un look sofisticado en ambiente nocturno cosmopolita.',
    prompt: `Perform a precise face swap: Take ONLY the face from image 2 (the person's face) and seamlessly swap it onto the person in image 1, preserving all other elements of image 1 including clothing, body, background, lighting, and atmosphere. The face from image 2 should blend naturally with the lighting and style of image 1.`,
    metadata: {
      bodyType: ['slim', 'athletic', 'average'],
      style: ['modern', 'elegant', 'professional'],
      mood: ['confident', 'relaxed', 'mysterious'],
      occasion: ['new-year', 'date', 'professional'],
      setting: ['outdoor'],
      framing: 'medium',
      lighting: 'neon',
      colorPalette: ['cool', 'vibrant'],
      qualityScore: 88,
      tags: ['ciudad', 'luces', 'urbano', 'nocturno'],
    },
  },
  'Confetti Party': {
    title: 'Confetti Party',
    description: 'Celebración llena de confeti y alegría. Perfecto para capturar la energía y diversión de una gran fiesta.',
    prompt: `Perform a precise face swap: Take ONLY the face from image 2 (the person's face) and seamlessly swap it onto the person in image 1, preserving all other elements of image 1 including clothing, body, background, lighting, and atmosphere. The face from image 2 should blend naturally with the lighting and style of image 1.`,
    metadata: {
      bodyType: ['average', 'slim', 'athletic'],
      style: ['casual', 'party', 'modern'],
      mood: ['happy', 'energetic', 'playful'],
      occasion: ['new-year', 'birthday', 'party'],
      setting: ['indoor'],
      framing: 'full-body',
      lighting: 'natural',
      colorPalette: ['vibrant', 'warm'],
      qualityScore: 85,
      tags: ['confeti', 'fiesta', 'alegre', 'diversión'],
    },
  },
  'Elegant Countdown': {
    title: 'Elegant Countdown',
    description: 'Elegancia refinada para la cuenta regresiva. Look clásico y sofisticado para recibir el año nuevo con estilo.',
    prompt: `Perform a precise face swap: Take ONLY the face from image 2 (the person's face) and seamlessly swap it onto the person in image 1, preserving all other elements of image 1 including clothing, body, background, lighting, and atmosphere. The face from image 2 should blend naturally with the lighting and style of image 1.`,
    metadata: {
      bodyType: ['slim', 'athletic', 'average'],
      style: ['elegant', 'vintage', 'romantic'],
      mood: ['confident', 'relaxed', 'happy'],
      occasion: ['new-year', 'wedding', 'professional'],
      setting: ['indoor'],
      framing: 'portrait',
      lighting: 'soft',
      colorPalette: ['neutral', 'warm'],
      qualityScore: 93,
      tags: ['elegante', 'clásico', 'refinado', 'sofisticado'],
    },
  },
};

async function migrateTemplates() {
  console.log('🚀 Iniciando migración de templates a Firebase...\n');

  try {
    const db = getAdminFirestore();
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    const templatesDir = path.join(process.cwd(), 'public', 'templates');

    if (!fs.existsSync(templatesDir)) {
      throw new Error(`Directorio de templates no encontrado: ${templatesDir}`);
    }

    const files = fs.readdirSync(templatesDir);
    const imageFiles = files.filter(f => f.match(/\.(jpg|jpeg|png)$/i));

    console.log(`📁 Encontrados ${imageFiles.length} archivos de imagen\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const imageFile of imageFiles) {
      const templateName = imageFile.replace(/\.(jpg|jpeg|png)$/i, '');
      const metadata = TEMPLATES_METADATA[templateName];

      if (!metadata) {
        console.log(`⚠️  Saltando ${imageFile} - metadata no definida`);
        errorCount++;
        continue;
      }

      try {
        console.log(`📤 Procesando: ${templateName}`);

        // 1. Leer imagen
        const imagePath = path.join(templatesDir, imageFile);
        const imageBuffer = fs.readFileSync(imagePath);

        // 2. Crear documento en Firestore primero para obtener ID
        const templateRef = db.collection('templates').doc();
        const templateId = templateRef.id;

        // 3. Subir imagen a Storage
        const storagePath = `templates/${templateId}.png`;
        const file = bucket.file(storagePath);

        await file.save(imageBuffer, {
          metadata: {
            contentType: 'image/png',
            metadata: {
              templateId,
              originalName: templateName,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        await file.makePublic();

        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
        console.log(`   ✅ Imagen subida: ${imageUrl}`);

        // 4. Crear documento en Firestore
        const templateDoc: Omit<Template, 'id'> = {
          title: metadata.title,
          description: metadata.description,
          imageUrl,
          prompt: metadata.prompt,
          categories: ['trending'], // Default category
          metadata: metadata.metadata,
          isActive: true,
          isPremium: metadata.isPremium || false,
          usageCount: 0,
          averageRating: 0,
          createdAt: FieldValue.serverTimestamp() as any,
          updatedAt: FieldValue.serverTimestamp() as any,
          createdBy: 'migration-script',
        };

        await templateRef.set(templateDoc);
        console.log(`   ✅ Documento creado en Firestore: ${templateId}`);
        console.log('');

        successCount++;

      } catch (error: any) {
        console.error(`   ❌ Error procesando ${templateName}:`, error.message);
        console.log('');
        errorCount++;
      }
    }

    console.log('\n📊 Resumen de migración:');
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📝 Total: ${imageFiles.length}`);

    if (successCount > 0) {
      console.log('\n🎉 Migración completada! Los templates están ahora en Firebase.');
      console.log('   Puedes verificarlos en:');
      console.log('   - Firestore: templates collection');
      console.log('   - Storage: templates/ folder');
      console.log('   - Admin Panel: http://localhost:3000/admin');
    }

  } catch (error: any) {
    console.error('❌ Error fatal en migración:', error.message);
    process.exit(1);
  }
}

// Ejecutar migración
migrateTemplates()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
