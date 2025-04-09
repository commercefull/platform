import { queryOne } from '../../../libs/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

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
      `INSERT INTO "public"."${tableName}" ("userId", "token", "expiresAt", "isUsed", "createdAt") 
       VALUES ($1, $2, $3, $4, $5) RETURNING "id"`,
      [userId, hashedToken, expiresAt, false, new Date()]
    );
    
    return token;
  }
  
  // Verify password reset token
  async verifyPasswordResetToken(token: string, userType: 'customer' | 'merchant' | 'admin'): Promise<string | null> {
    const tableName = `${userType}_password_reset`;
    
    const resetToken = await queryOne<PasswordResetToken>(
      `SELECT * FROM "public"."${tableName}" WHERE "isUsed" = false AND "expiresAt" > $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [new Date()]
    );
    
    if (!resetToken) {
      return null;
    }
    
    const isTokenValid = await bcrypt.compare(token, resetToken.token);
    
    if (!isTokenValid) {
      return null;
    }
    
    // Mark token as used
    await queryOne(
      `UPDATE "public"."${tableName}" SET "isUsed" = true WHERE "id" = $1`,
      [resetToken.id]
    );
    
    return resetToken.userId;
  }
  
  // Change password
  async changePassword(userId: string, newPassword: string, userType: 'customer' | 'merchant' | 'admin'): Promise<boolean> {
    const tableName = userType === 'admin' ? 'admin' : userType;
    const hashedPassword = await this.hashPassword(newPassword);
    
    const result = await queryOne(
      `UPDATE "public"."${tableName}" SET "password" = $1, "updatedAt" = $2 WHERE "id" = $3 RETURNING "id"`,
      [hashedPassword, new Date(), userId]
    );
    
    return !!result;
  }
}
