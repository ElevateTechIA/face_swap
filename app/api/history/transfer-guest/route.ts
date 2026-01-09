import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

/**
 * Transfer guest face swap to authenticated user's history
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await verifyUserAuth(request);

    // Obtener datos del guest face swap
    const body = await request.json();
    const { resultImage, style, templateTitle, createdAt } = body;

    if (!resultImage) {
      return NextResponse.json(
        { success: false, error: 'No face swap data provided' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Subir imagen a Firebase Storage
    let resultImageUrl = '';
    const faceSwapId = `transferred_${Date.now()}`;

    try {
      const { uploadFaceSwapImage } = await import('@/lib/firebase/storage');
      resultImageUrl = await uploadFaceSwapImage(resultImage, userId, faceSwapId);
      console.log(`✅ Guest image uploaded to Storage: ${resultImageUrl}`);
    } catch (uploadError: any) {
      console.error('⚠️ Error uploading guest image:', uploadError.message);
      // Continue without URL - we'll store the base64 at least
    }

    // Crear registro en faceSwaps collection
    const faceSwapRef = db.collection('faceSwaps').doc(faceSwapId);
    await faceSwapRef.set({
      faceSwapId,
      userId,
      style: style || 'natural',
      templateTitle: templateTitle || null,
      creditsUsed: 0, // Guest trial - no credits used
      status: 'completed',
      resultImageUrl: resultImageUrl || null,
      isGuestTransfer: true, // Marcar como transferido desde guest
      createdAt: createdAt ? new Date(createdAt) : FieldValue.serverTimestamp(),
      completedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Guest face swap transferred to user ${userId}`);

    return NextResponse.json({
      success: true,
      faceSwapId,
      message: 'Guest face swap transferred successfully',
    });
  } catch (error: any) {
    console.error('❌ Error transferring guest face swap:', error.message);

    if (error.message.includes('autenticado') || error.message.includes('Token')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Error transferring guest face swap' },
      { status: 500 }
    );
  }
}
