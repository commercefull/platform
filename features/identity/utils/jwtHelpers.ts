import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';

/**
 * Time unit multipliers for converting human-readable durations to milliseconds
 */
const TIME_MULTIPLIERS: Record<string, number> = {
  's': 1000,                    // seconds
  'm': 60 * 1000,              // minutes
  'h': 60 * 60 * 1000,         // hours
  'd': 24 * 60 * 60 * 1000,    // days
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
  const expirationTime = Date.now() + (value * millisecondsPerUnit);
  
  return new Date(expirationTime);
}

/**
 * Generates a signed JWT access token
 * @param userId - Unique identifier for the user
 * @param userEmail - User's email address
 * @param userRole - User's role (customer, merchant, admin)
 * @param jwtSecret - Secret key for signing the token
 * @param expiresIn - Token expiration duration (e.g., "7d", "24h")
 * @returns Signed JWT token string
 */
export function generateAccessToken(
  userId: string,
  userEmail: string,
  userRole: 'customer' | 'merchant' | 'admin',
  jwtSecret: string,
  expiresIn: string
): string {
  const payload: JwtPayload = {
    id: userId,
    email: userEmail,
    role: userRole
  };
  
  return jwt.sign(payload, jwtSecret, { expiresIn } as SignOptions);
}

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token - JWT token string to verify
 * @param jwtSecret - Secret key used to sign the token
 * @returns Decoded JWT payload if valid, null if invalid or expired
 */
export function verifyAccessToken(token: string, jwtSecret: string): JwtPayload | null {
  try {
    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * Extracts user information from a JWT payload
 * @param payload - Decoded JWT payload
 * @returns User info object or null if payload is invalid
 */
export function extractUserInfoFromToken(payload: JwtPayload | null): {
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
    userRole: payload.role
  };
}
