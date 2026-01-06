/**
 * API: Publish/Unpublish Face Swap to Public Gallery
 *
 * POST /api/gallery/publish
 * Body: { faceSwapId, isPublic, caption?, displayName? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { FieldValue } from 'firebase-admin/firestore';
import type { PublicGalleryItem } from '@/types/gallery';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyUserAuth(request);

    const body = await request.json();
    const {
      faceSwapId,
      isPublic,
      caption,
      displayName
    } = body;

    if (!faceSwapId) {
      return NextResponse.json(
        { success: false, error: 'faceSwapId is required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Get the face swap
    const faceSwapRef = db.collection('faceSwaps').doc(faceSwapId);
    const faceSwapDoc = await faceSwapRef.get();

    if (!faceSwapDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Face swap not found' },
        { status: 404 }
      );
    }

    const faceSwap = faceSwapDoc.data();

    // Verify ownership
    if (faceSwap?.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    if (isPublic) {
      // PUBLISH to gallery
      console.log(`📸 Publishing face swap ${faceSwapId} to gallery`);

      // Check if already published
      const galleryQuery = await db.collection('publicGallery')
        .where('faceSwapId', '==', faceSwapId)
        .limit(1)
        .get();

      let galleryItemId: string;

      if (!galleryQuery.empty) {
        // Already exists - update
        const doc = galleryQuery.docs[0];
        galleryItemId = doc.id;

        await doc.ref.update({
          isPublic: true,
          caption: caption || null,
          displayName: displayName || 'Anonymous',
          updatedAt: FieldValue.serverTimestamp()
        });

        console.log(`✅ Updated existing gallery item: ${galleryItemId}`);
      } else {
        // Create new gallery item
        const galleryRef = db.collection('publicGallery').doc();
        galleryItemId = galleryRef.id;

        const galleryItem: Partial<PublicGalleryItem> = {
          id: galleryItemId,
          faceSwapId,
          userId,
          imageUrl: faceSwap.resultImageUrl || '',
          templateTitle: faceSwap.templateTitle || null,
          style: faceSwap.style || null,
          displayName: displayName || 'Anonymous',
          caption: caption || null,
          likes: 0,
          views: 0,
          likedBy: [],
          isPublic: true,
          isModerated: false, // TODO: Add moderation check
          isFeatured: false,
          publishedAt: new Date(),
          createdAt: faceSwap.createdAt?.toDate() || new Date(),
          updatedAt: new Date()
        };

        await galleryRef.set(galleryItem);

        console.log(`✅ Created new gallery item: ${galleryItemId}`);
      }

      // Update face swap with public flag
      await faceSwapRef.update({
        isPublic: true,
        publicGalleryId: galleryItemId,
        updatedAt: FieldValue.serverTimestamp()
      });

      return NextResponse.json({
        success: true,
        galleryItemId,
        message: 'Published to gallery'
      });

    } else {
      // UNPUBLISH from gallery
      console.log(`🔒 Unpublishing face swap ${faceSwapId} from gallery`);

      // Find and update gallery item
      const galleryQuery = await db.collection('publicGallery')
        .where('faceSwapId', '==', faceSwapId)
        .limit(1)
        .get();

      if (!galleryQuery.empty) {
        const doc = galleryQuery.docs[0];
        await doc.ref.update({
          isPublic: false,
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      // Update face swap
      await faceSwapRef.update({
        isPublic: false,
        updatedAt: FieldValue.serverTimestamp()
      });

      return NextResponse.json({
        success: true,
        message: 'Unpublished from gallery'
      });
    }

  } catch (error: any) {
    console.error('❌ Error publishing to gallery:', error);

    if (error.message.includes('autenticado') || error.message.includes('Token')) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to publish to gallery' },
      { status: 500 }
    );
  }
}
