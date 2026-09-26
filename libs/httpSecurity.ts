import { timingSafeEqual } from 'crypto';
import { rateLimit } from 'express-rate-limit';
import type { HttpNext, HttpRequest, HttpResponse } from './http';
import { logger } from './logger';

/**
 * Constant-time string comparison (avoids timing side channels on secrets).
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Resolve the Express `trust proxy` setting.
 *
 * TRUST_PROXY must be the number of reverse-proxy hops in front of the app
 * (e.g. 1 = nginx, 2 = CloudFront → ALB). Never `true` — that lets any client
 * spoof its IP through X-Forwarded-For and defeats IP-based rate limiting.
 */
export function resolveTrustProxy(raw: string | undefined, isProduction: boolean): number | false {
  if (raw === undefined || raw.trim() === '') {
    return isProduction ? 1 : false;
  }
  const hops = Number(raw);
  if (!Number.isInteger(hops) || hops < 0 || hops > 10) {
    throw new Error(`TRUST_PROXY must be an integer hop count between 0 and 10 (got "${raw}")`);
  }
  return hops === 0 ? false : hops;
}

const ORIGIN_VERIFY_EXEMPT_PATHS = new Set(['/health']);

/**
 * Reject requests that did not traverse the CDN/WAF.
 *
 * When ORIGIN_VERIFY_SECRET is set, the edge (CloudFront / Front Door / nginx)
 * must inject the secret in ORIGIN_VERIFY_HEADER (default `x-origin-verify`).
 * Requests hitting the origin directly (API Gateway URL, ALB DNS, Container App
 * FQDN, Cloud Run URL) are rejected, so WAF and rate limits cannot be bypassed.
 */
export function createOriginVerifyMiddleware(
  secret: string | undefined = process.env.ORIGIN_VERIFY_SECRET,
  headerName: string = (process.env.ORIGIN_VERIFY_HEADER || 'x-origin-verify').toLowerCase(),
) {
  return (req: HttpRequest, res: HttpResponse, next: HttpNext): void => {
    if (!secret || ORIGIN_VERIFY_EXEMPT_PATHS.has(req.path)) {
      return next();
    }
    const provided = req.headers[headerName];
    if (typeof provided === 'string' && safeEqual(provided, secret)) {
      return next();
    }
    logger.warn('Rejected request that bypassed the edge proxy', { path: req.path, ip: req.ip });
    res.status(403).json({ success: false, message: 'Forbidden' });
  };
}

/**
 * Credential / token endpoints that must be protected against brute force
 * and credential stuffing.
 */
export const AUTH_RATE_LIMITED_PATHS = [
  '/signin',
  '/signup',
  '/profile/change-password',
  '/admin/login',
  '/customer/identity/login',
  '/customer/identity/register',
  '/customer/identity/token',
  '/customer/identity/refresh',
  '/customer/identity/forgot-password',
  '/customer/identity/reset-password',
  '/business/auth/login',
  '/business/auth/register',
  '/business/auth/token',
  '/business/auth/refresh',
  '/business/auth/validate',
  '/business/auth/forgot-password',
  '/business/auth/reset-password',
];

type RateLimitedRequest = { path: string; method: string; ip?: string };

const envInt = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

/**
 * Rate limiting is on everywhere except local development / test runs (the
 * integration suite logs in far more often than a real client), unless
 * explicitly forced with RATE_LIMIT_ENABLED=1.
 */
export function isRateLimitEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.RATE_LIMIT_ENABLED === '1') return true;
  if (env.RATE_LIMIT_DISABLED === '1') return false;
  return env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test';
}

/**
 * IP-based rate limiters. The default store is in-memory (per process); for
 * multi-instance deployments the edge (WAF / nginx limit_req) is the primary
 * control and these act as defence in depth.
 */
export function createRateLimiters() {
  const enabled = isRateLimitEnabled();
  // Structural types: express-rate-limit is typed against raw Express, not libs/http
  const skip = (req: RateLimitedRequest) => !enabled || req.path === '/health';
  const handler = (req: RateLimitedRequest, res: { status(code: number): { json(body: unknown): unknown } }) => {
    logger.warn('Rate limit exceeded', { path: req.path, ip: req.ip });
    res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
  };

  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: envInt('RATE_LIMIT_GLOBAL_PER_MINUTE', 600),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip,
    handler,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: envInt('RATE_LIMIT_AUTH_PER_15_MINUTES', 20),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: req => req.method !== 'POST' || skip(req),
    handler,
  });

  return { globalLimiter, authLimiter };
}
