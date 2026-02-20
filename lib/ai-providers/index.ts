import { FaceSwapInput, FaceSwapResult, FaceSwapProvider } from './types';
import { geminiSwap } from './gemini-provider';
import { replicateSwap } from './replicate-provider';
import { wavespeedFaceSwap, wavespeedHairFaceSwap } from './wavespeed-provider';

export type { FaceSwapInput, FaceSwapResult, FaceSwapProvider };

/**
 * Get the current face swap provider from env
 */
function getProvider(): FaceSwapProvider {
  const provider = (process.env.FACE_SWAP_PROVIDER || 'gemini').toLowerCase();
  if (provider === 'replicate' || provider === 'wavespeed-face' || provider === 'wavespeed-hair-face' || provider === 'gemini') {
    return provider;
  }
  console.warn(`⚠️ Unknown FACE_SWAP_PROVIDER "${provider}", falling back to gemini`);
  return 'gemini';
}

/**
 * Perform a face swap using the configured provider
 * Uses input.provider if set, otherwise reads FACE_SWAP_PROVIDER env var
 */
export async function performFaceSwap(input: FaceSwapInput): Promise<FaceSwapResult> {
  const provider = input.provider || getProvider();
  console.log(`🎯 [FaceSwap] Using provider: ${provider} (source: ${input.provider ? 'user-selected' : 'env'})`);

  switch (provider) {
    case 'replicate':
      return replicateSwap(input);
    case 'wavespeed-face':
      return wavespeedFaceSwap(input);
    case 'wavespeed-hair-face':
      return wavespeedHairFaceSwap(input);
    case 'gemini':
    default:
      return geminiSwap(input);
  }
}
