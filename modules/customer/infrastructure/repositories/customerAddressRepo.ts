import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

// Import types from generated DB types - single source of truth
import type { CustomerAddress as DbCustomerAddress } from '../../../../libs/db/types';
import { FailedToCreateCustomerError } from '../../domain/errors/CustomerErrors';

// Re-export DB type
export type CustomerAddress = DbCustomerAddress;

// Derived types for create/update operations
export type CustomerAddressCreateParams = Omit<CustomerAddress, 'customerAddressId' | 'createdAt' | 'updatedAt'> & {
  dependentLocality?: string | null;
  sortingCode?: string | null;
  addressLines?: unknown | null;
};
export type CustomerAddressUpdateParams = Partial<Omit<CustomerAddress, 'customerAddressId' | 'customerId' | 'createdAt' | 'updatedAt'>>;

export class CustomerAddressRepo {
  async findById(id: string): Promise<CustomerAddress | null> {
    return await queryOne<DbCustomerAddress>(`SELECT * FROM "customerAddress" WHERE "customerAddressId" = $1`, [id]);
  }

  async findByCustomerId(customerId: string): Promise<CustomerAddress[]> {
    return (
      (await query<DbCustomerAddress[]>(
        `SELECT * FROM "customerAddress" WHERE "customerId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC`,
        [customerId],
      )) || []
    );
  }

  async findDefaultByCustomerId(customerId: string): Promise<CustomerAddress | null> {
    return await queryOne<DbCustomerAddress>(`SELECT * FROM "customerAddress" WHERE "customerId" = $1 AND "isDefault" = true LIMIT 1`, [
      customerId,
    ]);
  }

  async findDefaultBillingByCustomerId(customerId: string): Promise<CustomerAddress | null> {
    return await queryOne<DbCustomerAddress>(
      `SELECT * FROM "customerAddress" WHERE "customerId" = $1 AND "isDefaultBilling" = true LIMIT 1`,
      [customerId],
    );
  }

  async findDefaultShippingByCustomerId(customerId: string): Promise<CustomerAddress | null> {
    return await queryOne<DbCustomerAddress>(
      `SELECT * FROM "customerAddress" WHERE "customerId" = $1 AND "isDefaultShipping" = true LIMIT 1`,
      [customerId],
    );
  }

  async create(params: CustomerAddressCreateParams): Promise<CustomerAddress> {
    const now = unixTimestamp();

    // If setting as default, unset other defaults
    if (params.isDefault) {
      await this.unsetDefaults(params.customerId);
    }
    if (params.isDefaultBilling) {
      await this.unsetDefaultBilling(params.customerId);
    }
    if (params.isDefaultShipping) {
      await this.unsetDefaultShipping(params.customerId);
    }

    const v = this.addressRowValues(params);
    const result = await queryOne<DbCustomerAddress>(
      `INSERT INTO "customerAddress" (
        "customerId", "firstName", "lastName", "company", "addressLine1", "addressLine2",
        "city", "state", "postalCode", "country", "phone", "email", "isDefault",
        "isDefaultBilling", "isDefaultShipping", "addressType", "isVerified", "verifiedAt",
        "verificationData", "additionalInfo", "latitude", "longitude", "name",
        "dependentLocality", "sortingCode", "addressLines", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      RETURNING *`,
      [
        v.customerId,
        v.firstName,
        v.lastName,
        v.company,
        v.addressLine1,
        v.addressLine2,
        v.city,
        v.state,
        v.postalCode,
        v.country,
        v.phone,
        v.email,
        v.isDefault,
        v.isDefaultBilling,
        v.isDefaultShipping,
        v.addressType,
        v.isVerified,
        v.verifiedAt,
        v.verificationData,
        v.additionalInfo,
        v.latitude,
        v.longitude,
        v.name,
        v.dependentLocality,
        v.sortingCode,
        v.addressLines,
        now,
        now,
      ],
    );

    if (!result) throw new FailedToCreateCustomerError('Failed to create customer address');
    return result;
  }

  private addressRowValues(params: CustomerAddressCreateParams) {
    return { ...this.addressContactValues(params), ...this.addressFlagValues(params), ...this.addressGeoValues(params) };
  }

  private addressContactValues(params: CustomerAddressCreateParams) {
    return {
      customerId: params.customerId,
      firstName: params.firstName || null,
      lastName: params.lastName || null,
      company: params.company || null,
      phone: params.phone || null,
      email: params.email || null,
      name: params.name || null,
    };
  }

  private addressFlagValues(params: CustomerAddressCreateParams) {
    return {
      isDefault: params.isDefault || false,
      isDefaultBilling: params.isDefaultBilling || false,
      isDefaultShipping: params.isDefaultShipping || false,
      addressType: params.addressType || 'both',
      isVerified: params.isVerified || false,
      verifiedAt: params.verifiedAt || null,
      verificationData: params.verificationData ? JSON.stringify(params.verificationData) : null,
    };
  }

  private addressGeoValues(params: CustomerAddressCreateParams) {
    return {
      addressLine1: params.addressLine1,
      addressLine2: params.addressLine2 || null,
      city: params.city,
      state: params.state || null,
      postalCode: params.postalCode,
      country: params.country,
      additionalInfo: params.additionalInfo || null,
      latitude: params.latitude || null,
      longitude: params.longitude || null,
      dependentLocality: params.dependentLocality || null,
      sortingCode: params.sortingCode || null,
      addressLines: params.addressLines ? JSON.stringify(params.addressLines) : null,
    };
  }

  async update(id: string, params: CustomerAddressUpdateParams): Promise<CustomerAddress | null> {
    const address = await this.findById(id);
    if (!address) return null;

    if (params.isDefault === true) {
      await this.unsetDefaults(address.customerId, id);
    }
    if (params.isDefaultBilling === true) {
      await this.unsetDefaultBilling(address.customerId, id);
    }
    if (params.isDefaultShipping === true) {
      await this.unsetDefaultShipping(address.customerId, id);
    }

    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push((key === 'verificationData' || key === 'addressLines') && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return address;

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<DbCustomerAddress>(
      `UPDATE "customerAddress" SET ${updateFields.join(', ')} WHERE "customerAddressId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  private async unsetDefaults(customerId: string, exceptId?: string): Promise<void> {
    let sql = `UPDATE "customerAddress" SET "isDefault" = false, "updatedAt" = $1 WHERE "customerId" = $2 AND "isDefault" = true`;
    const params: unknown[] = [unixTimestamp(), customerId];
    if (exceptId) {
      sql += ` AND "customerAddressId" != $3`;
      params.push(exceptId);
    }
    await query(sql, params);
  }

  private async unsetDefaultBilling(customerId: string, exceptId?: string): Promise<void> {
    let sql = `UPDATE "customerAddress" SET "isDefaultBilling" = false, "updatedAt" = $1 WHERE "customerId" = $2 AND "isDefaultBilling" = true`;
    const params: unknown[] = [unixTimestamp(), customerId];
    if (exceptId) {
      sql += ` AND "customerAddressId" != $3`;
      params.push(exceptId);
    }
    await query(sql, params);
  }

  private async unsetDefaultShipping(customerId: string, exceptId?: string): Promise<void> {
    let sql = `UPDATE "customerAddress" SET "isDefaultShipping" = false, "updatedAt" = $1 WHERE "customerId" = $2 AND "isDefaultShipping" = true`;
    const params: unknown[] = [unixTimestamp(), customerId];
    if (exceptId) {
      sql += ` AND "customerAddressId" != $3`;
      params.push(exceptId);
    }
    await query(sql, params);
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ customerAddressId: string }>(
      `DELETE FROM "customerAddress" WHERE "customerAddressId" = $1 RETURNING "customerAddressId"`,
      [id],
    );
    return !!result;
  }

  async count(customerId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "customerAddress"`;
    const params: unknown[] = [];
    if (customerId) {
      sql += ` WHERE "customerId" = $1`;
      params.push(customerId);
    }
    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }

  async findActiveByCustomerId(customerId: string): Promise<CustomerAddress[]> {
    return (
      (await query<DbCustomerAddress[]>(
        `SELECT * FROM "customerAddress" WHERE "customerId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC`,
        [customerId],
      )) || []
    );
  }

  async findActiveById(id: string, customerId: string): Promise<CustomerAddress | null> {
    return await queryOne<DbCustomerAddress>(`SELECT * FROM "customerAddress" WHERE "customerAddressId" = $1 AND "customerId" = $2`, [
      id,
      customerId,
    ]);
  }

  async softDelete(id: string, customerId: string): Promise<boolean> {
    const result = await queryOne<{ customerAddressId: string }>(
      `DELETE FROM "customerAddress" WHERE "customerAddressId" = $1 AND "customerId" = $2 RETURNING "customerAddressId"`,
      [id, customerId],
    );
    return !!result;
  }

  async unsetDefaultsExcept(customerId: string, exceptId: string): Promise<void> {
    await query(
      `UPDATE "customerAddress" SET "isDefault" = false, "updatedAt" = NOW() WHERE "customerId" = $1 AND "isDefault" = true AND "customerAddressId" != $2`,
      [customerId, exceptId],
    );
  }
}

export default new CustomerAddressRepo();
