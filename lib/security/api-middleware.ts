/**
 * API Security Middleware
 *
 * Comprehensive security checks for API endpoints:
 * - Rate limiting
 * - Input validation
 * - Content moderation
 * - Image validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS, getClientIp } from './rate-limiter';
import { validateImage, validateImages } from './image-validator';
import { moderateImage, moderateImages } from './content-moderator';

export interface SecurityCheckConfig {
  enableRateLimit?: boolean;
  enableImageValidation?: boolean;
  enableContentModeration?: boolean;
  rateLimitConfig?: typeof RATE_LIMITS[keyof typeof RATE_LIMITS];
}

export interface SecurityCheckResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  response?: NextResponse;
}

/**
 * Comprehensive security check for face swap API
 */
export async function securityCheckFaceSwap(
  request: NextRequest,
  body: {
    sourceImage?: string;
    targetImage?: string;
    isGroupSwap?: boolean;
    userImages?: string[];
  },
  userId?: string,
  config: SecurityCheckConfig = {}
): Promise<SecurityCheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const {
    enableRateLimit = true,
    enableImageValidation = true,
    enableContentModeration = true,
    rateLimitConfig = RATE_LIMITS.FACE_SWAP
  } = config;

  try {
    // 1. RATE LIMITING
    if (enableRateLimit) {
      const { allowed, result } = await withRateLimit(request, rateLimitConfig, userId);

      if (!allowed) {
        return {
          passed: false,
          errors: ['Rate limit exceeded. Please try again later.'],
          warnings,
          response: NextResponse.json(
            {
              success: false,
              error: 'Too many requests',
              retryAfter: result.retryAfter
            },
            {
              status: 429,
              headers: {
                'Retry-After': String(result.retryAfter || 60),
                'X-RateLimit-Limit': String(rateLimitConfig.maxRequests),
                'X-RateLimit-Remaining': String(result.remaining),
                'X-RateLimit-Reset': String(result.resetTime)
              }
            }
          )
        };
      }

      console.log(`✅ Rate limit check passed: ${result.remaining}/${rateLimitConfig.maxRequests} remaining`);
    }

    // 2. IMAGE VALIDATION
    if (enableImageValidation) {
      const imagesToValidate: string[] = [];

      if (body.isGroupSwap && body.userImages) {
        imagesToValidate.push(...body.userImages);
      } else if (body.sourceImage) {
        imagesToValidate.push(body.sourceImage);
      }

      if (body.targetImage) {
        imagesToValidate.push(body.targetImage);
      }

      if (imagesToValidate.length > 0) {
        const { allValid, results } = await validateImages(imagesToValidate);

        if (!allValid) {
          results.forEach((r, i) => {
            if (!r.valid) {
              errors.push(`Image ${i + 1}: ${r.errors.join(', ')}`);
            }
            warnings.push(...r.warnings);
          });

          return {
            passed: false,
            errors,
            warnings,
            response: NextResponse.json(
              {
                success: false,
                error: 'Image validation failed',
                details: errors
              },
              { status: 400 }
            )
          };
        }

        console.log(`✅ Image validation passed for ${imagesToValidate.length} images`);
      }
    }

    // 3. CONTENT MODERATION
    if (enableContentModeration) {
      const imagesToModerate: string[] = [];

      if (body.isGroupSwap && body.userImages) {
        imagesToModerate.push(...body.userImages);
      } else if (body.sourceImage) {
        imagesToModerate.push(body.sourceImage);
      }

      if (imagesToModerate.length > 0) {
        const { allSafe, results, flaggedIndices } = await moderateImages(imagesToModerate);

        if (!allSafe) {
          const flaggedReasons = flaggedIndices.map(i =>
            `Image ${i + 1}: ${results[i].reason}`
          );

          errors.push(...flaggedReasons);

          return {
            passed: false,
            errors,
            warnings,
            response: NextResponse.json(
              {
                success: false,
                error: 'Content moderation failed',
                details: 'One or more images contain inappropriate content',
                flaggedImages: flaggedIndices
              },
              { status: 400 }
            )
          };
        }

        console.log(`✅ Content moderation passed for ${imagesToModerate.length} images`);
      }
    }

    // All checks passed
    return {
      passed: true,
      errors,
      warnings
    };

  } catch (error: any) {
    console.error('❌ Security check error:', error);
    errors.push(`Security check failed: ${error.message}`);

    return {
      passed: false,
      errors,
      warnings,
      response: NextResponse.json(
        {
          success: false,
          error: 'Security check failed',
          details: error.message
        },
        { status: 500 }
      )
    };
  }
}

/**
 * Security check for guest trial
 */
export async function securityCheckGuestTrial(
  request: NextRequest
): Promise<SecurityCheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check rate limit for guest trial (1 per IP)
    const { allowed, result } = await withRateLimit(
      request,
      RATE_LIMITS.GUEST_TRIAL
    );

    if (!allowed) {
      return {
        passed: false,
        errors: ['Guest trial already used from this device'],
        warnings,
        response: NextResponse.json(
          {
            success: false,
            error: 'Guest trial already used',
            code: 'GUEST_TRIAL_USED'
          },
          { status: 403 }
        )
      };
    }

    return {
      passed: true,
      errors,
      warnings
    };

  } catch (error: any) {
    console.error('❌ Guest trial security check error:', error);
    return {
      passed: false,
      errors: [`Security check failed: ${error.message}`],
      warnings,
      response: NextResponse.json(
        { success: false, error: 'Security check failed' },
        { status: 500 }
      )
    };
  }
}

/**
 * Log security event for monitoring
 */
export function logSecurityEvent(
  eventType: 'rate_limit' | 'validation_failed' | 'moderation_failed' | 'suspicious_activity',
  details: {
    ip: string;
    userId?: string;
    endpoint: string;
    reason: string;
  }
): void {
  console.warn(`🚨 SECURITY EVENT [${eventType}]:`, {
    timestamp: new Date().toISOString(),
    ...details
  });

  // TODO: In production, send to monitoring service (Sentry, DataDog, etc.)
  // Example: Sentry.captureMessage(`Security Event: ${eventType}`, { level: 'warning', extra: details });
}
