import Replicate from 'replicate';
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
 * Replicate face swap provider
 * Uses codeplugtech/face-swap model (~$0.003/swap, ~27s)
 * Ignores prompt — dedicated face swap model, not prompt-driven
 */
export async function replicateSwap(input: FaceSwapInput): Promise<FaceSwapResult> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN not configured');
  }

  const replicate = new Replicate({ auth: apiToken });

  console.log('🔄 [Replicate] Preparing images...');

  // Replicate needs public URLs — upload base64 to Firebase temp storage
  const targetUrl = await uploadTempImage(input.targetImage, 'rep-target');
  const sourceUrl = await uploadTempImage(input.sourceImage, 'rep-source');

  console.log('🚀 [Replicate] Calling codeplugtech/face-swap...');

  const output = await replicate.run(
    'codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34',
    {
      input: {
        swap_image: sourceUrl,
        input_image: targetUrl,
      }
    }
  );

  // Output is a URL string or FileOutput object
  let resultUrl: string;
  if (typeof output === 'string') {
    resultUrl = output;
  } else if (output && typeof output === 'object' && 'url' in (output as any)) {
    resultUrl = (output as any).url();
  } else {
    // Could be a ReadableStream or other format
    resultUrl = String(output);
  }

  console.log(`✅ [Replicate] Result URL: ${resultUrl}`);

  // Download result and convert to base64
  const resultImage = await urlToBase64(resultUrl);
  console.log(`✅ [Replicate] Face swap completed, result size: ${resultImage.length} chars`);

  return { resultImage };
}
