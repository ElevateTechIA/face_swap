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
 * - websiteUrl: filtrar templates por website (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'all';
    const occasion = searchParams.get('occasion');
    const searchQuery = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const websiteUrl = searchParams.get('websiteUrl');

    const db = getAdminFirestore();

    // Obtener todos los templates activos
    let templatesQuery = db.collection('templates')
      .where('isActive', '==', true);

    // Si se especifica websiteUrl, filtrar por ese dominio
    // Los templates pueden tener websiteUrl específico o no tenerlo (compartidos)
    if (websiteUrl) {
      console.log(`🔍 Filtering templates for website: ${websiteUrl}`);
      // Note: Firestore doesn't support OR queries directly, so we'll filter in memory
      // We want templates where websiteUrl matches OR websiteUrl is null/undefined
    }

    const templatesSnapshot = await templatesQuery.get();

    let templates: Template[] = templatesSnapshot.docs.map(doc => {
      const data = doc.data();

      // Asegurar que siempre exista el campo categories
      let categories = data.categories || [];

      // Si no tiene categories, inferirlo de metadata.occasion
      if (!categories || categories.length === 0) {
        categories = ['trending']; // Default

        // Intentar inferir de metadata.occasion
        if (data.metadata?.occasion && Array.isArray(data.metadata.occasion)) {
          const occasionToCategory: Record<string, string> = {
            'new-year': 'new-year',
            'birthday': 'birthday',
            'wedding': 'wedding',
            'casual': 'casual',
            'professional': 'professional',
            'date': 'date',
            'party': 'party',
          };

          for (const occasion of data.metadata.occasion) {
            const cat = occasionToCategory[occasion];
            if (cat && !categories.includes(cat)) {
              categories.push(cat);
            }
          }
        }
      }

      return {
        id: doc.id,
        ...data,
        categories, // Asegurar que siempre esté presente
        websiteUrl: data.websiteUrl || null, // Include websiteUrl field
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as Template;
    });

    // Filter by websiteUrl if specified
    // Show templates that match the websiteUrl OR have no websiteUrl (shared templates)
    if (websiteUrl) {
      templates = templates.filter(t =>
        !t.websiteUrl || t.websiteUrl === websiteUrl
      );
      console.log(`✅ Filtered to ${templates.length} templates for ${websiteUrl}`);
    }

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
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        error: 'Error al obtener templates',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
