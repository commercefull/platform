/* eslint-disable @typescript-eslint/no-unused-vars */
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

type JwtTokenUse = 'access' | 'refresh';

const JWT_ALGORITHM = 'HS256';

/**
 * Time unit multipliers for converting human-readable durations to milliseconds
 */
const TIME_MULTIPLIERS: Record<string, number> = {
  s: 1000, // seconds
  m: 60 * 1000, // minutes
  h: 60 * 60 * 1000, // hours
  d: 24 * 60 * 60 * 1000, // days
};

/**
 * Converts a human-readable duration string (e.g., "7d", "24h") to a Date object
 * @param durationString - Duration in format: number + unit (s|m|h|d), e.g., "7d", "24h"
 * @returns Date object representing the expiry time
 * @example
 * parseExpirationDate("7d")  // Returns date 7 days from now
 * parseExpirationDate("24h") // Returns date 24 hours from now
 */
export function parseExpirationDate(durationString: string): Date {
  const unit = durationString.slice(-1);
  const value = parseInt(durationString.slice(0, -1), 10);

  const millisecondsPerUnit = TIME_MULTIPLIERS[unit] || TIME_MULTIPLIERS['d']; // Default to days
  const expirationTime = Date.now() + value * millisecondsPerUnit;

  return new Date(expirationTime);
}

export interface AccessTokenOptions {
  /** Unique identifier for the user */
  userId: string;
  /** User's email address */
  userEmail: string;
  /** User's role (customer, merchant, admin) */
  userRole: 'customer' | 'organization' | 'admin';
  /** Secret key for signing the token */
  jwtSecret: string;
  /** Token expiration duration (e.g., "7d", "24h") */
  expiresIn: string;
  /** 'access' (default) or 'refresh'; refresh tokens are rejected by API auth middleware */
  tokenUse?: JwtTokenUse;
}

/**
 * Generates a signed JWT access token
 * @param options - Token claims and signing options (see {@link AccessTokenOptions})
 * @returns Signed JWT token string
 */
export function generateAccessToken(options: AccessTokenOptions): string {
  const payload: JwtPayload = {
    id: options.userId,
    email: options.userEmail,
    role: options.userRole,
    tokenUse: options.tokenUse ?? 'access',
    jti: randomUUID(),
  };

  return jwt.sign(payload, options.jwtSecret, { expiresIn: options.expiresIn, algorithm: JWT_ALGORITHM } as SignOptions);
}

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token - JWT token string to verify
 * @param jwtSecret - Secret key used to sign the token
 * @returns Decoded JWT payload if valid, null if invalid or expired
 */
export function verifyAccessToken(token: string, jwtSecret: string): JwtPayload | null {
  try {
    return jwt.verify(token, jwtSecret, { algorithms: [JWT_ALGORITHM] }) as JwtPayload;
  } catch {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * Extracts user information from a JWT payload
 * @param payload - Decoded JWT payload
 * @returns User info object or null if payload is invalid
 */
function extractUserInfoFromToken(payload: JwtPayload | null): {
  userId: string;
  userEmail: string;
  userRole: string;
} | null {
  if (!payload || !payload.id || !payload.email || !payload.role) {
    return null;
  }

  return {
    userId: payload.id,
    userEmail: payload.email,
    userRole: payload.role,
  };
}
