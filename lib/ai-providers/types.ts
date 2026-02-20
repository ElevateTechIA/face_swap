export type FaceSwapProvider = 'gemini' | 'replicate' | 'wavespeed-face' | 'wavespeed-hair-face';

export interface FaceSwapInput {
  targetImage: string; // base64 data URL or URL
  sourceImage: string; // base64 data URL or URL
  prompt: string;
  provider?: FaceSwapProvider; // Optional: override env-based provider
  isGroupSwap?: boolean;
  faceIndex?: number;
  totalFaces?: number;
  slotType?: string;
  slotLabel?: string;
}

export interface FaceSwapResult {
  resultImage: string; // base64 data URL (data:image/png;base64,...)
}
