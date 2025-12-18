import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

// Import types from generated DB types - single source of truth
import { CustomerGroupMembership as DbCustomerGroupMembership } from '../../../libs/db/types';

// Re-export DB type
export type CustomerGroupMembership = DbCustomerGroupMembership;

// Derived types for create/update operations
export type CustomerGroupMembershipCreateParams = Omit<CustomerGroupMembership, 'customerGroupMembershipId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type CustomerGroupMembershipUpdateParams = Partial<Pick<CustomerGroupMembership, 'isActive' | 'expiresAt'>>;

export class CustomerGroupMembershipRepo {
  async findById(id: string): Promise<CustomerGroupMembership | null> {
    return await queryOne<CustomerGroupMembership>(
      `SELECT * FROM "customerGroupMembership" WHERE "customerGroupMembershipId" = $1 AND "deletedAt" IS NULL`,
      [id]
    );
  }

  async findByCustomerId(customerId: string, activeOnly = false): Promise<CustomerGroupMembership[]> {
    let sql = `SELECT * FROM "customerGroupMembership" WHERE "customerId" = $1 AND "deletedAt" IS NULL`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "createdAt" DESC`;
    return (await query<CustomerGroupMembership[]>(sql, [customerId])) || [];
  }

  async findByGroupId(customerGroupId: string, activeOnly = false): Promise<CustomerGroupMembership[]> {
    let sql = `SELECT * FROM "customerGroupMembership" WHERE "customerGroupId" = $1 AND "deletedAt" IS NULL`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "createdAt" DESC`;
    return (await query<CustomerGroupMembership[]>(sql, [customerGroupId])) || [];
  }

  async findByCustomerAndGroup(customerId: string, customerGroupId: string): Promise<CustomerGroupMembership | null> {
    return await queryOne<CustomerGroupMembership>(
      `SELECT * FROM "customerGroupMembership" WHERE "customerId" = $1 AND "customerGroupId" = $2 AND "deletedAt" IS NULL`,
      [customerId, customerGroupId]
    );
  }

  async isCustomerInGroup(customerId: string, customerGroupId: string): Promise<boolean> {
    const membership = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "customerGroupMembership" 
       WHERE "customerId" = $1 AND "customerGroupId" = $2 AND "isActive" = true AND "deletedAt" IS NULL 
       AND ("expiresAt" IS NULL OR "expiresAt" > $3)`,
      [customerId, customerGroupId, unixTimestamp()]
    );
    return membership ? parseInt(membership.count, 10) > 0 : false;
  }

  async create(params: CustomerGroupMembershipCreateParams): Promise<CustomerGroupMembership> {
    const now = unixTimestamp();

    // Check if already exists
    const existing = await this.findByCustomerAndGroup(params.customerId, params.customerGroupId);
    if (existing) {
      throw new Error('Customer is already a member of this group');
    }

    const result = await queryOne<CustomerGroupMembership>(
      `INSERT INTO "customerGroupMembership" (
        "customerId", "customerGroupId", "isActive", "expiresAt", "addedBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        params.customerId, params.customerGroupId, params.isActive ?? true,
        params.expiresAt || null, params.addedBy || null, now, now
      ]
    );

    if (!result) throw new Error('Failed to create customer group membership');
    return result;
  }

  async update(id: string, params: CustomerGroupMembershipUpdateParams): Promise<CustomerGroupMembership | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<CustomerGroupMembership>(
      `UPDATE "customerGroupMembership" SET ${updateFields.join(', ')} 
       WHERE "customerGroupMembershipId" = $${paramIndex} AND "deletedAt" IS NULL RETURNING *`,
      values
    );
  }

  async activate(id: string): Promise<CustomerGroupMembership | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<CustomerGroupMembership | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ customerGroupMembershipId: string }>(
      `UPDATE "customerGroupMembership" SET "deletedAt" = $1 WHERE "customerGroupMembershipId" = $2 AND "deletedAt" IS NULL RETURNING "customerGroupMembershipId"`,
      [unixTimestamp(), id]
    );
    return !!result;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await queryOne<{ customerGroupMembershipId: string }>(
      `DELETE FROM "customerGroupMembership" WHERE "customerGroupMembershipId" = $1 RETURNING "customerGroupMembershipId"`,
      [id]
    );
    return !!result;
  }

  async expireOldMemberships(): Promise<number> {
    const now = unixTimestamp();
    const results = await query<{ customerGroupMembershipId: string }[]>(
      `UPDATE "customerGroupMembership" SET "isActive" = false, "updatedAt" = $1 
       WHERE "expiresAt" IS NOT NULL AND "expiresAt" < $1 AND "isActive" = true AND "deletedAt" IS NULL 
       RETURNING "customerGroupMembershipId"`,
      [now]
    );
    return results ? results.length : 0;
  }

  async count(customerGroupId?: string, activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "customerGroupMembership" WHERE "deletedAt" IS NULL`;
    const params: any[] = [];

    if (customerGroupId) {
      sql += ` AND "customerGroupId" = $${params.length + 1}`;
      params.push(customerGroupId);
    }
    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new CustomerGroupMembershipRepo();
