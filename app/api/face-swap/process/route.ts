import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { FieldValue } from 'firebase-admin/firestore';
import { getTemplatePrompt } from '@/lib/template-prompts';
import { getStyleById } from '@/lib/styles/style-configs';
import { withRateLimit, RATE_LIMITS, getClientIp } from '@/lib/security/rate-limiter';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 60; // Face swap puede tomar tiempo

/**
 * Convierte una URL de imagen a base64 data URL
 * @param url URL de la imagen
 * @returns Data URL en formato base64
 */
async function urlToBase64(url: string): Promise<string> {
  try {
    console.log('🔄 Server fetching image from URL:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('✅ Image fetched, size:', buffer.length, 'bytes, type:', contentType);

    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    console.log('✅ Image converted to base64 on server');
    return dataUrl;
  } catch (error: any) {
    console.error('❌ Server urlToBase64 failed:', error.message);
    throw new Error(`Failed to fetch image from URL: ${error.message}`);
  }
}

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

    // Redimensionar usando sharp con fit: 'cover' para mantener aspect ratio y recortar
    // Esto evita distorsión mientras mantiene las dimensiones exactas
    const resizedBuffer = await sharp(buffer)
      .resize(targetWidth, targetHeight, {
        fit: 'cover', // Mantiene aspect ratio, recorta lo que sobre
        position: 'center', // Centra la imagen al recortar
        kernel: 'lanczos3' // Mejor calidad de redimensionamiento
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
      totalFaces
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

    // Llamar a Gemini API para procesar el Face Swap
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Obtener el prompt específico del template
    // Primero intentar obtener de Firestore (si el template fue actualizado desde admin)
    // Si no existe, usar el prompt del archivo template-prompts.ts
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
          
          // Si el template tiene un prompt custom en Firestore, usarlo
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

    // Si hay un estilo seleccionado, agregar sus instrucciones al prompt
    if (style) {
      const styleConfig = getStyleById(style);
      if (styleConfig) {
        prompt = `${prompt}\n\nAdditional style instructions: ${styleConfig.prompt}`;
        console.log(`🎨 Applying style: ${styleConfig.name} (${styleConfig.category})`);
      }
    }

    console.log(`🎯 Using prompt for template: ${templateTitle || 'default'}`);
    console.log(`📝 Full prompt: ${prompt}`);

    // Validar que las imágenes existen
    if (!targetImage || !sourceImage) {
      throw new Error('Missing required images: targetImage and sourceImage are required');
    }

    let resultImage: string;

    // Using gemini-3-pro-image-preview for image generation and editing
    const geminiModel = 'gemini-3-pro-image-preview';
    console.log(`🚀 Calling Gemini API (${geminiModel})...`);
    console.log(`📝 Using prompt: ${prompt.substring(0, 100)}...`);

    try {
      // Preparar las imágenes en el formato que espera Gemini
      // Si es una URL, convertirla a base64 primero
      let targetImageProcessed = targetImage;
      let sourceImageProcessed = sourceImage;

      if (targetImage.startsWith('http://') || targetImage.startsWith('https://')) {
        console.log('🔄 Converting target image URL to base64...');
        targetImageProcessed = await urlToBase64(targetImage);
      }

      if (sourceImage.startsWith('http://') || sourceImage.startsWith('https://')) {
        console.log('🔄 Converting source image URL to base64...');
        sourceImageProcessed = await urlToBase64(sourceImage);
      }

      // Extraer solo la parte base64 (sin el prefijo data:image/...)
      const targetImageData = targetImageProcessed.includes(',')
        ? targetImageProcessed.split(',')[1]
        : targetImageProcessed;
      const sourceImageData = sourceImageProcessed.includes(',')
        ? sourceImageProcessed.split(',')[1]
        : sourceImageProcessed;

      // Detectar el mime type de las imágenes
      const getImageMimeType = (dataUrl: string): string => {
        if (dataUrl.startsWith('data:')) {
          const mimeMatch = dataUrl.match(/data:([^;]+);/);
          return mimeMatch ? mimeMatch[1] : 'image/jpeg';
        }
        return 'image/jpeg';
      };

      const targetMimeType = getImageMimeType(targetImageProcessed);
      const sourceMimeType = getImageMimeType(sourceImageProcessed);

      console.log(`📸 Target MIME type: ${targetMimeType}`);
      console.log(`📸 Source MIME type: ${sourceMimeType}`);

      const geminiPrompt = `${prompt}\n\nIMPORTANT: You must maintain the EXACT composition, framing, and dimensions of the reference template image. Only replace the face with the provided face image. Do not crop, zoom, or change the scene composition in any way.`;

      // Usar API REST con responseModalities: ["IMAGE"] para generación de imágenes
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

      const payload = {
        contents: [{
          parts: [
            { text: geminiPrompt },
            {
              inlineData: {
                data: targetImageData,
                mimeType: targetMimeType,
              },
            },
            {
              inlineData: {
                data: sourceImageData,
                mimeType: sourceMimeType,
              },
            },
          ],
        }],
        generationConfig: { responseModalities: ["IMAGE"] }
      };

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
        console.error('❌ No image generated by Gemini');
        console.error('📄 Full response:', JSON.stringify(data, null, 2));
        throw new Error('GEMINI_NO_IMAGE');
      }

      const base64Image = generatedPart.inlineData.data;
      resultImage = `data:image/png;base64,${base64Image}`;

      console.log(`✅ Face swap completed, image size: ${base64Image.length} characters`);

      // Obtener dimensiones del template original
      const templateDimensions = await getImageDimensions(targetImage);
      console.log(`📏 Template dimensions: ${templateDimensions.width}x${templateDimensions.height}px`);

      // Obtener dimensiones de la imagen generada
      const generatedDimensions = await getImageDimensions(resultImage);
      console.log(`📏 Generated image dimensions: ${generatedDimensions.width}x${generatedDimensions.height}px`);

      // Si las dimensiones no coinciden, redimensionar a las del template
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
        
        // Verificar dimensiones finales
        const finalDimensions = await getImageDimensions(resultImage);
        console.log(`✅ Final image dimensions: ${finalDimensions.width}x${finalDimensions.height}px`);
      } else {
        console.log(`✅ Image dimensions match template perfectly!`);
      }

    } catch (geminiError: any) {
      console.error('❌ Gemini API error:', geminiError.message);
      console.error('❌ Full error object:', JSON.stringify(geminiError, null, 2));
      console.error('❌ Error stack:', geminiError.stack);
      throw new Error(`GEMINI_ERROR: ${geminiError.message || 'Unknown error'}`);
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
