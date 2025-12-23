import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

// Import types from generated DB types - single source of truth
import { CustomerAddress as DbCustomerAddress } from '../../../libs/db/types';

// Re-export DB type
export type CustomerAddress = DbCustomerAddress;

// Derived types for create/update operations
export type CustomerAddressCreateParams = Omit<CustomerAddress, 'customerAddressId' | 'createdAt' | 'updatedAt'>;
export type CustomerAddressUpdateParams = Partial<Omit<CustomerAddress, 'customerAddressId' | 'customerId' | 'createdAt' | 'updatedAt'>>;

export class CustomerAddressRepo {
  async findById(id: string): Promise<CustomerAddress | null> {
    return await queryOne<CustomerAddress>(`SELECT * FROM "customerAddress" WHERE "customerAddressId" = $1`, [id]);
  }

  async findByCustomerId(customerId: string): Promise<CustomerAddress[]> {
    return (
      (await query<CustomerAddress[]>(
        `SELECT * FROM "customerAddress" WHERE "customerId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC`,
        [customerId],
      )) || []
    );
  }

  async findDefaultByCustomerId(customerId: string): Promise<CustomerAddress | null> {
    return await queryOne<CustomerAddress>(`SELECT * FROM "customerAddress" WHERE "customerId" = $1 AND "isDefault" = true LIMIT 1`, [
      customerId,
    ]);
  }

  async findDefaultBillingByCustomerId(customerId: string): Promise<CustomerAddress | null> {
    return await queryOne<CustomerAddress>(
      `SELECT * FROM "customerAddress" WHERE "customerId" = $1 AND "isDefaultBilling" = true LIMIT 1`,
      [customerId],
    );
  }

  async findDefaultShippingByCustomerId(customerId: string): Promise<CustomerAddress | null> {
    return await queryOne<CustomerAddress>(
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

    const result = await queryOne<CustomerAddress>(
      `INSERT INTO "customerAddress" (
        "customerId", "firstName", "lastName", "company", "addressLine1", "addressLine2",
        "city", "state", "postalCode", "country", "phone", "email", "isDefault",
        "isDefaultBilling", "isDefaultShipping", "addressType", "isVerified", "verifiedAt",
        "verificationData", "additionalInfo", "latitude", "longitude", "name", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *`,
      [
        params.customerId,
        params.firstName || null,
        params.lastName || null,
        params.company || null,
        params.addressLine1,
        params.addressLine2 || null,
        params.city,
        params.state || null,
        params.postalCode,
        params.country,
        params.phone || null,
        params.email || null,
        params.isDefault || false,
        params.isDefaultBilling || false,
        params.isDefaultShipping || false,
        params.addressType || 'both',
        params.isVerified || false,
        params.verifiedAt || null,
        params.verificationData ? JSON.stringify(params.verificationData) : null,
        params.additionalInfo || null,
        params.latitude || null,
        params.longitude || null,
        params.name || null,
        now,
        now,
      ],
    );

    if (!result) throw new Error('Failed to create customer address');
    return result;
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
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'verificationData' && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return address;

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<CustomerAddress>(
      `UPDATE "customerAddress" SET ${updateFields.join(', ')} WHERE "customerAddressId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  private async unsetDefaults(customerId: string, exceptId?: string): Promise<void> {
    let sql = `UPDATE "customerAddress" SET "isDefault" = false, "updatedAt" = $1 WHERE "customerId" = $2 AND "isDefault" = true`;
    const params: any[] = [unixTimestamp(), customerId];
    if (exceptId) {
      sql += ` AND "customerAddressId" != $3`;
      params.push(exceptId);
    }
    await query(sql, params);
  }

  private async unsetDefaultBilling(customerId: string, exceptId?: string): Promise<void> {
    let sql = `UPDATE "customerAddress" SET "isDefaultBilling" = false, "updatedAt" = $1 WHERE "customerId" = $2 AND "isDefaultBilling" = true`;
    const params: any[] = [unixTimestamp(), customerId];
    if (exceptId) {
      sql += ` AND "customerAddressId" != $3`;
      params.push(exceptId);
    }
    await query(sql, params);
  }

  private async unsetDefaultShipping(customerId: string, exceptId?: string): Promise<void> {
    let sql = `UPDATE "customerAddress" SET "isDefaultShipping" = false, "updatedAt" = $1 WHERE "customerId" = $2 AND "isDefaultShipping" = true`;
    const params: any[] = [unixTimestamp(), customerId];
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
    const params: any[] = [];
    if (customerId) {
      sql += ` WHERE "customerId" = $1`;
      params.push(customerId);
    }
    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new CustomerAddressRepo();
