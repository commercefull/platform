import { queryOne, query } from '../../../../libs/db';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

import {
  Organization as DbOrganization,
  OrganizationAddress as DbOrganizationAddress,
  OrganizationPaymentInfo as DbOrganizationPaymentInfo,
  OrganizationPasswordReset as DbOrganizationPasswordReset,
} from '../../../../libs/db/types';
import {
  OrganizationNotFoundError,
  FailedToCreateOrganizationError,
  FailedToUpdateOrganizationError,
  FailedToCreateOrganizationAddressError,
  FailedToCreateOrganizationPaymentInfoError,
} from '../../domain/errors/OrganizationErrors';

export type Organization = DbOrganization;
export type OrganizationAddress = DbOrganizationAddress;
export type OrganizationPaymentInfo = DbOrganizationPaymentInfo;

type OrganizationCreateParams = Partial<Omit<Organization, 'organizationId' | 'createdAt' | 'updatedAt'>> & {
  name: string;
  email: string;
  password: string;
  slug?: string;
  status?: string;
};

type OrganizationUpdateParams = Partial<Omit<Organization, 'organizationId' | 'createdAt' | 'updatedAt'>>;

type OrganizationAddressCreateParams = Partial<Omit<OrganizationAddress, 'organizationAddressId' | 'createdAt' | 'updatedAt'>> & {
  organizationId: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type OrganizationPaymentInfoCreateParams = Partial<Omit<OrganizationPaymentInfo, 'organizationPaymentInfoId' | 'createdAt' | 'updatedAt'>> & {
  organizationId: string;
  paymentType: string;
  currency: string;
};

type OrganizationCreateWithPasswordParams = Omit<OrganizationCreateParams, 'password'> & {
  password: string;
};

export class OrganizationRepo {
  async findById(organizationId: string): Promise<Organization | null> {
    return await queryOne<Organization>('SELECT * FROM "organization" WHERE "organizationId" = $1', [organizationId]);
  }

  async findByEmail(email: string): Promise<Organization | null> {
    return await queryOne<Organization>('SELECT * FROM "organization" WHERE email = $1', [email]);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return await queryOne<Organization>('SELECT * FROM "organization" WHERE slug = $1', [slug]);
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Organization[]> {
    const results = await query<Organization[]>('SELECT * FROM "organization" ORDER BY name ASC LIMIT $1 OFFSET $2', [limit, offset]);
    return results || [];
  }

  async findByStatus(status: string, limit: number = 50): Promise<Organization[]> {
    const results = await query<Organization[]>('SELECT * FROM "organization" WHERE status = $1 ORDER BY "createdAt" DESC LIMIT $2', [status, limit]);
    return results || [];
  }

  async createWithPassword(params: OrganizationCreateWithPasswordParams): Promise<Organization> {
    const now = new Date();
    const hashedPassword = await this.hashPassword(params.password);
    const slug = params.slug || this.generateSlug(params.name);

    const result = await queryOne<Organization>(
      `INSERT INTO "organization" (
        name, slug, email, password, phone, website, logo, description, status,
        "businessType", "emailVerified", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
        false,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateOrganizationError();
    }

    return result;
  }

  async create(params: OrganizationCreateParams): Promise<Organization> {
    const now = new Date();
    const slug = params.slug || this.generateSlug(params.name);
    const hashedPassword = params.password ? await this.hashPassword(params.password) : null;

    const result = await queryOne<Organization>(
      `INSERT INTO "organization" (
        name, slug, email, password, phone, website, logo, description, status,
        "businessType", "emailVerified", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
        false,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateOrganizationError();
    }

    return result;
  }

  async update(organizationId: string, params: OrganizationUpdateParams): Promise<Organization> {
    const now = new Date();
    const current = await this.findById(organizationId);

    if (!current) {
      throw new OrganizationNotFoundError(organizationId);
    }

    const updateFields: string[] = [];
    const values: unknown[] = [];
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

    values.push(organizationId);

    const result = await queryOne<Organization>(
      `UPDATE "organization" SET ${updateFields.join(', ')} WHERE "organizationId" = $${paramIndex} RETURNING *`,
      values,
    );

    if (!result) {
      throw new FailedToUpdateOrganizationError(organizationId);
    }

    return result;
  }

  async delete(organizationId: string): Promise<boolean> {
    const result = await queryOne<Pick<DbOrganization, 'organizationId'>>(
      'DELETE FROM "organization" WHERE "organizationId" = $1 RETURNING "organizationId"',
      [organizationId],
    );
    return !!result;
  }

  async getStoresByOrganization(organizationId: string): Promise<unknown[]> {
    const result = await query<unknown[]>('SELECT * FROM "store" WHERE "organizationId" = $1 ORDER BY name ASC', [organizationId]);
    return result ?? [];
  }

  // ============================================================================
  // Address
  // ============================================================================

  async findAddressesByOrganizationId(organizationId: string): Promise<OrganizationAddress[]> {
    const results = await query<OrganizationAddress[]>('SELECT * FROM "organizationAddress" WHERE "organizationId" = $1 ORDER BY "isDefault" DESC', [
      organizationId,
    ]);
    return results || [];
  }

  async findAddressById(addressId: string): Promise<OrganizationAddress | null> {
    return await queryOne<OrganizationAddress>('SELECT * FROM "organizationAddress" WHERE "organizationAddressId" = $1', [addressId]);
  }

  async createAddress(params: OrganizationAddressCreateParams): Promise<OrganizationAddress> {
    const now = new Date();

    if (params.isDefault) {
      await query('UPDATE "organizationAddress" SET "isDefault" = false, "updatedAt" = $1 WHERE "organizationId" = $2 AND "isDefault" = true', [
        now,
        params.organizationId,
      ]);
    }

    const result = await queryOne<OrganizationAddress>(
      `INSERT INTO "organizationAddress" (
        "organizationId", "addressType", "isDefault", "firstName", "lastName", company,
        "addressLine1", "addressLine2", city, state, "postalCode", country,
        phone, email, "isVerified", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        params.organizationId,
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
      throw new FailedToCreateOrganizationAddressError();
    }

    return result;
  }

  async deleteAddress(addressId: string): Promise<boolean> {
    const result = await queryOne<Pick<DbOrganizationAddress, 'organizationAddressId'>>(
      'DELETE FROM "organizationAddress" WHERE "organizationAddressId" = $1 RETURNING "organizationAddressId"',
      [addressId],
    );
    return !!result;
  }

  // ============================================================================
  // Payment Info
  // ============================================================================

  async findPaymentInfoByOrganizationId(organizationId: string): Promise<OrganizationPaymentInfo[]> {
    const results = await query<OrganizationPaymentInfo[]>(
      'SELECT * FROM "organizationPaymentInfo" WHERE "organizationId" = $1 ORDER BY "isDefault" DESC',
      [organizationId],
    );
    return results || [];
  }

  async findPaymentInfoById(paymentInfoId: string): Promise<OrganizationPaymentInfo | null> {
    return await queryOne<OrganizationPaymentInfo>('SELECT * FROM "organizationPaymentInfo" WHERE "organizationPaymentInfoId" = $1', [
      paymentInfoId,
    ]);
  }

  async createPaymentInfo(params: OrganizationPaymentInfoCreateParams): Promise<OrganizationPaymentInfo> {
    const now = new Date();

    const result = await queryOne<OrganizationPaymentInfo>(
      `INSERT INTO "organizationPaymentInfo" (
        "organizationId", "paymentType", "isDefault", "accountHolderName", "bankName",
        "accountNumber", "routingNumber", "accountType", "paypalEmail",
        currency, "isVerified", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        params.organizationId,
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
      throw new FailedToCreateOrganizationPaymentInfoError();
    }

    return result;
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  async authenticate(credentials: {
    email: string;
    password: string;
  }): Promise<{ organizationId: string; email: string; name: string; status: string } | null> {
    const org = await queryOne<Organization>('SELECT * FROM "organization" WHERE email = $1', [credentials.email]);

    if (!org) return null;

    const passwordMatch = await bcryptjs.compare(credentials.password, org.password);
    if (!passwordMatch) return null;

    return {
      organizationId: org.organizationId,
      email: org.email,
      name: org.name,
      status: org.status,
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcryptjs.hash(password, saltRounds);
  }

  async changePassword(organizationId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(newPassword);
    const result = await queryOne<Pick<DbOrganization, 'organizationId'>>(
      `UPDATE "organization" SET password = $1, "updatedAt" = $2 WHERE "organizationId" = $3 RETURNING "organizationId"`,
      [hashedPassword, new Date(), organizationId],
    );
    return !!result;
  }

  async createPasswordResetToken(organizationId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcryptjs.hash(token, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const now = new Date();

    await queryOne(
      `INSERT INTO "organizationPasswordReset" ("userId", token, "expiresAt", "isUsed", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, false, $4, $5)
       RETURNING "organizationPasswordResetId"`,
      [organizationId, hashedToken, expiresAt, now, now],
    );

    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    const record = await queryOne<Pick<DbOrganizationPasswordReset, 'organizationPasswordResetId' | 'userId' | 'token'>>(
      `SELECT "organizationPasswordResetId", "userId", token
       FROM "organizationPasswordReset"
       WHERE "isUsed" = false AND "expiresAt" > $1
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [new Date()],
    );

    if (!record) return null;

    const isValid = await bcryptjs.compare(token, record.token);
    if (!isValid) return null;

    await queryOne(`UPDATE "organizationPasswordReset" SET "isUsed" = true, "updatedAt" = $1 WHERE "organizationPasswordResetId" = $2`, [
      new Date(),
      record.organizationPasswordResetId,
    ]);

    return record.userId;
  }

  async updateLastLogin(organizationId: string): Promise<void> {
    await query('UPDATE "organization" SET "lastLoginAt" = $1, "updatedAt" = $2 WHERE "organizationId" = $3', [new Date(), new Date(), organizationId]);
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

export default new OrganizationRepo();
