import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyUserAuth(request);

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const startAfter = searchParams.get('startAfter'); // transactionId for cursor

    const db = getAdminFirestore();
    let query = db
      .collection('transactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // Cursor-based pagination
    if (startAfter) {
      const startDoc = await db.collection('transactions').doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.get();

    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        transactionId: data.transactionId,
        type: data.type,
        credits: data.credits,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        description: data.description,
        metadata: data.metadata || {},
        createdAt: data.createdAt,
      };
    });

    console.log(`💳 Transactions fetched for user ${userId}: ${transactions.length} items`);

    return NextResponse.json({
      success: true,
      transactions,
      hasMore: snapshot.docs.length === limit,
      lastId: snapshot.docs[snapshot.docs.length - 1]?.id || null,
    });

  } catch (error: any) {
    console.error('❌ Error in GET /api/transactions:', error.message);

    if (error.message.includes('autenticado') || error.message.includes('Token')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Error al obtener transacciones' },
      { status: 500 }
    );
  }
}
