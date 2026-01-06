/**
 * Script: Create/Update Group Photo Templates
 *
 * Usage:
 * npx tsx scripts/create-group-templates.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = require('../firebase-service-account.json');

  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

/**
 * Group template configurations
 * Agrega aquí los templates que quieres marcar como grupales
 */
const GROUP_TEMPLATES = [
  {
    title: 'Friends Party',
    imageUrl: 'https://your-storage-url.com/friends-party.jpg', // CAMBIAR por tu URL real
    description: 'Celebra con tus amigos - 3 personas',
    prompt: 'Based on the first image, the scene shows three friends celebrating together at a party. The setting is festive with vibrant lighting and party atmosphere...',

    // Group settings
    isGroup: true,
    faceCount: 3,
    maxFaces: 3,

    // Metadata
    metadata: {
      bodyType: ['average', 'athletic', 'slim'],
      style: ['party', 'casual', 'modern'],
      mood: ['happy', 'energetic', 'playful'],
      occasion: ['party', 'birthday', 'casual'],
      setting: ['indoor'],
      framing: 'full-body',
      lighting: 'dramatic',
      colorPalette: 'vibrant',
      popularityScore: 50,
      qualityScore: 85,
      tags: ['friends', 'party', 'group', 'celebration'],
      gender: ['neutral']
    },

    isActive: true,
    isPremium: false,
    usageCount: 0
  },

  {
    title: 'Couple Celebration',
    imageUrl: 'https://your-storage-url.com/couple-celebration.jpg', // CAMBIAR
    description: 'Celebración romántica en pareja - 2 personas',
    prompt: 'Based on the first image, the scene shows a couple celebrating together in an elegant romantic setting...',

    // Group settings
    isGroup: true,
    faceCount: 2,
    maxFaces: 2,

    metadata: {
      bodyType: ['average', 'slim'],
      style: ['romantic', 'elegant', 'modern'],
      mood: ['happy', 'confident', 'romantic'],
      occasion: ['date', 'wedding', 'new-year'],
      setting: ['indoor', 'outdoor'],
      framing: 'medium',
      lighting: 'soft',
      colorPalette: 'warm',
      popularityScore: 60,
      qualityScore: 90,
      tags: ['couple', 'romantic', 'celebration', 'group'],
      gender: ['neutral']
    },

    isActive: true,
    isPremium: false,
    usageCount: 0
  },

  {
    title: 'Squad Goals',
    imageUrl: 'https://your-storage-url.com/squad-goals.jpg', // CAMBIAR
    description: 'Equipo de amigos - 4 personas',
    prompt: 'Based on the first image, the scene shows four friends posing together with confident poses and vibrant energy...',

    // Group settings
    isGroup: true,
    faceCount: 4,
    maxFaces: 4,

    metadata: {
      bodyType: ['average', 'athletic', 'slim'],
      style: ['casual', 'edgy', 'modern'],
      mood: ['confident', 'energetic', 'playful'],
      occasion: ['party', 'casual', 'professional'],
      setting: ['indoor', 'outdoor'],
      framing: 'full-body',
      lighting: 'natural',
      colorPalette: 'vibrant',
      popularityScore: 70,
      qualityScore: 85,
      tags: ['friends', 'squad', 'group', 'team'],
      gender: ['neutral']
    },

    isActive: true,
    isPremium: true, // Premium porque son 4 caras
    usageCount: 0
  }
];

/**
 * Create or update group templates
 */
async function createGroupTemplates() {
  console.log('🎨 Creating/Updating Group Photo Templates...\n');

  for (const template of GROUP_TEMPLATES) {
    try {
      // Check if template already exists
      const existingQuery = await db.collection('templates')
        .where('title', '==', template.title)
        .limit(1)
        .get();

      const now = new Date();

      if (!existingQuery.empty) {
        // UPDATE existing template
        const doc = existingQuery.docs[0];
        const docId = doc.id;

        await doc.ref.update({
          isGroup: template.isGroup,
          faceCount: template.faceCount,
          maxFaces: template.maxFaces,
          description: template.description,
          prompt: template.prompt,
          metadata: template.metadata,
          updatedAt: now
        });

        console.log(`✅ Updated template: ${template.title} (${docId})`);
        console.log(`   → Group: ${template.isGroup}, Faces: ${template.faceCount}\n`);

      } else {
        // CREATE new template
        const newDoc = await db.collection('templates').add({
          ...template,
          createdAt: now,
          updatedAt: now
        });

        console.log(`✨ Created new template: ${template.title} (${newDoc.id})`);
        console.log(`   → Group: ${template.isGroup}, Faces: ${template.faceCount}\n`);
      }

    } catch (error: any) {
      console.error(`❌ Error with template "${template.title}":`, error.message);
    }
  }

  console.log('\n✅ Group templates processing completed!');
}

/**
 * Convert existing template to group
 */
async function convertTemplateToGroup(templateTitle: string, faceCount: number) {
  console.log(`\n🔄 Converting "${templateTitle}" to group template (${faceCount} faces)...\n`);

  try {
    const query = await db.collection('templates')
      .where('title', '==', templateTitle)
      .limit(1)
      .get();

    if (query.empty) {
      console.error(`❌ Template "${templateTitle}" not found`);
      return;
    }

    const doc = query.docs[0];

    await doc.ref.update({
      isGroup: true,
      faceCount: faceCount,
      maxFaces: faceCount,
      description: `${doc.data().description} - ${faceCount} personas`,
      updatedAt: new Date()
    });

    console.log(`✅ Template "${templateTitle}" converted to group (${faceCount} faces)`);

  } catch (error: any) {
    console.error('❌ Error converting template:', error.message);
  }
}

/**
 * List all group templates
 */
async function listGroupTemplates() {
  console.log('\n📋 Listing all group templates...\n');

  try {
    const snapshot = await db.collection('templates')
      .where('isGroup', '==', true)
      .orderBy('faceCount', 'asc')
      .get();

    if (snapshot.empty) {
      console.log('No group templates found.');
      return;
    }

    console.log(`Found ${snapshot.size} group templates:\n`);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📸 ${data.title}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Faces: ${data.faceCount}`);
      console.log(`   Active: ${data.isActive ? '✅' : '❌'}`);
      console.log(`   Premium: ${data.isPremium ? '💎' : '🆓'}`);
      console.log('');
    });

  } catch (error: any) {
    console.error('❌ Error listing templates:', error.message);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
      // Crear los templates definidos arriba
      await createGroupTemplates();
      break;

    case 'convert':
      // Convertir un template existente a grupal
      const templateTitle = args[1];
      const faceCount = parseInt(args[2]);

      if (!templateTitle || !faceCount) {
        console.error('❌ Usage: npx tsx scripts/create-group-templates.ts convert "Template Title" 3');
        process.exit(1);
      }

      await convertTemplateToGroup(templateTitle, faceCount);
      break;

    case 'list':
      // Listar todos los templates grupales
      await listGroupTemplates();
      break;

    default:
      console.log(`
🎨 Group Templates Manager

Usage:
  npx tsx scripts/create-group-templates.ts create
    → Create/update group templates defined in script

  npx tsx scripts/create-group-templates.ts convert "Template Title" 3
    → Convert existing template to group (3 faces)

  npx tsx scripts/create-group-templates.ts list
    → List all group templates

Examples:
  npx tsx scripts/create-group-templates.ts create
  npx tsx scripts/create-group-templates.ts convert "Midnight Celebration" 2
  npx tsx scripts/create-group-templates.ts list
      `);
  }

  process.exit(0);
}

main().catch(console.error);
