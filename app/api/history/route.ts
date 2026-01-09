import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyUserAuth(request);

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const startAfter = searchParams.get('startAfter'); // faceSwapId for cursor

    const db = getAdminFirestore();
    let query = db
      .collection('faceSwaps')
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      .orderBy('completedAt', 'desc')
      .limit(limit);

    // Cursor-based pagination
    if (startAfter) {
      const startDoc = await db.collection('faceSwaps').doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.get();

    const history = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        // Only include face swaps with resultImageUrl
        return data.resultImageUrl && data.resultImageUrl.trim() !== '';
      })
      .map(doc => {
        const data = doc.data();
        return {
          faceSwapId: data.faceSwapId,
          resultImageUrl: data.resultImageUrl || '',
          style: data.style,
          createdAt: data.createdAt,
          completedAt: data.completedAt,
        };
      });

    console.log(`📊 History fetched for user ${userId}: ${history.length} items`);

    return NextResponse.json({
      success: true,
      history,
      hasMore: snapshot.docs.length === limit,
      lastId: snapshot.docs[snapshot.docs.length - 1]?.id || null,
    });

  } catch (error: any) {
    console.error('❌ Error in GET /api/history:', error.message);

    if (error.message.includes('autenticado') || error.message.includes('Token')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyUserAuth(request);

    // Parse body to get faceSwapId
    const body = await request.json();
    const { faceSwapId } = body;

    if (!faceSwapId) {
      return NextResponse.json(
        { error: 'faceSwapId es requerido' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Get the face swap document
    const faceSwapDoc = await db.collection('faceSwaps').doc(faceSwapId).get();

    if (!faceSwapDoc.exists) {
      return NextResponse.json(
        { error: 'Face swap no encontrado' },
        { status: 404 }
      );
    }

    const faceSwapData = faceSwapDoc.data();

    // Verify ownership
    if (faceSwapData?.userId !== userId) {
      return NextResponse.json(
        { error: 'No autorizado para eliminar este face swap' },
        { status: 403 }
      );
    }

    // Check if it was published to public gallery and delete it
    if (faceSwapData.isPublic || faceSwapData.publicGalleryId) {
      try {
        const galleryQuery = await db.collection('publicGallery')
          .where('faceSwapId', '==', faceSwapId)
          .limit(1)
          .get();

        if (!galleryQuery.empty) {
          const galleryDoc = galleryQuery.docs[0];
          await galleryDoc.ref.delete();
          console.log(`🗑️ Deleted from public gallery: ${galleryDoc.id}`);
        }
      } catch (galleryError) {
        console.error('⚠️ Error deleting from public gallery:', galleryError);
        // Continue with face swap deletion even if gallery deletion fails
      }
    }

    // Delete the face swap document
    await db.collection('faceSwaps').doc(faceSwapId).delete();

    console.log(`🗑️ Face swap ${faceSwapId} deleted by user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Face swap eliminado exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error in DELETE /api/history:', error.message);

    if (error.message.includes('autenticado') || error.message.includes('Token')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Error al eliminar face swap' },
      { status: 500 }
    );
  }
}
