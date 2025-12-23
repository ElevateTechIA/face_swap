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
