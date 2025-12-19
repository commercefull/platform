/**
 * Rate Limiting Service
 * Provides API rate limiting and throttling
 * for the CommerceFull platform - Phase 8
 */

import { Request, Response, NextFunction } from 'express';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  handler?: (req: Request, res: Response, next: NextFunction) => void;
  skip?: (req: Request) => boolean;
  message?: string;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// ============================================================================
// In-Memory Store (for single instance)
// In production, use Redis for distributed rate limiting
// ============================================================================

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

// ============================================================================
// Rate Limit Middleware Factory
// ============================================================================

export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    handler = defaultHandler,
    skip,
    message = 'Too many requests, please try again later.'
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if request should be skipped
    if (skip && skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + windowMs
      };
      rateLimitStore.set(key, entry);
    }

    // Increment counter
    entry.count++;

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = new Date(entry.resetAt);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return handler(req, res, next);
    }

    // Handle skip options for response tracking
    if (skipFailedRequests || skipSuccessfulRequests) {
      const originalEnd = res.end.bind(res);
      (res as any).end = function(chunk?: any, encoding?: BufferEncoding | undefined, cb?: () => void) {
        const statusCode = res.statusCode;
        const isSuccess = statusCode >= 200 && statusCode < 400;

        if ((skipFailedRequests && !isSuccess) || (skipSuccessfulRequests && isSuccess)) {
          entry!.count--;
        }

        if (encoding) {
          return originalEnd(chunk, encoding, cb);
        }
        return originalEnd(chunk, cb as any);
      };
    }

    next();
  };
}

// ============================================================================
// Default Functions
// ============================================================================

function defaultKeyGenerator(req: Request): string {
  // Use IP address as default key
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ratelimit:${ip}`;
}

function defaultHandler(req: Request, res: Response, next: NextFunction): void {
  res.status(429).json({
    success: false,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: res.getHeader('Retry-After')
  });
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

// Standard API rate limiter
export const standardApiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Too many API requests, please try again after a minute.'
});

// Strict rate limiter for sensitive endpoints
export const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many requests to this endpoint, please try again after a minute.'
});

// Auth rate limiter (login, register, password reset)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again after 15 minutes.'
});

// Webhook rate limiter
export const webhookLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000,
  keyGenerator: (req) => {
    const webhookId = req.headers['x-webhook-id'] || 'unknown';
    return `ratelimit:webhook:${webhookId}`;
  }
});

// Search rate limiter
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  message: 'Too many search requests, please try again after a minute.'
});

// Export rate limiter
export const exportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Too many export requests, please try again after an hour.'
});

// ============================================================================
// Rate Limit by User/Merchant
// ============================================================================

export function createUserRateLimiter(config: Omit<RateLimitConfig, 'keyGenerator'>) {
  return createRateLimiter({
    ...config,
    keyGenerator: (req) => {
      const userId = (req as any).user?.id || 'anonymous';
      return `ratelimit:user:${userId}`;
    }
  });
}

export function createMerchantRateLimiter(config: Omit<RateLimitConfig, 'keyGenerator'>) {
  return createRateLimiter({
    ...config,
    keyGenerator: (req) => {
      const merchantId = (req as any).merchant?.id || req.headers['x-merchant-id'] || 'default';
      return `ratelimit:merchant:${merchantId}`;
    }
  });
}

export function createApiKeyRateLimiter(config: Omit<RateLimitConfig, 'keyGenerator'>) {
  return createRateLimiter({
    ...config,
    keyGenerator: (req) => {
      const apiKey = req.headers['x-api-key'] || 'unknown';
      return `ratelimit:apikey:${apiKey}`;
    }
  });
}

// ============================================================================
// Rate Limit Info Retrieval
// ============================================================================

export function getRateLimitInfo(key: string): RateLimitInfo | null {
  const entry = rateLimitStore.get(key);

  if (!entry) return null;

  const now = Date.now();
  if (entry.resetAt < now) {
    rateLimitStore.delete(key);
    return null;
  }

  return {
    limit: 0, // Would need to store this with the entry
    current: entry.count,
    remaining: 0, // Would need limit to calculate
    resetTime: new Date(entry.resetAt)
  };
}

export function resetRateLimit(key: string): boolean {
  return rateLimitStore.delete(key);
}

export function getRateLimitStats(): {
  totalKeys: number;
  activeKeys: number;
  memoryUsage: number;
} {
  const now = Date.now();
  let activeKeys = 0;

  for (const entry of rateLimitStore.values()) {
    if (entry.resetAt >= now) {
      activeKeys++;
    }
  }

  return {
    totalKeys: rateLimitStore.size,
    activeKeys,
    memoryUsage: process.memoryUsage().heapUsed
  };
}

// ============================================================================
// Sliding Window Rate Limiter (More Accurate)
// ============================================================================

interface SlidingWindowEntry {
  timestamps: number[];
}

const slidingWindowStore = new Map<string, SlidingWindowEntry>();

export function createSlidingWindowLimiter(config: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create entry
    let entry = slidingWindowStore.get(key);

    if (!entry) {
      entry = { timestamps: [] };
      slidingWindowStore.set(key, entry);
    }

    // Remove expired timestamps
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    if (entry.timestamps.length >= maxRequests) {
      const oldestTimestamp = entry.timestamps[0];
      const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('Retry-After', retryAfter);

      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter
      });
    }

    // Add current timestamp
    entry.timestamps.push(now);

    // Set headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - entry.timestamps.length);

    next();
  };
}

// ============================================================================
// Token Bucket Rate Limiter
// ============================================================================

interface TokenBucketEntry {
  tokens: number;
  lastRefill: number;
}

const tokenBucketStore = new Map<string, TokenBucketEntry>();

export function createTokenBucketLimiter(config: {
  bucketSize: number;       // Max tokens in bucket
  refillRate: number;       // Tokens added per second
  tokensPerRequest?: number; // Tokens consumed per request
  keyGenerator?: (req: Request) => string;
}) {
  const {
    bucketSize,
    refillRate,
    tokensPerRequest = 1,
    keyGenerator = defaultKeyGenerator
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Get or create bucket
    let bucket = tokenBucketStore.get(key);

    if (!bucket) {
      bucket = {
        tokens: bucketSize,
        lastRefill: now
      };
      tokenBucketStore.set(key, bucket);
    }

    // Refill tokens based on time elapsed
    const elapsed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = elapsed * refillRate;
    bucket.tokens = Math.min(bucketSize, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if enough tokens
    if (bucket.tokens < tokensPerRequest) {
      const waitTime = (tokensPerRequest - bucket.tokens) / refillRate;

      res.setHeader('X-RateLimit-Limit', bucketSize);
      res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));
      res.setHeader('Retry-After', Math.ceil(waitTime));

      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(waitTime)
      });
    }

    // Consume tokens
    bucket.tokens -= tokensPerRequest;

    // Set headers
    res.setHeader('X-RateLimit-Limit', bucketSize);
    res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));

    next();
  };
}
