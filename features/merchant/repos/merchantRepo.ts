import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  email: string;
  password: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface MerchantAddress {
  id: string;
  merchantId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantPaymentInfo {
  id: string;
  merchantId: string;
  accountHolderName: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  paymentProcessor?: string;
  processorAccountId?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

type MerchantCreateParams = Omit<Merchant, 'id' | 'createdAt' | 'updatedAt'>;
type MerchantUpdateParams = Partial<Omit<Merchant, 'id' | 'createdAt' | 'updatedAt'>>;
type MerchantAddressCreateParams = Omit<MerchantAddress, 'id' | 'createdAt' | 'updatedAt'>;
type MerchantPaymentInfoCreateParams = Omit<MerchantPaymentInfo, 'id' | 'createdAt' | 'updatedAt'>;

type MerchantCreateWithPasswordParams = Omit<MerchantCreateParams, 'password' | 'slug'> & {
  password: string;
  slug?: string;
};

// Database uses camelCase for column names - no transformation needed

export class MerchantRepo {
  async findById(id: string): Promise<Merchant | null> {
    return await queryOne<Merchant>(
      'SELECT * FROM "public"."merchant" WHERE "id" = $1',
      [id]
    );
  }

  async createMerchantWithPassword(params: MerchantCreateWithPasswordParams): Promise<Merchant> {
    const now = unixTimestamp();
    const hashedPassword = await this.hashPassword(params.password);
    const slug = params.slug || this.generateSlug(params.name);

    const result = await queryOne<Merchant>(
      `INSERT INTO "public"."merchant"
      ("name", "slug", "email", "password", "phone", "website", "logoUrl", "description", "status", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      RETURNING *`,
      [
        params.name,
        slug,
        params.email,
        hashedPassword,
        params.phone || null,
        params.website || null,
        params.logoUrl || null,
        params.description || null,
        params.status,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create merchant');
    }

    return result;
  }

  async findByEmail(email: string): Promise<Merchant | null> {
    return await queryOne<Merchant>(
      'SELECT * FROM "public"."merchant" WHERE "email" = $1',
      [email]
    );
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Merchant[]> {
    const results = await query<Merchant[]>(
      'SELECT * FROM "public"."merchant" ORDER BY "name" ASC LIMIT $1 OFFSET $2',
      [limit.toString(), offset.toString()]
    );
    return results || [];
  }

  async findByStatus(status: Merchant['status'], limit: number = 50): Promise<Merchant[]> {
    const results = await query<Merchant[]>(
      'SELECT * FROM "public"."merchant" WHERE "status" = $1 ORDER BY "createdAt" DESC LIMIT $2',
      [status, limit.toString()]
    );
    return results || [];
  }

  async create(params: MerchantCreateParams): Promise<Merchant> {
    const now = unixTimestamp();
    const slug = params.slug || this.generateSlug(params.name);
    const result = await queryOne<Merchant>(
      `INSERT INTO "public"."merchant" 
      ("name", "slug", "email", "password", "phone", "website", "logoUrl", "description", "status", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) 
      RETURNING *`,
      [
        params.name,
        slug,
        params.email,
        params.password,
        params.phone || null,
        params.website || null,
        params.logoUrl || null,
        params.description || null,
        params.status,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create merchant');
    }

    return result;
  }

  async update(id: string, params: MerchantUpdateParams): Promise<Merchant> {
    const now = unixTimestamp();
    const currentMerchant = await this.findById(id);

    if (!currentMerchant) {
      throw new Error(`Merchant with ID ${id} not found`);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic query based on provided update params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    // Add ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE "public"."merchant" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<Merchant>(query, values);

    if (!result) {
      throw new Error(`Failed to update merchant with ID ${id}`);
    }

    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."merchant" WHERE "id" = $1 RETURNING "id"',
      [id]
    );

    return !!result;
  }

  // Address related methods
  async findAddressesByMerchantId(merchantId: string): Promise<MerchantAddress[]> {
    const results = await query<MerchantAddress[]>(
      'SELECT * FROM "public"."merchantAddress" WHERE "merchantId" = $1 ORDER BY "isPrimary" DESC',
      [merchantId]
    );
    return results || [];
  }

  async createAddress(params: MerchantAddressCreateParams): Promise<MerchantAddress> {
    const now = unixTimestamp();
    const {
      merchantId,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isPrimary
    } = params;

    // If this is a primary address, update existing primary to non-primary
    if (isPrimary) {
      await query(
        'UPDATE "public"."merchantAddress" SET "isPrimary" = false, "updatedAt" = $1 WHERE "merchantId" = $2 AND "isPrimary" = true',
        [now, merchantId]
      );
    }

    const result = await queryOne<MerchantAddress>(
      `INSERT INTO "public"."merchantAddress" 
      ("merchantId", "addressLine1", "addressLine2", "city", "state", "postalCode", "country", "isPrimary", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [merchantId, addressLine1, addressLine2 || null, city, state, postalCode, country, isPrimary, now, now]
    );

    if (!result) {
      throw new Error('Failed to create merchant address');
    }

    return result;
  }

  // Payment info related methods
  async findPaymentInfoByMerchantId(merchantId: string): Promise<MerchantPaymentInfo | null> {
    return await queryOne<MerchantPaymentInfo>(
      'SELECT * FROM "public"."merchantPaymentInfo" WHERE "merchantId" = $1',
      [merchantId]
    );
  }

  async createPaymentInfo(params: MerchantPaymentInfoCreateParams): Promise<MerchantPaymentInfo> {
    const now = unixTimestamp();
    const {
      merchantId,
      accountHolderName,
      bankName,
      accountNumber,
      routingNumber,
      paymentProcessor,
      processorAccountId,
      isVerified
    } = params;

    const result = await queryOne<MerchantPaymentInfo>(
      `INSERT INTO "public"."merchantPaymentInfo" 
      ("merchantId", "accountHolderName", "bankName", "accountNumber", "routingNumber", 
      "paymentProcessor", "processorAccountId", "isVerified", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        merchantId,
        accountHolderName,
        bankName || null,
        accountNumber || null,
        routingNumber || null,
        paymentProcessor || null,
        processorAccountId || null,
        isVerified,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create merchant payment info');
    }

    return result;
  }

  async authenticateMerchant(credentials: { email: string; password: string }): Promise<{ id: string; email: string; name: string; status: string } | null> {
    const merchant = await queryOne<Merchant>(
      `SELECT "merchantId" as "id", "email", "password", "name", "status"
     FROM "public"."merchant" WHERE "email" = $1`,
      [credentials.email]
    );
    if (!merchant) return null;

    if (!(await bcryptjs.compare(credentials.password, merchant.password))) return null;

    return { id: merchant.id, email: merchant.email, name: merchant.name, status: merchant.status };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcryptjs.hash(password, saltRounds);
  }

  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(newPassword);
    const result = await queryOne<{ id: string }>(
      `UPDATE "public"."merchant"
       SET "password" = $1, "updatedAt" = $2
       WHERE "id" = $3
       RETURNING "id"`,
      [hashedPassword, unixTimestamp(), userId]
    );

    return !!result;
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcryptjs.hash(token, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const now = new Date();

    await queryOne(
      `INSERT INTO "public"."merchantPasswordReset"
       ("userId", "token", "expiresAt", "isUsed", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, false, $4, $4)
       RETURNING "merchantPasswordResetId"`,
      [userId, hashedToken, expiresAt, now]
    );

    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    const record = await queryOne<{
      merchantPasswordResetId: string;
      userId: string;
      token: string;
    }>(
      `SELECT "merchantPasswordResetId", "userId", "token"
       FROM "public"."merchantPasswordReset"
       WHERE "isUsed" = false AND "expiresAt" > $1
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [new Date()]
    );

    if (!record) {
      return null;
    }

    const isValid = await bcryptjs.compare(token, record.token);

    if (!isValid) {
      return null;
    }

    await queryOne(
      `UPDATE "public"."merchantPasswordReset"
       SET "isUsed" = true, "updatedAt" = $1
       WHERE "merchantPasswordResetId" = $2`,
      [new Date(), record.merchantPasswordResetId]
    );

    return record.userId;
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);

    return base || crypto.randomUUID();
  }
}
