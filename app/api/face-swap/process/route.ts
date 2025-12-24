import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { FieldValue } from 'firebase-admin/firestore';
import { getTemplatePrompt } from '@/lib/template-prompts';

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
    const { sourceImage, targetImage, style, templateTitle } = body;

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

    // Obtener el prompt específico del template (o usar el default)
    const prompt = getTemplatePrompt(templateTitle);
    console.log(`🎯 Using prompt for template: ${templateTitle || 'default'}`);
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`📸 Target image size: ${targetImage.split(',')[1]?.length || 0} bytes`);
    console.log(`📸 Source image size: ${sourceImage.split(',')[1]?.length || 0} bytes`);

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

    console.log(`🚀 Calling Gemini API...`);
    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log(`📡 Gemini response status: ${geminiResponse.status}`);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorText);
      throw new Error('GEMINI_API_ERROR');
    }

    const data = await geminiResponse.json();
    console.log(`📦 Gemini response received, candidates: ${data.candidates?.length || 0}`);

    const generatedPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

    if (!generatedPart?.inlineData) {
      console.error('❌ No image in Gemini response');
      console.error('Response data:', JSON.stringify(data, null, 2));
      throw new Error('GEMINI_NO_IMAGE');
    }

    const resultImage = `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
    console.log(`✅ Generated image received, size: ${generatedPart.inlineData.data.length} bytes`);

    // Subir imagen a Firebase Storage
    let resultImageUrl = '';
    try {
      const { uploadFaceSwapImage } = await import('@/lib/firebase/storage');
      resultImageUrl = await uploadFaceSwapImage(resultImage, userId!, faceSwapId);
      console.log(`✅ Image uploaded to Storage: ${resultImageUrl}`);
    } catch (uploadError: any) {
      console.error('⚠️ Error uploading to Storage:', uploadError.message);
      // Continue without storage URL - non-critical failure
    }

    // Actualizar face swap a completed
    await db.collection('faceSwaps').doc(faceSwapId).update({
      status: 'completed',
      resultImageUrl: resultImageUrl || null,
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
