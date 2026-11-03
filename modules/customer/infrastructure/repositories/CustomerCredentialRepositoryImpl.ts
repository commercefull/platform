import { query, queryOne } from '../../../../libs/db';
import { compareString, hashString } from '../../../../libs/hash';
import crypto from 'crypto';
import type {
  CustomerAuthCredentials,
  CustomerAuthResult,
  CustomerCredentialRepository,
} from '../../domain/repositories/CustomerCredentialRepository';
import type { Customer as DbCustomer, CustomerPasswordReset as DbCustomerPasswordReset } from '../../../../libs/db/types';

class CustomerCredentialRepo implements CustomerCredentialRepository {
  async authenticate(credentials: CustomerAuthCredentials): Promise<CustomerAuthResult | null> {
    const { email, password } = credentials;

    const customer = await queryOne<Pick<DbCustomer, 'customerId' | 'email' | 'password' | 'firstName' | 'lastName'>>(
      'SELECT "customerId", "email", "password", "firstName", "lastName" FROM "customer" WHERE "email" = $1',
      [email],
    );

    if (!customer) {
      return null;
    }

    const isPasswordValid = await compareString(password, customer.password);
    if (!isPasswordValid) {
      return null;
    }

    return {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    };
  }

  async changePassword(customerId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await hashString(newPassword);
    const result = await queryOne<Pick<DbCustomer, 'customerId'>>(
      'UPDATE "customer" SET "password" = $1, "updatedAt" = $2 WHERE "customerId" = $3 RETURNING "customerId"',
      [hashedPassword, new Date(), customerId],
    );
    return !!result;
  }

  async createEmailVerificationToken(customerId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await queryOne('UPDATE customer SET "verificationToken" = $1, "updatedAt" = $2 WHERE "customerId" = $3 RETURNING "customerId"', [
      token,
      new Date(),
      customerId,
    ]);
    return token;
  }

  async verifyEmailVerificationToken(token: string): Promise<string | null> {
    const customer = await queryOne<{ customerId: string }>(
      `UPDATE customer SET "emailVerified" = true, "isVerified" = true, "verificationToken" = NULL, "updatedAt" = $1
       WHERE "verificationToken" = $2 RETURNING "customerId"`,
      [new Date(), token],
    );
    return customer?.customerId || null;
  }

  async createPasswordResetToken(customerId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await hashString(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const now = new Date();

    await queryOne(
      `INSERT INTO "customerPasswordReset" ("userId", "token", "expiresAt", "isUsed", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, false, $4, $4) RETURNING "customerPasswordResetId"`,
      [customerId, hashedToken, expiresAt, now],
    );
    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    const resetRecords = await query<Pick<DbCustomerPasswordReset, 'customerPasswordResetId' | 'userId' | 'token'>[]>(
      `SELECT "customerPasswordResetId", "userId", "token" FROM "customerPasswordReset"
       WHERE "isUsed" = false AND "expiresAt" > $1 ORDER BY "createdAt" DESC`,
      [new Date()],
    );

    if (!resetRecords || resetRecords.length === 0) return null;

    for (const resetRecord of resetRecords) {
      const isValid = await compareString(token, resetRecord.token);
      if (isValid) {
        await queryOne('UPDATE "customerPasswordReset" SET "isUsed" = true, "updatedAt" = $1 WHERE "customerPasswordResetId" = $2', [
          new Date(),
          resetRecord.customerPasswordResetId,
        ]);
        return resetRecord.userId;
      }
    }

    return null;
  }
}

export default new CustomerCredentialRepo();
