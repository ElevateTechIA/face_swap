/**
 * Rate Limiter
 *
 * Prevents abuse by limiting requests per IP/user:
 * - Guest trial abuse prevention
 * - API endpoint protection
 * - Brute force attack mitigation
 */

interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  keyPrefix: string;       // Redis/storage key prefix
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Face swap processing - 10 per hour per IP
  FACE_SWAP: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyPrefix: 'rl:faceswap'
  },

  // Guest trial - 1 per IP ever
  GUEST_TRIAL: {
    windowMs: 365 * 24 * 60 * 60 * 1000, // 1 year (essentially permanent)
    maxRequests: 1,
    keyPrefix: 'rl:guest'
  },

  // Image upload - 20 per 10 minutes
  IMAGE_UPLOAD: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 20,
    keyPrefix: 'rl:upload'
  },

  // API general - 100 per minute
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyPrefix: 'rl:api'
  },

  // Login attempts - 5 per 15 minutes
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'rl:login'
  }
} as const;

/**
 * Check if request is within rate limit
 */
export async function checkRateLimit(
  identifier: string, // IP address or user ID
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();

  // Get current rate limit data
  let limitData = rateLimitStore.get(key);

  // Reset if window expired
  if (!limitData || now > limitData.resetTime) {
    limitData = {
      count: 0,
      resetTime: now + config.windowMs
    };
  }

  // Increment counter
  limitData.count++;
  rateLimitStore.set(key, limitData);

  // Check if limit exceeded
  const allowed = limitData.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - limitData.count);
  const retryAfter = allowed ? undefined : Math.ceil((limitData.resetTime - now) / 1000);

  return {
    allowed,
    remaining,
    resetTime: limitData.resetTime,
    retryAfter
  };
}

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
  // Check various headers for IP (behind proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Middleware helper for Next.js API routes
 */
export async function withRateLimit(
  request: Request,
  config: RateLimitConfig,
  userId?: string
): Promise<{ allowed: boolean; result: RateLimitResult }> {
  // Use user ID if authenticated, otherwise use IP
  const identifier = userId || getClientIp(request);

  const result = await checkRateLimit(identifier, config);

  return {
    allowed: result.allowed,
    result
  };
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto cleanup every 10 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(cleanupExpiredEntries, 10 * 60 * 1000);
}
