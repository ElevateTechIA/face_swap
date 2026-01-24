import {
  checkRateLimit,
  getClientIp,
  withRateLimit,
  cleanupExpiredEntries,
  RATE_LIMITS,
} from '../rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear the in-memory store before each test
    // Access the store through the module for testing
    jest.clearAllMocks()
  })

  describe('checkRateLimit', () => {
    it('should allow requests within the limit', async () => {
      const config = {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      }

      const result = await checkRateLimit('test-user', config)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.retryAfter).toBeUndefined()
    })

    it('should block requests exceeding the limit', async () => {
      const config = {
        windowMs: 60000,
        maxRequests: 2,
        keyPrefix: 'test',
      }

      // First two requests should be allowed
      const result1 = await checkRateLimit('test-user-2', config)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(1)

      const result2 = await checkRateLimit('test-user-2', config)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(0)

      // Third request should be blocked
      const result3 = await checkRateLimit('test-user-2', config)
      expect(result3.allowed).toBe(false)
      expect(result3.remaining).toBe(0)
      expect(result3.retryAfter).toBeGreaterThan(0)
    })

    it('should reset after window expires', async () => {
      const config = {
        windowMs: 100, // 100ms window
        maxRequests: 1,
        keyPrefix: 'test',
      }

      // First request
      const result1 = await checkRateLimit('test-user-3', config)
      expect(result1.allowed).toBe(true)

      // Second request should be blocked
      const result2 = await checkRateLimit('test-user-3', config)
      expect(result2.allowed).toBe(false)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should be allowed again
      const result3 = await checkRateLimit('test-user-3', config)
      expect(result3.allowed).toBe(true)
    })

    it('should handle different users independently', async () => {
      const config = {
        windowMs: 60000,
        maxRequests: 1,
        keyPrefix: 'test',
      }

      const result1 = await checkRateLimit('user-a', config)
      expect(result1.allowed).toBe(true)

      const result2 = await checkRateLimit('user-b', config)
      expect(result2.allowed).toBe(true)

      // Both should be blocked on second attempt
      const result3 = await checkRateLimit('user-a', config)
      expect(result3.allowed).toBe(false)

      const result4 = await checkRateLimit('user-b', config)
      expect(result4.allowed).toBe(false)
    })
  })

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      })

      expect(getClientIp(request)).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      })

      expect(getClientIp(request)).toBe('192.168.1.2')
    })

    it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
      const request = new Request('http://localhost', {
        headers: {
          'cf-connecting-ip': '192.168.1.3',
        },
      })

      expect(getClientIp(request)).toBe('192.168.1.3')
    })

    it('should prioritize x-forwarded-for over other headers', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
          'cf-connecting-ip': '192.168.1.3',
        },
      })

      expect(getClientIp(request)).toBe('192.168.1.1')
    })

    it('should return "unknown" when no IP headers present', () => {
      const request = new Request('http://localhost')
      expect(getClientIp(request)).toBe('unknown')
    })
  })

  describe('withRateLimit', () => {
    it('should use user ID when provided', async () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      })
      const config = {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      }

      const result = await withRateLimit(request, config, 'user-123')

      expect(result.allowed).toBe(true)
      expect(result.result.remaining).toBe(4)
    })

    it('should fallback to IP when user ID not provided', async () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      })
      const config = {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      }

      const result = await withRateLimit(request, config)

      expect(result.allowed).toBe(true)
    })
  })

  describe('RATE_LIMITS constants', () => {
    it('should have correct configuration for FACE_SWAP', () => {
      expect(RATE_LIMITS.FACE_SWAP.maxRequests).toBe(10)
      expect(RATE_LIMITS.FACE_SWAP.windowMs).toBe(60 * 60 * 1000)
      expect(RATE_LIMITS.FACE_SWAP.keyPrefix).toBe('rl:faceswap')
    })

    it('should have correct configuration for GUEST_TRIAL', () => {
      expect(RATE_LIMITS.GUEST_TRIAL.maxRequests).toBe(1)
      expect(RATE_LIMITS.GUEST_TRIAL.keyPrefix).toBe('rl:guest')
    })

    it('should have correct configuration for LOGIN', () => {
      expect(RATE_LIMITS.LOGIN.maxRequests).toBe(5)
      expect(RATE_LIMITS.LOGIN.windowMs).toBe(15 * 60 * 1000)
      expect(RATE_LIMITS.LOGIN.keyPrefix).toBe('rl:login')
    })
  })

  describe('cleanupExpiredEntries', () => {
    it('should not throw when called', () => {
      expect(() => cleanupExpiredEntries()).not.toThrow()
    })
  })
})
