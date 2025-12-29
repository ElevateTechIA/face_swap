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
  let isGuestTrial = false;

  try {
    // Obtener body del request primero
    const body = await request.json();
    const { sourceImage, targetImage, style, templateTitle, isGuestTrial: requestIsGuest } = body;

    // Detectar si es guest trial
    const guestHeader = request.headers.get('X-Guest-Trial');
    isGuestTrial = guestHeader === 'true' || requestIsGuest === true;

    // Verificar autenticación solo si NO es guest trial
    if (!isGuestTrial) {
      userId = await verifyUserAuth(request);
    } else {
      // Guest trial - generar ID temporal basado en IP o timestamp
      const forwardedFor = request.headers.get('x-forwarded-for');
      const ip = forwardedFor?.split(',')[0] || 'unknown';
      userId = `guest_${ip}_${Date.now()}`;
      console.log('🎁 Processing GUEST TRIAL for:', userId);
    }

    if (!sourceImage || !targetImage) {
      return NextResponse.json(
        { success: false, error: 'sourceImage y targetImage son requeridas' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const creditsPerSwap = parseInt(process.env.CREDITS_PER_FACE_SWAP || '1');

    let newCredits = 0;

    // Solo procesar créditos si NO es guest trial
    if (!isGuestTrial) {
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

        const calculatedNewCredits = currentCredits - creditsPerSwap;

        // Actualizar créditos
        transaction.update(userRef, {
          credits: calculatedNewCredits,
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
          balanceAfter: calculatedNewCredits,
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

        return { newCredits: calculatedNewCredits, txId, swapId };
      });

      transactionId = result.txId;
      faceSwapId = result.swapId;
      newCredits = result.newCredits;

      console.log(`✅ Credits deducted: user ${userId} now has ${newCredits} credits`);
    } else {
      // Guest trial - no deducir créditos, solo crear registro temporal
      faceSwapId = `guest_${Date.now()}`;
      console.log(`🎁 Guest trial - no credit deduction`);
    }

    // Llamar a Gemini API para procesar el Face Swap
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Obtener el prompt específico del template (o usar el default)
    const prompt = getTemplatePrompt(templateTitle);
    console.log(`🎯 Using prompt for template: ${templateTitle || 'default'}`);
    console.log(`📝 Prompt: ${prompt}`);

    // Extraer y validar las imágenes base64
    const targetBase64 = targetImage.split(',')[1];
    const sourceBase64 = sourceImage.split(',')[1];

    if (!targetBase64 || !sourceBase64) {
      throw new Error('Invalid image format');
    }

    console.log(`📸 Target image size: ${targetBase64.length} bytes`);
    console.log(`📸 Source image size: ${sourceBase64.length} bytes`);

    // Detectar el mimeType de las imágenes
    const targetMime = targetImage.split(';')[0].split(':')[1] || 'image/jpeg';
    const sourceMime = sourceImage.split(';')[0].split(':')[1] || 'image/jpeg';

    console.log(`🖼️ Target mime: ${targetMime}`);
    console.log(`🖼️ Source mime: ${sourceMime}`);

    // Using gemini-3-pro-image-preview for image generation and editing
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiApiKey}`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: targetMime, data: targetBase64 } },
          { inlineData: { mimeType: sourceMime, data: sourceBase64 } }
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

      // Parse error para mejor debugging
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Gemini error details:', JSON.stringify(errorJson, null, 2));

        // Errores comunes
        if (errorJson.error?.message?.includes('Unable to process input image')) {
          console.error('💡 Tip: Las imágenes pueden ser muy grandes o tener formato incompatible');
          console.error(`   Target size: ${targetBase64.length} bytes (${(targetBase64.length / 1024 / 1024).toFixed(2)} MB)`);
          console.error(`   Source size: ${sourceBase64.length} bytes (${(sourceBase64.length / 1024 / 1024).toFixed(2)} MB)`);
        }
      } catch (e) {
        // Error no es JSON
      }

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

    // Actualizar face swap a completed (solo para usuarios autenticados)
    if (!isGuestTrial && faceSwapId) {
      await db.collection('faceSwaps').doc(faceSwapId).update({
        status: 'completed',
        resultImageUrl: resultImageUrl || null,
        templateTitle: templateTitle || null,
        completedAt: FieldValue.serverTimestamp(),
      });
    }

    // Incrementar contador de uso del template y actualizar perfil del usuario
    if (templateTitle) {
      try {
        // Buscar el template por título
        const templatesSnapshot = await db.collection('templates')
          .where('title', '==', templateTitle)
          .limit(1)
          .get();

        if (!templatesSnapshot.empty) {
          const templateDoc = templatesSnapshot.docs[0];
          const templateId = templateDoc.id;

          // Incrementar usageCount del template
          await templateDoc.ref.update({
            usageCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          });

          console.log(`✅ Template usage incremented: ${templateTitle} (${templateId})`);

          // Actualizar perfil del usuario con template usado (solo para usuarios autenticados)
          if (!isGuestTrial && userId) {
            const profileRef = db.collection('userProfiles').doc(userId);
            const profileDoc = await profileRef.get();

            if (profileDoc.exists) {
              await profileRef.update({
                usedTemplates: FieldValue.arrayUnion({
                  templateId,
                  timestamp: new Date().toISOString(),
                }),
                updatedAt: FieldValue.serverTimestamp(),
              });

              console.log(`✅ User profile updated with template usage: ${userId}`);
            }
          }
        } else {
          console.log(`⚠️ Template not found in Firestore: ${templateTitle}`);
        }
      } catch (templateError: any) {
        console.error('⚠️ Error updating template usage:', templateError.message);
        // Non-critical error - continue
      }
    }

    console.log(`✅ Face swap completed successfully: ${faceSwapId}`);

    return NextResponse.json({
      success: true,
      resultImage,
      faceSwapId,
      creditsRemaining: isGuestTrial ? 0 : newCredits,
    });

  } catch (error: any) {
    console.error('❌ Error en Face Swap:', error.message);

    // Si hay error y ya se descontaron créditos, revertirlos (solo para usuarios autenticados)
    if (!isGuestTrial && userId && transactionId && faceSwapId) {
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
