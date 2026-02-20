import { FaceSwapInput, FaceSwapResult } from './types';
import { uploadTempImage } from '@/lib/firebase/storage';

/**
 * Download image from URL and convert to base64 data URL
 */
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download result: HTTP ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

/**
 * WaveSpeed AI hair+face swap provider
 * Uses image-head-swap endpoint — swaps face + hair together
 * Ignores prompt — dedicated face swap model, not prompt-driven
 */
export async function wavespeedHairFaceSwap(input: FaceSwapInput): Promise<FaceSwapResult> {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) {
    throw new Error('WAVESPEED_API_KEY not configured');
  }

  console.log('🔄 [WaveSpeed] Preparing images...');

  // WaveSpeed needs public URLs — upload base64 to Firebase temp storage
  const targetUrl = await uploadTempImage(input.targetImage, 'ws-target');
  const sourceUrl = await uploadTempImage(input.sourceImage, 'ws-source');

  if (input.isGroupSwap) {
    console.log(`👥 [WaveSpeed] Group swap: face ${(input.faceIndex || 0) + 1} of ${input.totalFaces}, target_index: ${input.faceIndex || 0}`);
  }
  console.log('🚀 [WaveSpeed] Calling image-head-swap API...');

  const response = await fetch('https://api.wavespeed.ai/api/v3/wavespeed-ai/image-head-swap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      image: targetUrl,
      face_image: sourceUrl,
      enable_sync_mode: true,
      // For group swaps: target_index selects which face to replace (0 = largest)
      ...(input.isGroupSwap && input.faceIndex !== undefined && { target_index: input.faceIndex }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [WaveSpeed] API error: ${response.status}`, errorText);
    throw new Error(`WaveSpeed API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('📦 [WaveSpeed] Response received');

  // Extract result URL from sync response
  const resultUrl = data?.data?.outputs?.[0];
  if (!resultUrl) {
    console.error('❌ [WaveSpeed] No output URL in response:', JSON.stringify(data));
    throw new Error('WaveSpeed returned no output image');
  }

  console.log(`✅ [WaveSpeed] Result URL: ${resultUrl}`);

  // Download result and convert to base64
  const resultImage = await urlToBase64(resultUrl);
  console.log(`✅ [WaveSpeed] Face swap completed, result size: ${resultImage.length} chars`);

  return { resultImage };
}

/**
 * WaveSpeed AI face-only swap provider
 * Uses image-face-swap-pro endpoint — face-only swap (no hair)
 * More realistic blending than head swap
 */
export async function wavespeedFaceSwap(input: FaceSwapInput): Promise<FaceSwapResult> {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) {
    throw new Error('WAVESPEED_API_KEY not configured');
  }

  console.log('🔄 [WaveSpeed Face] Preparing images...');

  const targetUrl = await uploadTempImage(input.targetImage, 'wsf-target');
  const sourceUrl = await uploadTempImage(input.sourceImage, 'wsf-source');

  if (input.isGroupSwap) {
    console.log(`👥 [WaveSpeed Face] Group swap: face ${(input.faceIndex || 0) + 1} of ${input.totalFaces}, target_index: ${input.faceIndex || 0}`);
  }
  console.log('🚀 [WaveSpeed Face] Calling image-face-swap-pro API...');

  const response = await fetch('https://api.wavespeed.ai/api/v3/wavespeed-ai/image-face-swap-pro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      image: targetUrl,
      face_image: sourceUrl,
      enable_sync_mode: true,
      ...(input.isGroupSwap && input.faceIndex !== undefined && { target_index: input.faceIndex }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [WaveSpeed Face] API error: ${response.status}`, errorText);
    throw new Error(`WaveSpeed Face API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('📦 [WaveSpeed Face] Response received');

  const resultUrl = data?.data?.outputs?.[0];
  if (!resultUrl) {
    console.error('❌ [WaveSpeed Face] No output URL in response:', JSON.stringify(data));
    throw new Error('WaveSpeed Face returned no output image');
  }

  console.log(`✅ [WaveSpeed Face] Result URL: ${resultUrl}`);

  const resultImage = await urlToBase64(resultUrl);
  console.log(`✅ [WaveSpeed Face] Face swap completed, result size: ${resultImage.length} chars`);

  return { resultImage };
}
