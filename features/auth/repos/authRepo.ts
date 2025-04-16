import { queryOne } from '../../../libs/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Database transformation utilities
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}

function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  if (!dbRecords) return [];
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap));
}

// Field mapping dictionaries
const passwordResetFields: Record<string, string> = {
  id: 'id',
  userId: 'user_id',
  token: 'token',
  expiresAt: 'expires_at',
  isUsed: 'is_used',
  createdAt: 'created_at'
};

const tokenBlacklistFields: Record<string, string> = {
  id: 'id',
  token: 'token',
  userType: 'user_type',
  userId: 'user_id',
  expiresAt: 'expires_at',
  invalidatedAt: 'invalidated_at',
  reason: 'reason'
};

const refreshTokenFields: Record<string, string> = {
  id: 'id',
  token: 'token',
  userType: 'user_type',
  userId: 'user_id',
  isRevoked: 'is_revoked',
  expiresAt: 'expires_at',
  createdAt: 'created_at',
  lastUsedAt: 'last_used_at',
  userAgent: 'user_agent',
  ipAddress: 'ip_address'
};

const emailVerificationFields: Record<string, string> = {
  id: 'id',
  userId: 'user_id',
  token: 'token',
  expiresAt: 'expires_at',
  isUsed: 'is_used',
  createdAt: 'created_at'
};

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthTokenData {
  id: string;
  email: string;
  role: 'customer' | 'merchant' | 'admin';
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export interface TokenBlacklist {
  id: string;
  token: string;
  userType: string;
  userId: string;
  expiresAt: Date;
  invalidatedAt: Date;
  reason?: string;
}

export interface RefreshToken {
  id: string;
  token: string;
  userType: string;
  userId: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface EmailVerification {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

// Database query result interface
interface QueryResult {
  rowCount: number;
  rows?: any[];
  affectedRows?: number;
  insertId?: string | number;
  changedRows?: number;
}

export class AuthRepo {
  // Customer authentication
  async authenticateCustomer(credentials: AuthCredentials): Promise<{ id: string; email: string } | null> {
    const { email, password } = credentials;
    
    const customer = await queryOne<{ id: string; email: string; password: string }>(
      'SELECT "id", "email", "password" FROM "public"."customer" WHERE "email" = $1',
      [email]
    );
    
    if (!customer) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return {
      id: customer.id,
      email: customer.email
    };
  }
  
  // Merchant authentication
  async authenticateMerchant(credentials: AuthCredentials): Promise<{ id: string; email: string } | null> {
    const { email, password } = credentials;
    
    const merchant = await queryOne<{ id: string; email: string; password: string }>(
      'SELECT "id", "email", "password" FROM "public"."merchant" WHERE "email" = $1',
      [email]
    );
    
    if (!merchant) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, merchant.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return {
      id: merchant.id,
      email: merchant.email
    };
  }
  
  // Admin authentication
  async authenticateAdmin(credentials: AuthCredentials): Promise<{ id: string; email: string } | null> {
    const { email, password } = credentials;
    
    const admin = await queryOne<{ id: string; email: string; password: string }>(
      'SELECT "id", "email", "password" FROM "public"."admin" WHERE "email" = $1',
      [email]
    );
    
    if (!admin) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return {
      id: admin.id,
      email: admin.email
    };
  }
  
  // Password hashing
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }
  
  // Generate password reset token
  async createPasswordResetToken(userId: string, userType: 'customer' | 'merchant' | 'admin'): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store token in database based on user type
    const tableName = `${userType}_password_reset`;
    
    await queryOne(
      `INSERT INTO "public"."${tableName}" ("user_id", "token", "expires_at", "is_used", "created_at") 
       VALUES ($1, $2, $3, $4, $5) RETURNING "id"`,
      [userId, hashedToken, expiresAt, false, new Date()]
    );
    
    return token;
  }
  
  // Verify password reset token
  async verifyPasswordResetToken(token: string, userType: 'customer' | 'merchant' | 'admin'): Promise<string | null> {
    const tableName = `${userType}_password_reset`;
    
    const resetTokenRecord = await queryOne(
      `SELECT * FROM "public"."${tableName}" 
       WHERE "is_used" = false AND "expires_at" > $1 
       ORDER BY "created_at" DESC LIMIT 1`,
      [new Date()]
    );
    
    if (!resetTokenRecord) {
      return null;
    }
    
    const resetToken = transformDbToTs<PasswordResetToken>(resetTokenRecord, passwordResetFields);
    
    const isValid = await bcrypt.compare(token, resetToken.token);
    
    if (!isValid) {
      return null;
    }
    
    // Mark token as used
    await queryOne(
      `UPDATE "public"."${tableName}" SET "is_used" = true WHERE "id" = $1`,
      [resetToken.id]
    );
    
    return resetToken.userId;
  }
  
  // Add token to blacklist (e.g., on logout)
  async blacklistToken(token: string, userId: string, userType: string, reason?: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 86400000); // 24 hours from now
    
    await queryOne(
      `INSERT INTO "public"."auth_token_blacklist" 
       ("token", "user_type", "user_id", "expires_at", "invalidated_at", "reason") 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [token, userType, userId, expiresAt, new Date(), reason || 'logout']
    );
  }
  
  // Check if token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await queryOne(
      `SELECT * FROM "public"."auth_token_blacklist" 
       WHERE "token" = $1 AND "expires_at" > $2`,
      [token, new Date()]
    );
    
    return !!result;
  }
  
  // Create refresh token
  async createRefreshToken(userId: string, userType: string, userAgent?: string, ipAddress?: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await queryOne(
      `INSERT INTO "public"."auth_refresh_tokens" 
       ("token", "user_type", "user_id", "expires_at", "created_at", "user_agent", "ip_address") 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [token, userType, userId, expiresAt, new Date(), userAgent, ipAddress]
    );
    
    return token;
  }
  
  // Get refresh token
  async getRefreshToken(token: string): Promise<RefreshToken | null> {
    const record = await queryOne(
      `SELECT * FROM "public"."auth_refresh_tokens" 
       WHERE "token" = $1 AND "is_revoked" = false AND "expires_at" > $2`,
      [token, new Date()]
    );
    
    if (!record) {
      return null;
    }
    
    return transformDbToTs<RefreshToken>(record, refreshTokenFields);
  }
  
  // Revoke refresh token
  async revokeRefreshToken(token: string): Promise<boolean> {
    const result = await queryOne(
      `UPDATE "public"."auth_refresh_tokens" 
       SET "is_revoked" = true 
       WHERE "token" = $1 AND "is_revoked" = false`,
      [token]
    ) as QueryResult;
    
    return result.rowCount > 0;
  }
  
  // Revoke all refresh tokens for a user
  async revokeAllUserRefreshTokens(userId: string, userType: string): Promise<number> {
    const result = await queryOne(
      `UPDATE "public"."auth_refresh_tokens" 
       SET "is_revoked" = true 
       WHERE "user_id" = $1 AND "user_type" = $2 AND "is_revoked" = false`,
      [userId, userType]
    ) as QueryResult;
    
    return result.rowCount;
  }
  
  // Create email verification token
  async createEmailVerificationToken(userId: string, userType: 'customer' | 'merchant'): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const tableName = `${userType}_email_verification`;
    const userIdColumn = `${userType}_id`;
    
    await queryOne(
      `INSERT INTO "public"."${tableName}" 
       ("${userIdColumn}", "token", "expires_at", "is_used", "created_at") 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, token, expiresAt, false, new Date()]
    );
    
    return token;
  }
  
  // Verify email
  async verifyEmail(token: string, userType: 'customer' | 'merchant'): Promise<string | null> {
    const tableName = `${userType}_email_verification`;
    const userTable = userType;
    const userIdColumn = `${userType}_id`;
    
    // Get verification record
    const verificationRecord = await queryOne(
      `SELECT * FROM "public"."${tableName}" 
       WHERE "token" = $1 AND "is_used" = false AND "expires_at" > $2`,
      [token, new Date()]
    );
    
    if (!verificationRecord) {
      return null;
    }
    
    const verification = transformDbToTs<EmailVerification>(verificationRecord, emailVerificationFields);
    const userId = verification.userId;
    
    // Mark token as used
    await queryOne(
      `UPDATE "public"."${tableName}" SET "is_used" = true WHERE "id" = $1`,
      [verification.id]
    );
    
    // Update user record
    await queryOne(
      `UPDATE "public"."${userTable}" SET "email_verified" = true WHERE "id" = $1`,
      [userId]
    );
    
    return userId;
  }
  
  // Cleanup expired tokens (can be run by a scheduled task)
  async cleanupExpiredTokens(): Promise<{ passwordReset: number, emailVerification: number, refreshTokens: number }> {
    const now = new Date();
    const userTypes = ['customer', 'merchant', 'admin'];
    
    // Track counts
    let passwordResetCount = 0;
    let emailVerificationCount = 0;
    
    // Cleanup password reset tokens
    for (const userType of userTypes) {
      const tableName = `${userType}_password_reset`;
      const result = await queryOne(
        `DELETE FROM "public"."${tableName}" WHERE "expires_at" < $1 AND "is_used" = false`,
        [now]
      ) as QueryResult;
      
      passwordResetCount += result.rowCount;
    }
    
    // Cleanup email verification tokens (only for customer and merchant)
    for (const userType of ['customer', 'merchant']) {
      const tableName = `${userType}_email_verification`;
      const result = await queryOne(
        `DELETE FROM "public"."${tableName}" WHERE "expires_at" < $1 AND "is_used" = false`,
        [now]
      ) as QueryResult;
      
      emailVerificationCount += result.rowCount;
    }
    
    // Cleanup expired refresh tokens
    const refreshTokensResult = await queryOne(
      `DELETE FROM "public"."auth_refresh_tokens" WHERE "expires_at" < $1`,
      [now]
    ) as QueryResult;
    
    const refreshTokens = refreshTokensResult.rowCount;
    
    return {
      passwordReset: passwordResetCount,
      emailVerification: emailVerificationCount,
      refreshTokens
    };
  }
}
