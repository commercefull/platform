import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

export interface Merchant {
  id: string;
  name: string;
  email: string;
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

// Database uses camelCase for column names - no transformation needed

export class MerchantRepo {
  async findById(id: string): Promise<Merchant | null> {
    return await queryOne<Merchant>(
      'SELECT * FROM "public"."merchant" WHERE "id" = $1', 
      [id]
    );
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
    const {
      name,
      email,
      phone,
      website,
      logoUrl,
      description,
      status
    } = params;

    const result = await queryOne<Merchant>(
      `INSERT INTO "public"."merchant" 
      ("name", "email", "phone", "website", "logoUrl", "description", "status", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [name, email, phone || null, website || null, logoUrl || null, description || null, status, now, now]
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
}
