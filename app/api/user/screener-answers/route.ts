import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

/**
 * POST /api/user/screener-answers
 * Guarda las respuestas del usuario a las preguntas del screener
 *
 * Body:
 * {
 *   answers: {
 *     questionId: string[],  // e.g., { "bodyType_q1": ["athletic", "slim"] }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyUserAuth(request);
    const body = await request.json();
    const { answers } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'answers es requerido y debe ser un objeto' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const profileRef = db.collection('userProfiles').doc(userId);

    // Obtener perfil actual o crearlo
    const profileDoc = await profileRef.get();
    const questionIds = Object.keys(answers);

    if (!profileDoc.exists) {
      // Crear nuevo perfil
      await profileRef.set({
        userId,
        answeredQuestions: questionIds,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        viewedTemplates: [],
        usedTemplates: [],
      });

      console.log(`✅ User profile created with screener answers: ${userId}`);
    } else {
      // Actualizar perfil existente
      const currentAnsweredQuestions = profileDoc.data()?.answeredQuestions || [];
      const newAnsweredQuestions = [...new Set([...currentAnsweredQuestions, ...questionIds])];

      await profileRef.update({
        answeredQuestions: newAnsweredQuestions,
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ User profile updated with ${questionIds.length} new answers: ${userId}`);
    }

    // Procesar respuestas para actualizar preferencias
    await updateUserPreferences(profileRef, answers);

    return NextResponse.json({
      success: true,
      answeredCount: questionIds.length,
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/user/screener-answers:', error.message);
    return NextResponse.json(
      { error: 'Error al guardar respuestas' },
      { status: 500 }
    );
  }
}

/**
 * Actualiza las preferencias del usuario basado en las respuestas del screener
 */
async function updateUserPreferences(
  profileRef: FirebaseFirestore.DocumentReference,
  answers: Record<string, string[]>
) {
  const updates: Record<string, any> = {};

  // Mapear respuestas a preferencias
  for (const [questionKey, selectedOptions] of Object.entries(answers)) {
    // Extraer el tipo de pregunta del questionKey
    // Ejemplo: "survey.screener.questions.bodyType" -> "bodyType"
    const keyParts = questionKey.split('.');
    const preferenceKey = keyParts[keyParts.length - 1];

    switch (preferenceKey) {
      case 'bodyType':
        updates.preferredBodyType = FieldValue.arrayUnion(...selectedOptions);
        break;
      case 'occasions':
        updates.preferredOccasions = FieldValue.arrayUnion(...selectedOptions);
        break;
      case 'mood':
        updates.preferredMood = FieldValue.arrayUnion(...selectedOptions);
        break;
      case 'stylePreference':
        updates.preferredStyle = FieldValue.arrayUnion(...selectedOptions);
        break;
    }
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = FieldValue.serverTimestamp();
    await profileRef.update(updates);
    console.log('✅ User preferences updated:', Object.keys(updates));
  }
}
