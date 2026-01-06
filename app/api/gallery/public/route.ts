/**
 * API: Get Public Gallery Items
 *
 * GET /api/gallery/public?sortBy=recent&limit=20&offset=0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { PublicGalleryItem, GalleryFilters } from '@/types/gallery';
import { calculateTrendingScore } from '@/types/gallery';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🎨 GET /api/gallery/public - Request received');

    const { searchParams } = new URL(request.url);

    // Parse filters
    const sortBy = (searchParams.get('sortBy') || 'recent') as GalleryFilters['sortBy'];
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const style = searchParams.get('style') || undefined;
    const templateTitle = searchParams.get('templateTitle') || undefined;

    console.log(`📊 Filters: sortBy=${sortBy}, limit=${limit}, offset=${offset}`);

    const db = getAdminFirestore();
    console.log('✅ Firestore connection established');

    // Build base query - SIMPLIFICADO para evitar índices compuestos
    let query = db.collection('publicGallery')
      .where('isPublic', '==', true)
      .limit(limit + offset + 10); // Fetch extra for filtering

    const snapshot = await query.get();

    console.log(`📊 Gallery query returned ${snapshot.size} items`);

    let items: PublicGalleryItem[] = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          faceSwapId: data.faceSwapId || '',
          userId: data.userId || '',
          imageUrl: data.imageUrl || '',
          thumbnailUrl: data.thumbnailUrl,
          templateTitle: data.templateTitle,
          style: data.style,
          displayName: data.displayName || 'Anonymous',
          caption: data.caption,
          likes: data.likes || 0,
          views: data.views || 0,
          likedBy: data.likedBy || [],
          isPublic: data.isPublic ?? true,
          isModerated: data.isModerated ?? true,
          isFeatured: data.isFeatured ?? false,
          createdAt: data.createdAt?.toDate() || new Date(),
          publishedAt: data.publishedAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as PublicGalleryItem;
      });

    // Apply filters client-side
    if (style) {
      items = items.filter(item => item.style === style);
    }
    if (templateTitle) {
      items = items.filter(item => item.templateTitle === templateTitle);
    }

    // Apply sorting client-side
    switch (sortBy) {
      case 'recent':
        items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
        break;

      case 'popular':
        items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;

      case 'featured':
        items = items.filter(item => item.isFeatured === true);
        items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
        break;

      case 'trending':
        items = items
          .map(item => ({
            ...item,
            trendingScore: calculateTrendingScore(item)
          }))
          .sort((a: any, b: any) => b.trendingScore - a.trendingScore);
        break;

      default:
        items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    }

    // Apply pagination
    const paginatedItems = items.slice(offset, offset + limit);

    // Remove sensitive data
    const sanitizedItems = paginatedItems.map(item => ({
      id: item.id,
      imageUrl: item.imageUrl,
      thumbnailUrl: item.thumbnailUrl,
      templateTitle: item.templateTitle,
      style: item.style,
      displayName: item.displayName || 'Anonymous',
      caption: item.caption,
      likes: item.likes || 0,
      views: item.views || 0,
      isFeatured: item.isFeatured || false,
      publishedAt: item.publishedAt.toISOString(),
      // Don't expose: userId, faceSwapId, likedBy
    }));

    return NextResponse.json({
      success: true,
      items: sanitizedItems,
      pagination: {
        total: items.length,
        limit,
        offset,
        hasMore: offset + paginatedItems.length < items.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching public gallery:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch gallery',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
