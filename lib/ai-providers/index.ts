import { FaceSwapInput, FaceSwapResult, FaceSwapProvider } from './types';
import { geminiSwap } from './gemini-provider';
import { replicateSwap } from './replicate-provider';
import { wavespeedSwap, wavespeedProSwap } from './wavespeed-provider';

export type { FaceSwapInput, FaceSwapResult, FaceSwapProvider };

/**
 * Get the current face swap provider from env
 */
function getProvider(): FaceSwapProvider {
  const provider = (process.env.FACE_SWAP_PROVIDER || 'gemini').toLowerCase();
  if (provider === 'replicate' || provider === 'wavespeed' || provider === 'wavespeed-pro' || provider === 'gemini') {
    return provider;
  }
  console.warn(`⚠️ Unknown FACE_SWAP_PROVIDER "${provider}", falling back to gemini`);
  return 'gemini';
}

/**
 * Perform a face swap using the configured provider
 * Reads FACE_SWAP_PROVIDER env var to select: gemini | replicate | wavespeed | wavespeed-pro
 */
export async function performFaceSwap(input: FaceSwapInput): Promise<FaceSwapResult> {
  const provider = getProvider();
  console.log(`🎯 [FaceSwap] Using provider: ${provider}`);

  switch (provider) {
    case 'replicate':
      return replicateSwap(input);
    case 'wavespeed':
      return wavespeedSwap(input);
    case 'wavespeed-pro':
      return wavespeedProSwap(input);
    case 'gemini':
    default:
      return geminiSwap(input);
  }
}
