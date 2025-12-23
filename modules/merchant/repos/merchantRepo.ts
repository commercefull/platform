import { queryOne, query } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

// Import types from generated DB types - single source of truth
import {
  Merchant as DbMerchant,
  MerchantAddress as DbMerchantAddress,
  MerchantPaymentInfo as DbMerchantPaymentInfo,
} from '../../../libs/db/types';

// Re-export DB types
export type Merchant = DbMerchant;
export type MerchantAddress = DbMerchantAddress;
export type MerchantPaymentInfo = DbMerchantPaymentInfo;

// Derived types for create/update operations
type MerchantCreateParams = Partial<Omit<Merchant, 'merchantId' | 'createdAt' | 'updatedAt'>> & {
  name: string;
  email: string;
  password: string;
  slug?: string;
  status?: string;
};

type MerchantUpdateParams = Partial<Omit<Merchant, 'merchantId' | 'createdAt' | 'updatedAt'>>;

type MerchantAddressCreateParams = Partial<Omit<MerchantAddress, 'merchantAddressId' | 'createdAt' | 'updatedAt'>> & {
  merchantId: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type MerchantPaymentInfoCreateParams = Partial<Omit<MerchantPaymentInfo, 'merchantPaymentInfoId' | 'createdAt' | 'updatedAt'>> & {
  merchantId: string;
  paymentType: string;
  currency: string;
};

type MerchantCreateWithPasswordParams = Omit<MerchantCreateParams, 'password'> & {
  password: string;
};

export class MerchantRepo {
  // ============================================================================
  // Merchant CRUD
  // ============================================================================

  async findById(merchantId: string): Promise<Merchant | null> {
    return await queryOne<Merchant>('SELECT * FROM merchant WHERE "merchantId" = $1', [merchantId]);
  }

  async findByEmail(email: string): Promise<Merchant | null> {
    return await queryOne<Merchant>('SELECT * FROM merchant WHERE email = $1', [email]);
  }

  async findBySlug(slug: string): Promise<Merchant | null> {
    return await queryOne<Merchant>('SELECT * FROM merchant WHERE slug = $1', [slug]);
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Merchant[]> {
    const results = await query<Merchant[]>('SELECT * FROM merchant ORDER BY name ASC LIMIT $1 OFFSET $2', [limit, offset]);
    return results || [];
  }

  async findByStatus(status: string, limit: number = 50): Promise<Merchant[]> {
    const results = await query<Merchant[]>('SELECT * FROM merchant WHERE status = $1 ORDER BY "createdAt" DESC LIMIT $2', [status, limit]);
    return results || [];
  }

  async createMerchantWithPassword(params: MerchantCreateWithPasswordParams): Promise<Merchant> {
    const now = new Date();
    const hashedPassword = await this.hashPassword(params.password);
    const slug = params.slug || this.generateSlug(params.name);

    const result = await queryOne<Merchant>(
      `INSERT INTO merchant (
        name, slug, email, password, phone, website, logo, description, status,
        "businessType", "autoApproveProducts", "autoApproveReviews", "featuredMerchant",
        "emailVerified", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        params.name,
        slug,
        params.email,
        hashedPassword,
        params.phone || null,
        params.website || null,
        params.logo || null,
        params.description || null,
        params.status || 'pending',
        params.businessType || null,
        false, // autoApproveProducts
        false, // autoApproveReviews
        false, // featuredMerchant
        false, // emailVerified
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create merchant');
    }

    return result;
  }

  async create(params: MerchantCreateParams): Promise<Merchant> {
    const now = new Date();
    const slug = params.slug || this.generateSlug(params.name);
    // Hash password if provided
    const hashedPassword = params.password ? await this.hashPassword(params.password) : null;

    const result = await queryOne<Merchant>(
      `INSERT INTO merchant (
        name, slug, email, password, phone, website, logo, description, status,
        "autoApproveProducts", "autoApproveReviews", "featuredMerchant", "emailVerified",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        params.name,
        slug,
        params.email,
        hashedPassword,
        params.phone || null,
        params.website || null,
        params.logo || null,
        params.description || null,
        params.status || 'pending',
        false,
        false,
        false,
        false,
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create merchant');
    }

    return result;
  }

  async update(merchantId: string, params: MerchantUpdateParams): Promise<Merchant> {
    const now = new Date();
    const currentMerchant = await this.findById(merchantId);

    if (!currentMerchant) {
      throw new Error(`Merchant with ID ${merchantId} not found`);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    values.push(merchantId);

    const result = await queryOne<Merchant>(
      `UPDATE merchant SET ${updateFields.join(', ')} WHERE "merchantId" = $${paramIndex} RETURNING *`,
      values,
    );

    if (!result) {
      throw new Error(`Failed to update merchant with ID ${merchantId}`);
    }

    return result;
  }

  async delete(merchantId: string): Promise<boolean> {
    const result = await queryOne<{ merchantId: string }>('DELETE FROM merchant WHERE "merchantId" = $1 RETURNING "merchantId"', [
      merchantId,
    ]);
    return !!result;
  }

  // ============================================================================
  // Merchant Address
  // ============================================================================

  async findAddressesByMerchantId(merchantId: string): Promise<MerchantAddress[]> {
    const results = await query<MerchantAddress[]>('SELECT * FROM "merchantAddress" WHERE "merchantId" = $1 ORDER BY "isDefault" DESC', [
      merchantId,
    ]);
    return results || [];
  }

  async findAddressById(merchantAddressId: string): Promise<MerchantAddress | null> {
    return await queryOne<MerchantAddress>('SELECT * FROM "merchantAddress" WHERE "merchantAddressId" = $1', [merchantAddressId]);
  }

  async createAddress(params: MerchantAddressCreateParams): Promise<MerchantAddress> {
    const now = new Date();

    // If this is a default address, unset other defaults
    if (params.isDefault) {
      await query('UPDATE "merchantAddress" SET "isDefault" = false, "updatedAt" = $1 WHERE "merchantId" = $2 AND "isDefault" = true', [
        now,
        params.merchantId,
      ]);
    }

    const result = await queryOne<MerchantAddress>(
      `INSERT INTO "merchantAddress" (
        "merchantId", "addressType", "isDefault", "firstName", "lastName", company,
        "addressLine1", "addressLine2", city, state, "postalCode", country,
        phone, email, "isVerified", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        params.merchantId,
        params.addressType || 'business',
        params.isDefault || false,
        params.firstName || null,
        params.lastName || null,
        params.company || null,
        params.addressLine1,
        params.addressLine2 || null,
        params.city,
        params.state,
        params.postalCode,
        params.country,
        params.phone || null,
        params.email || null,
        false,
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create merchant address');
    }

    return result;
  }

  async deleteAddress(merchantAddressId: string): Promise<boolean> {
    const result = await queryOne<{ merchantAddressId: string }>(
      'DELETE FROM "merchantAddress" WHERE "merchantAddressId" = $1 RETURNING "merchantAddressId"',
      [merchantAddressId],
    );
    return !!result;
  }

  // ============================================================================
  // Merchant Payment Info
  // ============================================================================

  async findPaymentInfoByMerchantId(merchantId: string): Promise<MerchantPaymentInfo[]> {
    const results = await query<MerchantPaymentInfo[]>(
      'SELECT * FROM "merchantPaymentInfo" WHERE "merchantId" = $1 ORDER BY "isDefault" DESC',
      [merchantId],
    );
    return results || [];
  }

  async findPaymentInfoById(merchantPaymentInfoId: string): Promise<MerchantPaymentInfo | null> {
    return await queryOne<MerchantPaymentInfo>('SELECT * FROM "merchantPaymentInfo" WHERE "merchantPaymentInfoId" = $1', [
      merchantPaymentInfoId,
    ]);
  }

  async createPaymentInfo(params: MerchantPaymentInfoCreateParams): Promise<MerchantPaymentInfo> {
    const now = new Date();

    const result = await queryOne<MerchantPaymentInfo>(
      `INSERT INTO "merchantPaymentInfo" (
        "merchantId", "paymentType", "isDefault", "accountHolderName", "bankName",
        "accountNumber", "routingNumber", "accountType", "paypalEmail",
        currency, "isVerified", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        params.merchantId,
        params.paymentType,
        params.isDefault || false,
        params.accountHolderName || null,
        params.bankName || null,
        params.accountNumber || null,
        params.routingNumber || null,
        params.accountType || null,
        params.paypalEmail || null,
        params.currency,
        false,
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create merchant payment info');
    }

    return result;
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  async authenticateMerchant(credentials: {
    email: string;
    password: string;
  }): Promise<{ merchantId: string; email: string; name: string; status: string } | null> {
    const merchant = await queryOne<Merchant>('SELECT * FROM merchant WHERE email = $1', [credentials.email]);

    if (!merchant) return null;

    const passwordMatch = await bcryptjs.compare(credentials.password, merchant.password);
    if (!passwordMatch) return null;

    return {
      merchantId: merchant.merchantId,
      email: merchant.email,
      name: merchant.name,
      status: merchant.status,
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcryptjs.hash(password, saltRounds);
  }

  async changePassword(merchantId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(newPassword);
    const result = await queryOne<{ merchantId: string }>(
      `UPDATE merchant SET password = $1, "updatedAt" = $2 WHERE "merchantId" = $3 RETURNING "merchantId"`,
      [hashedPassword, new Date(), merchantId],
    );
    return !!result;
  }

  async createPasswordResetToken(merchantId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcryptjs.hash(token, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const now = new Date();

    await queryOne(
      `INSERT INTO "merchantPasswordReset" ("merchantId", token, "expiresAt", "isUsed", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, false, $4, $5)
       RETURNING "merchantPasswordResetId"`,
      [merchantId, hashedToken, expiresAt, now, now],
    );

    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    const record = await queryOne<{
      merchantPasswordResetId: string;
      merchantId: string;
      token: string;
    }>(
      `SELECT "merchantPasswordResetId", "merchantId", token
       FROM "merchantPasswordReset"
       WHERE "isUsed" = false AND "expiresAt" > $1
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [new Date()],
    );

    if (!record) return null;

    const isValid = await bcryptjs.compare(token, record.token);
    if (!isValid) return null;

    await queryOne(`UPDATE "merchantPasswordReset" SET "isUsed" = true, "updatedAt" = $1 WHERE "merchantPasswordResetId" = $2`, [
      new Date(),
      record.merchantPasswordResetId,
    ]);

    return record.merchantId;
  }

  async updateLastLogin(merchantId: string): Promise<void> {
    await query('UPDATE merchant SET "lastLoginAt" = $1, "updatedAt" = $2 WHERE "merchantId" = $3', [new Date(), new Date(), merchantId]);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);

    return base || crypto.randomUUID();
  }
}

export default new MerchantRepo();
