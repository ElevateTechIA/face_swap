export type FaceSwapProvider = 'gemini' | 'replicate' | 'wavespeed' | 'wavespeed-pro';

export interface FaceSwapInput {
  targetImage: string; // base64 data URL or URL
  sourceImage: string; // base64 data URL or URL
  prompt: string;
  isGroupSwap?: boolean;
  faceIndex?: number;
  totalFaces?: number;
  slotType?: string;
  slotLabel?: string;
}

export interface FaceSwapResult {
  resultImage: string; // base64 data URL (data:image/png;base64,...)
}
