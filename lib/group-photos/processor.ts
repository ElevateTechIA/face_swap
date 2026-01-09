/**
 * Group Photo Processing Utilities
 *
 * Handles sequential face swapping for group photos.
 * Process: Swap face 1 → result1, then swap face 2 onto result1 → result2, etc.
 */

export interface GroupSwapProgress {
  currentFace: number;
  totalFaces: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message: string;
  intermediateResults?: string[];
}

export interface GroupSwapParams {
  templateUrl: string;
  userImages: string[]; // Array of base64 or URLs
  style?: string;
  onProgress?: (progress: GroupSwapProgress) => void;
}

/**
 * Process multiple face swaps sequentially
 * Each swap uses the result from the previous swap as the new template
 */
export async function processGroupSwap({
  templateUrl,
  userImages,
  style,
  onProgress
}: GroupSwapParams): Promise<string> {
  const totalFaces = userImages.length;
  let currentTemplate = templateUrl;
  const intermediateResults: string[] = [];

  for (let i = 0; i < totalFaces; i++) {
    try {
      // Update progress
      onProgress?.({
        currentFace: i + 1,
        totalFaces,
        status: 'processing',
        message: `Swapping face ${i + 1} of ${totalFaces}...`,
        intermediateResults
      });

      // Call face swap API for this face
      const response = await fetch('/api/face-swap/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateUrl: currentTemplate,
          userImageUrl: userImages[i],
          style: style || 'natural',
          isGroupSwap: true,
          faceIndex: i,
          totalFaces
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Face swap failed');
      }

      const data = await response.json();

      // Use the result as the template for the next iteration
      currentTemplate = data.resultUrl;
      intermediateResults.push(currentTemplate);

    } catch (error: any) {
      onProgress?.({
        currentFace: i + 1,
        totalFaces,
        status: 'error',
        message: `Failed to swap face ${i + 1}: ${error.message}`,
        intermediateResults
      });
      throw error;
    }
  }

  // Final result
  onProgress?.({
    currentFace: totalFaces,
    totalFaces,
    status: 'completed',
    message: 'All faces swapped successfully!',
    intermediateResults
  });

  return currentTemplate; // Last result has all faces swapped
}

/**
 * Upload image to temporary storage and get URL
 * For group photos, we need to handle multiple images
 */
export async function uploadGroupImages(images: string[]): Promise<string[]> {
  const uploadPromises = images.map(async (imageData) => {
    // If already a URL, return as is
    if (imageData.startsWith('http')) {
      return imageData;
    }

    // Upload base64 to temporary storage
    const response = await fetch('/api/upload/temp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData })
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  });

  return Promise.all(uploadPromises);
}

/**
 * Validate group images before processing
 */
export function validateGroupImages(images: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (images.length === 0) {
    errors.push('No images provided');
  }

  if (images.length > 4) {
    errors.push('Maximum 4 faces supported');
  }

  // Check each image
  images.forEach((img, index) => {
    if (!img) {
      errors.push(`Image ${index + 1} is empty`);
    }
    // Could add more validation (size, format, etc.)
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
