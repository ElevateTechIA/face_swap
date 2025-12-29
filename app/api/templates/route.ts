import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { Template, UserProfile } from '@/types/template';
import {
  recommendTemplates,
  getTrendingTemplates,
  getTemplatesByOccasion,
  searchTemplates,
} from '@/lib/recommendation-engine';

export const runtime = 'nodejs';

/**
 * GET /api/templates
 * Obtiene templates con recomendaciones personalizadas
 *
 * Query params:
 * - mode: 'recommended' | 'trending' | 'all' (default: 'all')
 * - occasion: filtrar por ocasión específica
 * - search: búsqueda por texto
 * - limit: número máximo de resultados
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'all';
    const occasion = searchParams.get('occasion');
    const searchQuery = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = getAdminFirestore();

    // Obtener todos los templates activos
    const templatesSnapshot = await db.collection('templates')
      .where('isActive', '==', true)
      .get();

    let templates: Template[] = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    } as Template));

    // Si hay búsqueda, filtrar por texto
    if (searchQuery) {
      templates = searchTemplates(templates, searchQuery);
      return NextResponse.json({ templates: templates.slice(0, limit) });
    }

    // Si hay filtro de ocasión, aplicar
    if (occasion) {
      templates = getTemplatesByOccasion(templates, occasion);
      return NextResponse.json({ templates: templates.slice(0, limit) });
    }

    // Modo trending
    if (mode === 'trending') {
      const trending = getTrendingTemplates(templates, { limit });
      return NextResponse.json({ templates: trending });
    }

    // Modo recommended - requiere autenticación
    if (mode === 'recommended') {
      try {
        // Intentar obtener userId si está autenticado
        const userId = await verifyUserAuth(request);

        // Obtener perfil del usuario
        const profileDoc = await db.collection('userProfiles').doc(userId).get();
        const userProfile = profileDoc.exists ? {
          ...profileDoc.data(),
          userId,
        } as UserProfile : null;

        // Recomendar templates
        const recommendations = recommendTemplates(templates, userProfile, { limit });

        return NextResponse.json({
          templates: recommendations.map(r => r.template),
          scores: recommendations.map(r => ({
            templateId: r.template.id,
            score: r.score,
            breakdown: r.breakdown,
          })),
        });

      } catch (authError) {
        // Si no está autenticado, devolver trending
        console.log('Usuario no autenticado, devolviendo trending templates');
        const trending = getTrendingTemplates(templates, { limit });
        return NextResponse.json({ templates: trending });
      }
    }

    // Modo all - ordenar por popularidad
    templates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

    return NextResponse.json({ templates: templates.slice(0, limit) });

  } catch (error: any) {
    console.error('❌ Error en GET /api/templates:', error.message);

    return NextResponse.json(
      { error: 'Error al obtener templates' },
      { status: 500 }
    );
  }
}
