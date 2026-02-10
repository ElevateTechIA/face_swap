import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { FieldValue } from 'firebase-admin/firestore';
import { getTemplatePrompt } from '@/lib/template-prompts';
import { getStyleById } from '@/lib/styles/style-configs';
import { withRateLimit, RATE_LIMITS, getClientIp } from '@/lib/security/rate-limiter';
import { performFaceSwap } from '@/lib/ai-providers';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 60; // Face swap puede tomar tiempo

/**
 * Extrae dimensiones de una imagen base64 o URL
 * @param dataUrlOrUrl Data URL en formato base64 o URL regular
 * @returns Objeto con width y height
 */
async function getImageDimensions(dataUrlOrUrl: string): Promise<{ width: number; height: number }> {
  try {
    if (!dataUrlOrUrl) {
      throw new Error('Image data is undefined or empty');
    }

    let buffer: Buffer;

    // Si es una URL regular, descargarla primero
    if (dataUrlOrUrl.startsWith('http://') || dataUrlOrUrl.startsWith('https://')) {
      console.log('📥 Fetching image from URL to get dimensions:', dataUrlOrUrl);
      const response = await fetch(dataUrlOrUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Es un data URL, extraer el base64
      const base64Data = dataUrlOrUrl.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid data URL format - no base64 data found');
      }
      buffer = Buffer.from(base64Data, 'base64');
    }

    const metadata = await sharp(buffer).metadata();
    return { width: metadata.width || 0, height: metadata.height || 0 };
  } catch (error: any) {
    console.error('❌ Error getting image dimensions:', error.message);
    throw new Error(`Failed to get image dimensions: ${error.message}`);
  }
}

/**
 * Redimensiona una imagen base64 o URL a dimensiones específicas
 * @param dataUrlOrUrl Data URL en formato base64 o URL regular
 * @param targetWidth Ancho objetivo en píxeles
 * @param targetHeight Alto objetivo en píxeles
 * @returns Data URL redimensionado
 */
async function resizeImageToExactDimensions(
  dataUrlOrUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  try {
    console.log(`📐 Resizing image to exact dimensions: ${targetWidth}x${targetHeight}px`);

    if (!dataUrlOrUrl) {
      throw new Error('Image data is undefined or empty');
    }

    let buffer: Buffer;

    // Si es una URL regular, descargarla primero
    if (dataUrlOrUrl.startsWith('http://') || dataUrlOrUrl.startsWith('https://')) {
      console.log('📥 Fetching image from URL to resize:', dataUrlOrUrl);
      const response = await fetch(dataUrlOrUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Es un data URL, extraer el base64
      const base64Data = dataUrlOrUrl.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid data URL format - no base64 data found');
      }
      buffer = Buffer.from(base64Data, 'base64');
    }

    // Redimensionar con fill para preservar todo el contenido sin recortar
    const resizedBuffer = await sharp(buffer)
      .resize(targetWidth, targetHeight, {
        fit: 'fill',
        kernel: 'lanczos3'
      })
      .jpeg({ quality: 95 }) // Alta calidad
      .toBuffer();

    const resizedBase64 = resizedBuffer.toString('base64');
    const resizedDataUrl = `data:image/jpeg;base64,${resizedBase64}`;

    console.log(`✅ Image resized successfully without distortion`);
    return resizedDataUrl;
  } catch (error: any) {
    console.error('❌ Error resizing image:', error.message);
    throw new Error(`Failed to resize image: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  let faceSwapId: string | null = null;
  let transactionId: string | null = null;
  let userId: string | null = null;
  let isGuestTrial = false;

  try {
    // Obtener body del request primero
    const body = await request.json();
    
    // Debug: Log complete body
    console.log('📦 Request body keys:', Object.keys(body));
    console.log('🔍 sourceImage exists:', !!body.sourceImage);
    console.log('🔍 targetImage exists:', !!body.targetImage);
    console.log('🔍 sourceImage type:', typeof body.sourceImage);
    console.log('🔍 targetImage type:', typeof body.targetImage);
    if (body.sourceImage) {
      console.log('🔍 sourceImage preview:', body.sourceImage.substring(0, 100));
    }
    if (body.targetImage) {
      console.log('🔍 targetImage preview:', body.targetImage.substring(0, 100));
    }
    
    const {
      sourceImage,
      targetImage,
      style,
      templateTitle,
      isGuestTrial: requestIsGuest,
      isGroupSwap,
      faceIndex,
      totalFaces,
      slotType,
      slotLabel,
    } = body;

    // Detectar si es guest trial
    const guestHeader = request.headers.get('X-Guest-Trial');
    isGuestTrial = guestHeader === 'true' || requestIsGuest === true;

    // Log group swap info
    if (isGroupSwap) {
      console.log(`👥 GROUP SWAP: Processing face ${faceIndex + 1} of ${totalFaces}`);
    }

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

    // 🔒 SECURITY: Rate limiting
    console.log('🔒 Checking rate limit...');
    const { allowed, result } = await withRateLimit(
      request,
      RATE_LIMITS.FACE_SWAP,
      userId || undefined
    );

    if (!allowed) {
      const clientIp = getClientIp(request);
      console.warn(`⚠️ Rate limit exceeded for ${userId || clientIp}`);

      return NextResponse.json(
        {
          success: false,
          error: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.retryAfter || 3600),
            'X-RateLimit-Limit': String(RATE_LIMITS.FACE_SWAP.maxRequests),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.resetTime)
          }
        }
      );
    }

    console.log(`✅ Rate limit OK: ${result.remaining}/${RATE_LIMITS.FACE_SWAP.maxRequests} remaining`);

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

    // Build prompt for the face swap
    let prompt = getTemplatePrompt(templateTitle);

    if (templateTitle) {
      try {
        const templatesSnapshot = await db.collection('templates')
          .where('title', '==', templateTitle)
          .limit(1)
          .get();

        if (!templatesSnapshot.empty) {
          const templateDoc = templatesSnapshot.docs[0];
          const templateData = templateDoc.data();

          if (templateData.prompt && templateData.prompt.trim()) {
            prompt = templateData.prompt;
            console.log(`🔄 Using custom prompt from Firestore for template: ${templateTitle}`);
          } else {
            console.log(`📝 Using hardcoded prompt from template-prompts.ts for: ${templateTitle}`);
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ Could not fetch template from Firestore: ${error.message}`);
        console.log(`📝 Falling back to hardcoded prompt for: ${templateTitle}`);
      }
    }

    if (style) {
      const styleConfig = getStyleById(style);
      if (styleConfig) {
        prompt = `${prompt}\n\nAdditional style instructions: ${styleConfig.prompt}`;
        console.log(`🎨 Applying style: ${styleConfig.name} (${styleConfig.category})`);
      }
    }

    console.log(`🎯 Using prompt for template: ${templateTitle || 'default'}`);

    if (!targetImage || !sourceImage) {
      throw new Error('Missing required images: targetImage and sourceImage are required');
    }

    let resultImage: string;

    try {
      // Call the configured face swap provider (gemini, replicate, or wavespeed)
      const swapResult = await performFaceSwap({
        targetImage,
        sourceImage,
        prompt,
        isGroupSwap,
        faceIndex,
        totalFaces,
        slotType,
        slotLabel,
      });

      resultImage = swapResult.resultImage;
      console.log(`✅ Face swap completed via provider`);

      // Match result dimensions to template
      const templateDimensions = await getImageDimensions(targetImage);
      console.log(`📏 Template dimensions: ${templateDimensions.width}x${templateDimensions.height}px`);

      const generatedDimensions = await getImageDimensions(resultImage);
      console.log(`📏 Generated image dimensions: ${generatedDimensions.width}x${generatedDimensions.height}px`);

      if (
        generatedDimensions.width !== templateDimensions.width ||
        generatedDimensions.height !== templateDimensions.height
      ) {
        console.log(`⚠️ Dimensions mismatch! Resizing to match template...`);
        resultImage = await resizeImageToExactDimensions(
          resultImage,
          templateDimensions.width,
          templateDimensions.height
        );

        const finalDimensions = await getImageDimensions(resultImage);
        console.log(`✅ Final image dimensions: ${finalDimensions.width}x${finalDimensions.height}px`);
      } else {
        console.log(`✅ Image dimensions match template perfectly!`);
      }

    } catch (providerError: any) {
      console.error('❌ Face swap provider error:', providerError.message);
      console.error('❌ Error stack:', providerError.stack);
      throw new Error(`PROVIDER_ERROR: ${providerError.message || 'Unknown error'}`);
    }

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
      resultUrl: resultImageUrl || resultImage, // For group swaps to use in next iteration
      faceSwapId,
      creditsRemaining: isGuestTrial ? 0 : newCredits,
      isGroupSwap: isGroupSwap || false,
      faceIndex: faceIndex ?? 0,
      totalFaces: totalFaces ?? 1,
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
        details: error.message || 'Unknown error',
        code: 'PROCESSING_ERROR',
      },
      { status: 500 }
    );
  }
}
