/**
 * API: Like/Unlike Gallery Item
 *
 * POST /api/gallery/like
 * Body: { galleryItemId, action: 'like' | 'unlike' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 30 likes per 10 minutes to prevent spam
    const { allowed, result } = await withRateLimit(
      request,
      {
        windowMs: 10 * 60 * 1000, // 10 minutes
        maxRequests: 30,
        keyPrefix: 'rl:like'
      }
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many likes. Please try again later.',
          retryAfter: result.retryAfter
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { galleryItemId, action } = body;

    if (!galleryItemId || !action) {
      return NextResponse.json(
        { success: false, error: 'galleryItemId and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'like' && action !== 'unlike') {
      return NextResponse.json(
        { success: false, error: 'action must be "like" or "unlike"' },
        { status: 400 }
      );
    }

    // Get user ID (optional - can like without auth)
    const userId = request.headers.get('x-user-id') || `anon_${Date.now()}`;

    const db = getAdminFirestore();
    const galleryRef = db.collection('publicGallery').doc(galleryItemId);

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(galleryRef);

      if (!doc.exists) {
        throw new Error('Gallery item not found');
      }

      const data = doc.data()!;
      const likedBy = data.likedBy || [];
      const hasLiked = likedBy.includes(userId);

      if (action === 'like') {
        if (hasLiked) {
          // Already liked - no-op
          return;
        }

        // Add like
        transaction.update(galleryRef, {
          likes: FieldValue.increment(1),
          likedBy: FieldValue.arrayUnion(userId),
          updatedAt: FieldValue.serverTimestamp()
        });

        console.log(`👍 User ${userId} liked gallery item ${galleryItemId}`);

      } else {
        // unlike
        if (!hasLiked) {
          // Not liked - no-op
          return;
        }

        // Remove like
        transaction.update(galleryRef, {
          likes: FieldValue.increment(-1),
          likedBy: FieldValue.arrayRemove(userId),
          updatedAt: FieldValue.serverTimestamp()
        });

        console.log(`👎 User ${userId} unliked gallery item ${galleryItemId}`);
      }
    });

    return NextResponse.json({
      success: true,
      action
    });

  } catch (error: any) {
    console.error('❌ Error processing like:', error);

    if (error.message === 'Gallery item not found') {
      return NextResponse.json(
        { success: false, error: 'Gallery item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process like' },
      { status: 500 }
    );
  }
}
