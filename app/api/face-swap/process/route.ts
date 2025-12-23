import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const maxDuration = 60; // Face swap puede tomar tiempo

export async function POST(request: NextRequest) {
  let faceSwapId: string | null = null;
  let transactionId: string | null = null;
  let userId: string | null = null;

  try {
    // Verificar autenticación
    userId = await verifyUserAuth(request);

    // Obtener body del request
    const body = await request.json();
    const { sourceImage, targetImage, style } = body;

    if (!sourceImage || !targetImage) {
      return NextResponse.json(
        { success: false, error: 'sourceImage y targetImage son requeridas' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const creditsPerSwap = parseInt(process.env.CREDITS_PER_FACE_SWAP || '1');

    // Transacción atómica: verificar créditos y descontarlos
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId!);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      const userData = userDoc.data()!;
      const currentCredits = userData.credits || 0;

      if (currentCredits < creditsPerSwap) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      const newCredits = currentCredits - creditsPerSwap;

      // Actualizar créditos
      transaction.update(userRef, {
        credits: newCredits,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Crear registro de transacción
      const txRef = db.collection('transactions').doc();
      const txId = txRef.id;

      transaction.set(txRef, {
        userId: userId!,
        type: 'usage',
        credits: -creditsPerSwap,
        balanceBefore: currentCredits,
        balanceAfter: newCredits,
        description: 'Face Swap completed',
        createdAt: FieldValue.serverTimestamp(),
      });

      // Crear registro de face swap
      const faceSwapRef = db.collection('faceSwaps').doc();
      const swapId = faceSwapRef.id;

      transaction.set(faceSwapRef, {
        faceSwapId: swapId,
        userId: userId!,
        style: style || 'natural',
        creditsUsed: creditsPerSwap,
        status: 'processing',
        transactionId: txId,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { newCredits, txId, swapId };
    });

    transactionId = result.txId;
    faceSwapId = result.swapId;

    console.log(`✅ Credits deducted: user ${userId} now has ${result.newCredits} credits`);

    // Llamar a Gemini API para procesar el Face Swap
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = "A high-quality face swap where the face from the second image (source) replaces the face of the person in the first image (target). The new face should perfectly integrate into the scene, adopting the exact lighting, shadows, skin tone, and color grading of the first image. It should also maintain the specific features, makeup, and expression of the second image, ensuring a realistic and precise swap.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${geminiApiKey}`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/png", data: targetImage.split(',')[1] } },
          { inlineData: { mimeType: "image/png", data: sourceImage.split(',')[1] } }
        ]
      }],
      generationConfig: { responseModalities: ["IMAGE"] }
    };

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorText);
      throw new Error('GEMINI_API_ERROR');
    }

    const data = await geminiResponse.json();
    const generatedPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

    if (!generatedPart?.inlineData) {
      throw new Error('GEMINI_NO_IMAGE');
    }

    const resultImage = `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;

    // Actualizar face swap a completed
    await db.collection('faceSwaps').doc(faceSwapId).update({
      status: 'completed',
      completedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Face swap completed successfully: ${faceSwapId}`);

    return NextResponse.json({
      success: true,
      resultImage,
      faceSwapId,
      creditsRemaining: result.newCredits,
    });

  } catch (error: any) {
    console.error('❌ Error en Face Swap:', error.message);

    // Si hay error y ya se descontaron créditos, revertirlos
    if (userId && transactionId && faceSwapId) {
      try {
        const db = getAdminFirestore();
        const creditsPerSwap = parseInt(process.env.CREDITS_PER_FACE_SWAP || '1');

        // Transacción de reversión
        await db.runTransaction(async (transaction) => {
          const userRef = db.collection('users').doc(userId!);
          const userDoc = await transaction.get(userRef);

          if (userDoc.exists) {
            const currentCredits = userDoc.data()!.credits || 0;
            const refundedCredits = currentCredits + creditsPerSwap;

            transaction.update(userRef, {
              credits: refundedCredits,
              updatedAt: FieldValue.serverTimestamp(),
            });

            // Crear transacción de reversión
            const refundTxRef = db.collection('transactions').doc();
            transaction.set(refundTxRef, {
              userId: userId!,
              type: 'bonus',
              credits: creditsPerSwap,
              balanceBefore: currentCredits,
              balanceAfter: refundedCredits,
              description: 'Face swap failed - credit refunded',
              metadata: {
                faceSwapId,
                originalTransactionId: transactionId,
              },
              createdAt: FieldValue.serverTimestamp(),
            });
          }
        });

        // Actualizar face swap a failed
        await db.collection('faceSwaps').doc(faceSwapId).update({
          status: 'failed',
          errorMessage: error.message,
          completedAt: FieldValue.serverTimestamp(),
        });

        console.log(`🔄 Credit refunded due to failure`);
      } catch (refundError: any) {
        console.error('❌ Error during credit refund:', refundError.message);
      }
    }

    // Retornar error apropiado
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes suficientes créditos',
          code: 'INSUFFICIENT_CREDITS',
        },
        { status: 402 }
      );
    }

    if (error.message.includes('autenticado') || error.message.includes('Token')) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error procesando Face Swap',
        code: 'PROCESSING_ERROR',
      },
      { status: 500 }
    );
  }
}
