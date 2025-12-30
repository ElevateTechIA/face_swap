import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth, verifyAdminAuth } from '@/lib/api/auth-middleware';
import { ScreenerQuestion, UserProfile } from '@/types/template';

export const runtime = 'nodejs';

/**
 * GET /api/screener-questions
 * Obtiene preguntas activas del screener que el usuario no ha respondido
 *
 * Query params:
 * - limit: número máximo de preguntas (default: 3)
 * - includeAnswered: incluir preguntas ya respondidas (solo para admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3');
    const includeAnswered = searchParams.get('includeAnswered') === 'true';

    const db = getAdminFirestore();
    let userId: string | null = null;
    let answeredQuestions: string[] = [];

    // Intentar obtener el usuario autenticado
    try {
      userId = await verifyUserAuth(request);

      // Obtener preguntas ya respondidas por el usuario
      const profileDoc = await db.collection('userProfiles').doc(userId).get();
      if (profileDoc.exists) {
        const profile = profileDoc.data() as UserProfile;
        answeredQuestions = profile.answeredQuestions || [];
      }
    } catch (authError) {
      // Usuario no autenticado - retornar todas las preguntas activas
      console.log('Usuario no autenticado, retornando preguntas sin filtrar');
    }

    // Obtener todas las preguntas ordenadas por order
    const questionsSnapshot = await db.collection('screenerQuestions')
      .orderBy('order', 'asc')
      .get();

    let questions: ScreenerQuestion[] = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    } as ScreenerQuestion));

    // Para usuarios normales (no admin), filtrar por isActive
    if (!includeAnswered) {
      questions = questions.filter(q => q.isActive);
    }

    // Filtrar preguntas ya respondidas (solo para usuarios normales)
    if (!includeAnswered && answeredQuestions.length > 0) {
      questions = questions.filter(q => !answeredQuestions.includes(q.id));
    }

    // Limitar número de preguntas
    const limitedQuestions = questions.slice(0, limit);

    return NextResponse.json({
      questions: limitedQuestions,
      totalAvailable: questions.length,
      answeredCount: answeredQuestions.length,
      hasMore: questions.length > limit,
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/screener-questions:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener preguntas del screener' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/screener-questions
 * Crea una nueva pregunta del screener con traducciones dinámicas (solo admin)
 *
 * Body esperado:
 * {
 *   multiSelect: boolean,
 *   category: string,
 *   optionKeys: string[],  // ['athletic', 'slim', 'curvy']
 *   translations: {
 *     es: { label: "...", options: { athletic: "Atlético", ... } },
 *     en: { label: "...", options: { athletic: "Athletic", ... } }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const userId = await verifyAdminAuth(request);

    const body = await request.json();
    const { multiSelect, category, optionKeys, translations, targetGender, minUsageCount } = body;

    // Validación
    if (!optionKeys || !Array.isArray(optionKeys) || optionKeys.length === 0) {
      return NextResponse.json(
        { error: 'optionKeys es requerido y debe ser un array' },
        { status: 400 }
      );
    }

    if (!translations || !translations.es || !translations.en) {
      return NextResponse.json(
        { error: 'translations debe incluir es y en' },
        { status: 400 }
      );
    }

    if (!translations.es.label || !translations.en.label) {
      return NextResponse.json(
        { error: 'Cada traducción debe tener un label' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Obtener el order más alto actual
    const questionsSnapshot = await db.collection('screenerQuestions')
      .orderBy('order', 'desc')
      .limit(1)
      .get();

    const maxOrder = questionsSnapshot.empty ? 0 : questionsSnapshot.docs[0].data().order;

    const newQuestion = {
      multiSelect: multiSelect || false,
      category: category || null,
      optionKeys,
      translations,
      targetGender: targetGender || null,
      minUsageCount: minUsageCount || 0,
      isActive: true,
      order: maxOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };

    const docRef = await db.collection('screenerQuestions').add(newQuestion);

    console.log(`✅ Screener question created: ${docRef.id}`);
    console.log(`📝 Question label (ES): ${translations.es.label}`);
    console.log(`📝 Question label (EN): ${translations.en.label}`);

    return NextResponse.json({
      success: true,
      questionId: docRef.id,
      question: { id: docRef.id, ...newQuestion },
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/screener-questions:', error.message);

    // Handle authentication/authorization errors
    if (error.message.includes('autorizado') || error.message.includes('autenticado')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear pregunta' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/screener-questions
 * Actualiza una pregunta existente del screener (solo admin)
 *
 * Body esperado:
 * {
 *   id: string,
 *   multiSelect: boolean,
 *   category: string,
 *   optionKeys: string[],
 *   translations: { es: {...}, en: {...} },
 *   isActive: boolean,
 *   order: number
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAuth(request);

    const body = await request.json();
    const { id, multiSelect, category, optionKeys, translations, isActive, order } = body;

    // Validación
    if (!id) {
      return NextResponse.json(
        { error: 'ID de pregunta es requerido' },
        { status: 400 }
      );
    }

    if (!optionKeys || !Array.isArray(optionKeys) || optionKeys.length === 0) {
      return NextResponse.json(
        { error: 'optionKeys es requerido y debe ser un array' },
        { status: 400 }
      );
    }

    if (!translations || !translations.es || !translations.en) {
      return NextResponse.json(
        { error: 'translations debe incluir es y en' },
        { status: 400 }
      );
    }

    if (!translations.es.label || !translations.en.label) {
      return NextResponse.json(
        { error: 'Cada traducción debe tener un label' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const questionRef = db.collection('screenerQuestions').doc(id);

    // Verificar que la pregunta existe
    const questionDoc = await questionRef.get();
    if (!questionDoc.exists) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    const updatedQuestion = {
      multiSelect: multiSelect ?? false,
      category: category || null,
      optionKeys,
      translations,
      isActive: isActive ?? true,
      order: order ?? questionDoc.data()?.order ?? 0,
      updatedAt: new Date(),
    };

    await questionRef.update(updatedQuestion);

    console.log(`✅ Screener question updated: ${id}`);
    console.log(`📝 Question label (ES): ${translations.es.label}`);
    console.log(`📝 Question label (EN): ${translations.en.label}`);

    return NextResponse.json({
      success: true,
      questionId: id,
      question: { id, ...updatedQuestion },
    });

  } catch (error: any) {
    console.error('❌ Error en PUT /api/screener-questions:', error.message);

    // Handle authentication/authorization errors
    if (error.message.includes('autorizado') || error.message.includes('autenticado')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar pregunta' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/screener-questions
 * Elimina una pregunta del screener (solo admin)
 *
 * Body esperado:
 * {
 *   id: string
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAuth(request);

    const body = await request.json();
    const { id } = body;

    // Validación
    if (!id) {
      return NextResponse.json(
        { error: 'ID de pregunta es requerido' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const questionRef = db.collection('screenerQuestions').doc(id);

    // Verificar que la pregunta existe
    const questionDoc = await questionRef.get();
    if (!questionDoc.exists) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    await questionRef.delete();

    console.log(`✅ Screener question deleted: ${id}`);

    return NextResponse.json({
      success: true,
      questionId: id,
    });

  } catch (error: any) {
    console.error('❌ Error en DELETE /api/screener-questions:', error.message);

    // Handle authentication/authorization errors
    if (error.message.includes('autorizado') || error.message.includes('autenticado')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Error al eliminar pregunta' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/screener-questions
 * Actualización parcial de una pregunta (toggle active, reorder, etc.) (solo admin)
 *
 * Body esperado:
 * {
 *   id: string,
 *   isActive?: boolean,
 *   order?: number
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAuth(request);

    const body = await request.json();
    const { id, isActive, order } = body;

    // Validación
    if (!id) {
      return NextResponse.json(
        { error: 'ID de pregunta es requerido' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const questionRef = db.collection('screenerQuestions').doc(id);

    // Verificar que la pregunta existe
    const questionDoc = await questionRef.get();
    if (!questionDoc.exists) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (isActive !== undefined) {
      updates.isActive = isActive;
    }

    if (order !== undefined) {
      updates.order = order;
    }

    await questionRef.update(updates);

    console.log(`✅ Screener question patched: ${id}`, updates);

    return NextResponse.json({
      success: true,
      questionId: id,
      updates,
    });

  } catch (error: any) {
    console.error('❌ Error en PATCH /api/screener-questions:', error.message);

    // Handle authentication/authorization errors
    if (error.message.includes('autorizado') || error.message.includes('autenticado')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar pregunta' },
      { status: 500 }
    );
  }
}
