/**
 * Secret validation utility — fail fast in production if required secrets
 * are missing or insecure. In non-production, generate ephemeral dev secrets
 * with a visible warning.
 */

import { logger } from './logger';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Known insecure placeholder values that should never be accepted.
 */
const INSECURE_PLACEHOLDERS = new Set([
  'your-secret-key-should-be-in-env',
  'customer-secret-key-should-be-in-env',
  'merchant-secret-key-should-be-in-env',
  'organization-secret-key-should-be-in-env',
  'admin-secret-key-should-be-in-env',
  'b2b-secret-key-should-be-in-env',
  'change-me',
  'secret',
  'test-secret-key',
]);

/**
 * Minimum secret length for JWT signing keys.
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Required secrets for production.
 */
const REQUIRED_SECRETS = [
  'CUSTOMER_JWT_SECRET',
  'ORGANIZATION_JWT_SECRET',
  'ADMIN_JWT_SECRET',
  'B2B_JWT_SECRET',
  'SESSION_SECRET',
] as const;

/**
 * Validate a single secret value.
 * Returns true if valid, throws in production if invalid.
 */
export function validateSecret(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    if (isProduction()) {
      throw new Error(`Missing required secret: ${name}. Set it in your environment or .env file.`);
    }
    // Generate ephemeral dev secret
    const devSecret = `dev-${name.toLowerCase()}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    logger.warning(`Using ephemeral dev secret for ${name} — NOT SECURE, do not use in production`);
    return devSecret;
  }

  if (INSECURE_PLACEHOLDERS.has(value)) {
    if (isProduction()) {
      throw new Error(`Insecure placeholder value for secret: ${name}. Set a real secret in production.`);
    }
    logger.warning(`Insecure placeholder value for secret: ${name} — replace before deploying to production`);
  }

  if (value.length < MIN_SECRET_LENGTH) {
    if (isProduction()) {
      throw new Error(`Secret ${name} must be at least ${MIN_SECRET_LENGTH} characters long (got ${value.length}).`);
    }
    logger.warning(`Secret ${name} is shorter than ${MIN_SECRET_LENGTH} characters — insecure for production`);
  }

  return value;
}

/**
 * Validate all required secrets at boot.
 * Throws in production if any are missing or insecure.
 * In dev/test, logs warnings and generates ephemeral fallbacks.
 */
export function validateAllSecrets(): Record<string, string> {
  const secrets: Record<string, string> = {};

  for (const name of REQUIRED_SECRETS) {
    secrets[name] = validateSecret(name, process.env[name]);
  }

  if (isProduction()) {
    logger.info('All required secrets validated successfully');
  }

  return secrets;
}

/**
 * Get a validated secret by name.
 * Use this instead of `process.env.SECRET || 'fallback'`.
 */
export function getSecret(name: string): string {
  return validateSecret(name, process.env[name]);
}

/**
 * Validate CORS origins in production.
 * Throws if ALLOWED_ORIGINS is not set in production.
 */
export function validateCorsOrigins(): string[] {
  if (!isProduction()) {
    return ['http://localhost:3000', 'http://localhost:10000', 'http://127.0.0.1:3000'];
  }

  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || raw.trim() === '') {
    throw new Error('ALLOWED_ORIGINS must be set in production. Example: https://yourdomain.com,https://admin.yourdomain.com');
  }

  const origins = raw.split(',').map(o => o.trim()).filter(Boolean);
  if (origins.length === 0) {
    throw new Error('ALLOWED_ORIGINS must contain at least one valid origin in production');
  }

  // Reject placeholder values
  for (const origin of origins) {
    if (origin.includes('yourdomain.com') || origin.includes('example.com')) {
      throw new Error(`ALLOWED_ORIGINS contains placeholder origin: ${origin}. Set real origins in production.`);
    }
  }

  return origins;
}
