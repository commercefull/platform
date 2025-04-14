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

// Field mapping between TypeScript camelCase and database snake_case
const merchantFields = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  website: 'website',
  logoUrl: 'logo_url',
  description: 'description',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const merchantAddressFields = {
  id: 'id',
  merchantId: 'merchant_id',
  addressLine1: 'address_line1',
  addressLine2: 'address_line2',
  city: 'city',
  state: 'state',
  postalCode: 'postal_code',
  country: 'country',
  isPrimary: 'is_primary',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const merchantPaymentInfoFields = {
  id: 'id',
  merchantId: 'merchant_id',
  accountHolderName: 'account_holder_name',
  bankName: 'bank_name',
  accountNumber: 'account_number',
  routingNumber: 'routing_number',
  paymentProcessor: 'payment_processor',
  processorAccountId: 'processor_account_id',
  isVerified: 'is_verified',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

// Helper functions to transform between database and TypeScript formats
function transformMerchantFromDb(dbRecord: Record<string, any>): Merchant {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    email: dbRecord.email,
    phone: dbRecord.phone || undefined,
    website: dbRecord.website || undefined,
    logoUrl: dbRecord.logo_url || undefined,
    description: dbRecord.description || undefined,
    status: dbRecord.status,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  };
}

function transformMerchantAddressFromDb(dbRecord: Record<string, any>): MerchantAddress {
  return {
    id: dbRecord.id,
    merchantId: dbRecord.merchant_id,
    addressLine1: dbRecord.address_line1,
    addressLine2: dbRecord.address_line2 || undefined,
    city: dbRecord.city,
    state: dbRecord.state,
    postalCode: dbRecord.postal_code,
    country: dbRecord.country,
    isPrimary: dbRecord.is_primary,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  };
}

function transformMerchantPaymentInfoFromDb(dbRecord: Record<string, any>): MerchantPaymentInfo {
  return {
    id: dbRecord.id,
    merchantId: dbRecord.merchant_id,
    accountHolderName: dbRecord.account_holder_name,
    bankName: dbRecord.bank_name || undefined,
    accountNumber: dbRecord.account_number || undefined,
    routingNumber: dbRecord.routing_number || undefined,
    paymentProcessor: dbRecord.payment_processor || undefined,
    processorAccountId: dbRecord.processor_account_id || undefined,
    isVerified: dbRecord.is_verified,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  };
}

export class MerchantRepo {
  async findById(id: string): Promise<Merchant | null> {
    const result = await queryOne<Record<string, any>>(
      'SELECT * FROM "public"."merchant" WHERE "id" = $1', 
      [id]
    );
    return result ? transformMerchantFromDb(result) : null;
  }

  async findByEmail(email: string): Promise<Merchant | null> {
    const result = await queryOne<Record<string, any>>(
      'SELECT * FROM "public"."merchant" WHERE "email" = $1', 
      [email]
    );
    return result ? transformMerchantFromDb(result) : null;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Merchant[]> {
    const results = await query<Record<string, any>[]>(
      'SELECT * FROM "public"."merchant" ORDER BY "name" ASC LIMIT $1 OFFSET $2', 
      [limit.toString(), offset.toString()]
    );
    return results ? results.map(transformMerchantFromDb) : [];
  }

  async findByStatus(status: Merchant['status'], limit: number = 50): Promise<Merchant[]> {
    const results = await query<Record<string, any>[]>(
      'SELECT * FROM "public"."merchant" WHERE "status" = $1 ORDER BY "created_at" DESC LIMIT $2', 
      [status, limit.toString()]
    );
    return results ? results.map(transformMerchantFromDb) : [];
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

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."merchant" 
      ("name", "email", "phone", "website", "logo_url", "description", "status", "created_at", "updated_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [name, email, phone || null, website || null, logoUrl || null, description || null, status, now, now]
    );

    if (!result) {
      throw new Error('Failed to create merchant');
    }

    return transformMerchantFromDb(result);
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
        const dbField = merchantFields[key as keyof typeof merchantFields];
        updateFields.push(`"${dbField}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updated_at" = $${paramIndex}`);
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

    const result = await queryOne<Record<string, any>>(query, values);

    if (!result) {
      throw new Error(`Failed to update merchant with ID ${id}`);
    }

    return transformMerchantFromDb(result);
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
    const results = await query<Record<string, any>[]>(
      'SELECT * FROM "public"."merchant_address" WHERE "merchant_id" = $1 ORDER BY "is_primary" DESC', 
      [merchantId]
    );
    return results ? results.map(transformMerchantAddressFromDb) : [];
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
        'UPDATE "public"."merchant_address" SET "is_primary" = false, "updated_at" = $1 WHERE "merchant_id" = $2 AND "is_primary" = true',
        [now, merchantId]
      );
    }

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."merchant_address" 
      ("merchant_id", "address_line1", "address_line2", "city", "state", "postal_code", "country", "is_primary", "created_at", "updated_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [merchantId, addressLine1, addressLine2 || null, city, state, postalCode, country, isPrimary, now, now]
    );

    if (!result) {
      throw new Error('Failed to create merchant address');
    }

    return transformMerchantAddressFromDb(result);
  }

  // Payment info related methods
  async findPaymentInfoByMerchantId(merchantId: string): Promise<MerchantPaymentInfo | null> {
    const result = await queryOne<Record<string, any>>(
      'SELECT * FROM "public"."merchant_payment_info" WHERE "merchant_id" = $1',
      [merchantId]
    );
    return result ? transformMerchantPaymentInfoFromDb(result) : null;
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

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."merchant_payment_info" 
      ("merchant_id", "account_holder_name", "bank_name", "account_number", "routing_number", 
      "payment_processor", "processor_account_id", "is_verified", "created_at", "updated_at") 
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

    return transformMerchantPaymentInfoFromDb(result);
  }
}
