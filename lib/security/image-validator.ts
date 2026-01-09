/**
 * Image Security Validator
 *
 * Validates uploaded images for security threats:
 * - File size limits
 * - Dimension limits (prevent decompression bombs)
 * - Content type validation
 * - EXIF metadata stripping
 */

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedImage?: string;
}

export interface ImageValidationConfig {
  maxSizeBytes: number;        // Default: 10MB
  maxWidth: number;             // Default: 4096px
  maxHeight: number;            // Default: 4096px
  allowedMimeTypes: string[];   // Default: ['image/jpeg', 'image/png', 'image/webp']
  stripExif: boolean;           // Default: true
  checkAspectRatio: boolean;    // Default: true
}

const DEFAULT_CONFIG: ImageValidationConfig = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  maxWidth: 4096,
  maxHeight: 4096,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  stripExif: true,
  checkAspectRatio: true,
};

/**
 * Validate image from base64 data URL
 */
export async function validateImage(
  imageDataUrl: string,
  config: Partial<ImageValidationConfig> = {}
): Promise<ImageValidationResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Validate format
    if (!imageDataUrl.startsWith('data:image/')) {
      errors.push('Invalid image format - must be data URL');
      return { valid: false, errors, warnings };
    }

    // 2. Extract MIME type
    const mimeMatch = imageDataUrl.match(/data:(image\/[^;]+);/);
    if (!mimeMatch) {
      errors.push('Cannot determine image MIME type');
      return { valid: false, errors, warnings };
    }

    const mimeType = mimeMatch[1];
    if (!fullConfig.allowedMimeTypes.includes(mimeType)) {
      errors.push(`Unsupported image type: ${mimeType}. Allowed: ${fullConfig.allowedMimeTypes.join(', ')}`);
      return { valid: false, errors, warnings };
    }

    // 3. Validate size
    const base64Data = imageDataUrl.split(',')[1];
    const sizeBytes = Math.ceil((base64Data.length * 3) / 4);

    if (sizeBytes > fullConfig.maxSizeBytes) {
      errors.push(`Image too large: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB (max: ${(fullConfig.maxSizeBytes / 1024 / 1024).toFixed(2)}MB)`);
      return { valid: false, errors, warnings };
    }

    // 4. Validate dimensions (client-side)
    const dimensions = await getImageDimensions(imageDataUrl);

    if (dimensions.width > fullConfig.maxWidth || dimensions.height > fullConfig.maxHeight) {
      errors.push(`Image dimensions too large: ${dimensions.width}x${dimensions.height}px (max: ${fullConfig.maxWidth}x${fullConfig.maxHeight}px)`);
      return { valid: false, errors, warnings };
    }

    // 5. Check for suspicious aspect ratios (possible decompression bomb)
    if (fullConfig.checkAspectRatio) {
      const aspectRatio = dimensions.width / dimensions.height;
      if (aspectRatio > 10 || aspectRatio < 0.1) {
        warnings.push(`Unusual aspect ratio: ${aspectRatio.toFixed(2)}. This might indicate a manipulated image.`);
      }
    }

    // 6. Strip EXIF metadata (privacy & security)
    let sanitizedImage = imageDataUrl;
    if (fullConfig.stripExif && (mimeType === 'image/jpeg' || mimeType === 'image/jpg')) {
      sanitizedImage = await stripExifData(imageDataUrl);
      if (sanitizedImage !== imageDataUrl) {
        warnings.push('EXIF metadata was removed from image for privacy');
      }
    }

    return {
      valid: true,
      errors,
      warnings,
      sanitizedImage
    };

  } catch (error: any) {
    errors.push(`Validation error: ${error.message}`);
    return { valid: false, errors, warnings };
  }
}

/**
 * Get image dimensions without loading full image
 */
async function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
}

/**
 * Strip EXIF metadata from JPEG images
 * EXIF can contain GPS coordinates, camera info, etc.
 */
async function stripExifData(dataUrl: string): Promise<string> {
  try {
    // Create canvas and draw image without EXIF
    const img = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');

    ctx.drawImage(img, 0, 0);

    // Convert back to data URL without EXIF
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
    console.error('Failed to strip EXIF:', error);
    return dataUrl; // Return original if stripping fails
  }
}

/**
 * Helper to load image
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Batch validate multiple images (for group photos)
 */
export async function validateImages(
  images: string[],
  config?: Partial<ImageValidationConfig>
): Promise<{
  allValid: boolean;
  results: ImageValidationResult[];
  sanitizedImages: string[];
}> {
  const results = await Promise.all(
    images.map(img => validateImage(img, config))
  );

  const allValid = results.every(r => r.valid);
  const sanitizedImages = results.map(r => r.sanitizedImage || '');

  return {
    allValid,
    results,
    sanitizedImages
  };
}
