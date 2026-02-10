import { FaceSwapInput, FaceSwapResult } from './types';

/**
 * Convert image URL to base64 data URL
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
 * Detect MIME type from data URL
 */
function getImageMimeType(dataUrl: string): string {
  if (dataUrl.startsWith('data:')) {
    const mimeMatch = dataUrl.match(/data:([^;]+);/);
    return mimeMatch ? mimeMatch[1] : 'image/jpeg';
  }
  return 'image/jpeg';
}

/**
 * Gemini face swap provider
 * Uses gemini-3-pro-image-preview with responseModalities: ["IMAGE"]
 */
export async function geminiSwap(input: FaceSwapInput): Promise<FaceSwapResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const { targetImage, sourceImage, prompt, isGroupSwap, faceIndex, totalFaces, slotType, slotLabel } = input;

  // Convert URLs to base64 if needed
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

  // Extract base64 data (without data:image/... prefix)
  const targetImageData = targetImageProcessed.includes(',')
    ? targetImageProcessed.split(',')[1]
    : targetImageProcessed;
  const sourceImageData = sourceImageProcessed.includes(',')
    ? sourceImageProcessed.split(',')[1]
    : sourceImageProcessed;

  const targetMimeType = getImageMimeType(targetImageProcessed);
  const sourceMimeType = getImageMimeType(sourceImageProcessed);

  console.log(`📸 Target MIME type: ${targetMimeType}`);
  console.log(`📸 Source MIME type: ${sourceMimeType}`);

  // Build slot-specific instructions for group swaps
  let slotInstructions = '';
  if (isGroupSwap && slotType) {
    if (slotType === 'pet') {
      slotInstructions = `\n\nSPECIAL INSTRUCTION: The second image contains a PET (animal). Replace the ${slotLabel || 'pet/animal'} in the template with the pet from the second image. Maintain the pet's natural appearance, breed characteristics, and coloring. Place the pet in the same position and scale as the original.`;
    } else {
      const subjectDesc = slotLabel || slotType;
      slotInstructions = `\n\nCONTEXT: This is face ${(faceIndex || 0) + 1} of ${totalFaces} in a group swap. The subject for this slot is: ${subjectDesc} (type: ${slotType}). Replace this specific subject's face in the template with the face from the second image.`;
    }
  }

  const geminiPrompt = `${prompt}\n\nCRITICAL INSTRUCTIONS:\n- The FIRST image is the template/reference scene. The SECOND image is the user's face.\n- ONLY replace the face. Keep EVERYTHING else from the template PIXEL-PERFECT: exact same crop, framing, zoom level, camera angle, pose, body position, outfit, accessories, background, and all objects in the scene.\n- Use the user's natural skin tone and hairstyle from the second image, adapted to the template's lighting.\n- Do NOT keep the template's hair or skin tone — use the user's.\n- The output image MUST have the EXACT same framing and field of view as the template. Do NOT zoom in, zoom out, crop differently, or shift the composition. Every element must be in the same position as the template.${slotInstructions}`;

  const geminiModel = 'gemini-3-pro-image-preview';
  console.log(`🚀 Calling Gemini API (${geminiModel})...`);

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

  // Retry logic: Gemini sometimes returns text instead of image
  const MAX_RETRIES = 2;
  let base64Image: string | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`🚀 Gemini attempt ${attempt}/${MAX_RETRIES}...`);

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log(`📡 Gemini response status: ${geminiResponse.status}`);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`❌ Gemini API error (attempt ${attempt}):`, errorText);
      if (attempt === MAX_RETRIES) throw new Error('GEMINI_API_ERROR');
      console.log(`⏳ Retrying in 2 seconds...`);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    const data = await geminiResponse.json();
    console.log(`📦 Gemini response received, candidates: ${data.candidates?.length || 0}`);

    // Log any text response (safety block reason, refusal, etc.)
    const textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
    if (textPart?.text) {
      console.warn(`⚠️ Gemini returned text instead of image: "${textPart.text.substring(0, 200)}"`);
    }

    // Log finish reason and safety ratings
    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      console.warn(`⚠️ Gemini finish reason: ${finishReason}`);
    }
    const safetyRatings = data.candidates?.[0]?.safetyRatings;
    if (safetyRatings) {
      const blocked = safetyRatings.filter((r: any) => r.blocked);
      if (blocked.length > 0) {
        console.warn(`🚫 Gemini safety blocked:`, JSON.stringify(blocked));
      }
    }

    const generatedPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

    if (generatedPart?.inlineData) {
      base64Image = generatedPart.inlineData.data;
      console.log(`✅ Image received on attempt ${attempt}`);
      break;
    }

    console.warn(`⚠️ No image in response (attempt ${attempt}/${MAX_RETRIES})`);
    if (attempt === MAX_RETRIES) {
      console.error('📄 Full response:', JSON.stringify(data, null, 2));
      throw new Error('GEMINI_NO_IMAGE');
    }
    console.log(`⏳ Retrying in 2 seconds...`);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`✅ Gemini face swap completed, image size: ${base64Image!.length} characters`);

  return {
    resultImage: `data:image/png;base64,${base64Image}`,
  };
}
