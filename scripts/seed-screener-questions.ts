/**
 * Script para poblar la base de datos con las preguntas iniciales del screener
 *
 * Uso:
 * npx tsx scripts/seed-screener-questions.ts
 */

import { getAdminFirestore } from '../lib/firebase/admin';

const INITIAL_QUESTIONS = [
  {
    multiSelect: true,
    category: 'preferences' as const,
    optionKeys: ['slim', 'athletic', 'curvy', 'average', 'plus-size'],
    translations: {
      es: {
        label: '¿Qué tipo de cuerpo prefieres en los resultados?',
        options: {
          slim: 'Delgado',
          athletic: 'Atlético',
          curvy: 'Curvy',
          average: 'Promedio',
          'plus-size': 'Plus Size',
        },
      },
      en: {
        label: 'What body type do you prefer in results?',
        options: {
          slim: 'Slim',
          athletic: 'Athletic',
          curvy: 'Curvy',
          average: 'Average',
          'plus-size': 'Plus Size',
        },
      },
    },
    isActive: true,
    order: 1,
  },
  {
    multiSelect: true,
    category: 'occasions' as const,
    optionKeys: ['new-year', 'birthday', 'wedding', 'party', 'date', 'professional', 'casual'],
    translations: {
      es: {
        label: '¿Para qué ocasiones usarías Face Swaps?',
        options: {
          'new-year': 'Año Nuevo',
          birthday: 'Cumpleaños',
          wedding: 'Boda',
          party: 'Fiesta',
          date: 'Cita',
          professional: 'Profesional',
          casual: 'Casual',
        },
      },
      en: {
        label: 'For what occasions would you use Face Swaps?',
        options: {
          'new-year': 'New Year',
          birthday: 'Birthday',
          wedding: 'Wedding',
          party: 'Party',
          date: 'Date',
          professional: 'Professional',
          casual: 'Casual',
        },
      },
    },
    isActive: true,
    order: 2,
  },
  {
    multiSelect: true,
    category: 'mood' as const,
    optionKeys: ['happy', 'confident', 'mysterious', 'playful', 'romantic', 'energetic', 'relaxed'],
    translations: {
      es: {
        label: '¿Qué mood buscas en tus fotos?',
        options: {
          happy: 'Feliz',
          confident: 'Confiado',
          mysterious: 'Misterioso',
          playful: 'Juguetón',
          romantic: 'Romántico',
          energetic: 'Energético',
          relaxed: 'Relajado',
        },
      },
      en: {
        label: 'What mood are you looking for in your photos?',
        options: {
          happy: 'Happy',
          confident: 'Confident',
          mysterious: 'Mysterious',
          playful: 'Playful',
          romantic: 'Romantic',
          energetic: 'Energetic',
          relaxed: 'Relaxed',
        },
      },
    },
    isActive: true,
    order: 3,
  },
  {
    multiSelect: true,
    category: 'style' as const,
    optionKeys: ['elegant', 'casual', 'edgy', 'vintage', 'modern', 'professional', 'party', 'romantic'],
    translations: {
      es: {
        label: '¿Qué estilos te gustan más?',
        options: {
          elegant: 'Elegante',
          casual: 'Casual',
          edgy: 'Atrevido',
          vintage: 'Vintage',
          modern: 'Moderno',
          professional: 'Profesional',
          party: 'Fiesta',
          romantic: 'Romántico',
        },
      },
      en: {
        label: 'What styles do you like most?',
        options: {
          elegant: 'Elegant',
          casual: 'Casual',
          edgy: 'Edgy',
          vintage: 'Vintage',
          modern: 'Modern',
          professional: 'Professional',
          party: 'Party',
          romantic: 'Romantic',
        },
      },
    },
    isActive: true,
    order: 4,
  },
];

async function seedScreenerQuestions() {
  try {
    console.log('🌱 Seeding screener questions...');

    const db = getAdminFirestore();
    const questionsRef = db.collection('screenerQuestions');

    // Verificar si ya existen preguntas
    const existingSnapshot = await questionsRef.limit(1).get();
    if (!existingSnapshot.empty) {
      console.log('⚠️  Screener questions already exist. Skipping...');
      console.log('💡 If you want to reset, delete the screenerQuestions collection first.');
      return;
    }

    // Crear las preguntas iniciales
    const batch = db.batch();

    for (const question of INITIAL_QUESTIONS) {
      const docRef = questionsRef.doc(); // Auto-generate ID
      batch.set(docRef, {
        ...question,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      });
      console.log(`✅ Added question: ${question.translations.es.label}`);
    }

    await batch.commit();

    console.log('');
    console.log('✨ Successfully seeded screener questions!');
    console.log(`📊 Created ${INITIAL_QUESTIONS.length} questions`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Visit /admin to manage questions');
    console.log('2. Questions will appear during face swap processing');
    console.log('3. Users will see 3 random unanswered questions each time');

  } catch (error: any) {
    console.error('❌ Error seeding screener questions:', error.message);
    process.exit(1);
  }
}

// Run the seed script
seedScreenerQuestions()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
