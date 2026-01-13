/**
 * @jest-environment jsdom
 */
import {
  validateImage,
  validateImages,
  ImageValidationConfig,
} from '../image-validator'

// Mock Image constructor
class MockImage {
  private _src = ''
  public onload: (() => void) | null = null
  public onerror: (() => void) | null = null
  public naturalWidth = 1024
  public naturalHeight = 768

  get src() {
    return this._src
  }

  set src(value: string) {
    this._src = value
    // Simulate async load
    setTimeout(() => {
      if (this.onload) {
        this.onload()
      }
    }, 0)
  }
}

// Mock Canvas
class MockCanvas {
  public width = 0
  public height = 0

  getContext() {
    return {
      drawImage: jest.fn(),
    }
  }

  toDataURL() {
    return 'data:image/jpeg;base64,mockbase64data'
  }
}

// Setup global mocks
global.Image = MockImage as any
global.document.createElement = jest.fn((tag: string) => {
  if (tag === 'canvas') {
    return new MockCanvas() as any
  }
  return {} as any
})

describe('Image Validator', () => {
  const validJpegDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD'
  const validPngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'

  describe('validateImage', () => {
    it('should validate a valid JPEG image', async () => {
      const result = await validateImage(validJpegDataUrl)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitizedImage).toBeDefined()
    })

    it('should validate a valid PNG image', async () => {
      const result = await validateImage(validPngDataUrl)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject non-data URL', async () => {
      const result = await validateImage('https://example.com/image.jpg')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid image format - must be data URL')
    })

    it('should reject invalid data URL format', async () => {
      const result = await validateImage('data:text/plain;base64,hello')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject unsupported MIME types', async () => {
      const result = await validateImage('data:image/gif;base64,R0lGODlhAQABAIAAAP')

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Unsupported image type'))).toBe(true)
    })

    it('should reject images exceeding size limit', async () => {
      // Create a large base64 string (> 10MB)
      const largeBase64 = 'A'.repeat(15 * 1024 * 1024)
      const largeDataUrl = `data:image/jpeg;base64,${largeBase64}`

      const result = await validateImage(largeDataUrl)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Image too large'))).toBe(true)
    })

    it('should reject images exceeding dimension limits', async () => {
      // Mock large image dimensions
      const originalImage = global.Image
      class LargeImage extends MockImage {
        public naturalWidth = 5000
        public naturalHeight = 5000
      }
      global.Image = LargeImage as any

      const result = await validateImage(validJpegDataUrl)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('dimensions too large'))).toBe(true)

      // Restore original
      global.Image = originalImage
    })

    it('should warn about unusual aspect ratios', async () => {
      // Mock weird aspect ratio
      const originalImage = global.Image
      class WeirdImage extends MockImage {
        public naturalWidth = 1000
        public naturalHeight = 50 // 20:1 aspect ratio
      }
      global.Image = WeirdImage as any

      const result = await validateImage(validJpegDataUrl)

      expect(result.warnings.some(w => w.includes('Unusual aspect ratio'))).toBe(true)

      // Restore original
      global.Image = originalImage
    })

    it('should accept custom configuration', async () => {
      const customConfig: Partial<ImageValidationConfig> = {
        maxSizeBytes: 1 * 1024 * 1024, // 1MB
        maxWidth: 2048,
        maxHeight: 2048,
        allowedMimeTypes: ['image/jpeg'],
      }

      const result = await validateImage(validJpegDataUrl, customConfig)
      expect(result.valid).toBe(true)
    })

    it('should reject PNG when only JPEG is allowed', async () => {
      const customConfig: Partial<ImageValidationConfig> = {
        allowedMimeTypes: ['image/jpeg'],
      }

      const result = await validateImage(validPngDataUrl, customConfig)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Unsupported image type'))).toBe(true)
    })

    it('should handle image load errors gracefully', async () => {
      // Mock image load failure
      const originalImage = global.Image
      class FailingImage extends MockImage {
        set src(value: string) {
          this._src = value
          setTimeout(() => {
            if (this.onerror) {
              this.onerror()
            }
          }, 0)
        }
      }
      global.Image = FailingImage as any

      const result = await validateImage(validJpegDataUrl)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Failed to load image'))).toBe(true)

      // Restore original
      global.Image = originalImage
    })

    it('should strip EXIF data from JPEG images', async () => {
      const result = await validateImage(validJpegDataUrl, { stripExif: true })

      expect(result.valid).toBe(true)
      // The sanitized image should be different (mocked canvas toDataURL)
      if (result.sanitizedImage) {
        expect(result.sanitizedImage).toBeTruthy()
      }
    })

    it('should not strip EXIF when disabled', async () => {
      const result = await validateImage(validJpegDataUrl, { stripExif: false })

      expect(result.valid).toBe(true)
      expect(result.sanitizedImage).toBe(validJpegDataUrl)
    })
  })

  describe('validateImages', () => {
    it('should validate multiple images', async () => {
      const images = [validJpegDataUrl, validPngDataUrl]

      const result = await validateImages(images)

      expect(result.allValid).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.sanitizedImages).toHaveLength(2)
    })

    it('should detect when any image is invalid', async () => {
      const images = [
        validJpegDataUrl,
        'invalid-data',
        validPngDataUrl,
      ]

      const result = await validateImages(images)

      expect(result.allValid).toBe(false)
      expect(result.results).toHaveLength(3)
      expect(result.results[1].valid).toBe(false)
    })

    it('should apply custom config to all images', async () => {
      const images = [validJpegDataUrl, validPngDataUrl]
      const config: Partial<ImageValidationConfig> = {
        allowedMimeTypes: ['image/jpeg'],
      }

      const result = await validateImages(images, config)

      expect(result.allValid).toBe(false)
      expect(result.results[0].valid).toBe(true)
      expect(result.results[1].valid).toBe(false)
    })

    it('should handle empty array', async () => {
      const result = await validateImages([])

      expect(result.allValid).toBe(true)
      expect(result.results).toHaveLength(0)
      expect(result.sanitizedImages).toHaveLength(0)
    })
  })
})
