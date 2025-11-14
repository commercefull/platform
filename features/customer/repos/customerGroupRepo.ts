import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export interface CustomerGroup {
  customerGroupId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  name: string;
  description?: string;
  code: string;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
  discountPercent: number;
  createdBy?: string;
}

export type CustomerGroupCreateParams = Omit<CustomerGroup, 'customerGroupId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type CustomerGroupUpdateParams = Partial<Omit<CustomerGroup, 'customerGroupId' | 'code' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export class CustomerGroupRepo {
  async findById(id: string): Promise<CustomerGroup | null> {
    return await queryOne<CustomerGroup>(
      `SELECT * FROM "customerGroup" WHERE "customerGroupId" = $1 AND "deletedAt" IS NULL`,
      [id]
    );
  }

  async findByCode(code: string): Promise<CustomerGroup | null> {
    return await queryOne<CustomerGroup>(
      `SELECT * FROM "customerGroup" WHERE "code" = $1 AND "deletedAt" IS NULL`,
      [code]
    );
  }

  async findAll(activeOnly = false): Promise<CustomerGroup[]> {
    let sql = `SELECT * FROM "customerGroup" WHERE "deletedAt" IS NULL`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "sortOrder" ASC, "name" ASC`;
    return (await query<CustomerGroup[]>(sql)) || [];
  }

  async findSystemGroups(): Promise<CustomerGroup[]> {
    return (await query<CustomerGroup[]>(
      `SELECT * FROM "customerGroup" WHERE "isSystem" = true AND "deletedAt" IS NULL ORDER BY "sortOrder" ASC`
    )) || [];
  }

  async create(params: CustomerGroupCreateParams): Promise<CustomerGroup> {
    const now = unixTimestamp();
    const existing = await this.findByCode(params.code);
    if (existing) throw new Error(`Customer group with code '${params.code}' already exists`);

    const result = await queryOne<CustomerGroup>(
      `INSERT INTO "customerGroup" (
        "name", "description", "code", "isActive", "isSystem", "sortOrder", "discountPercent",
        "createdBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        params.name, params.description || null, params.code, params.isActive ?? true,
        params.isSystem || false, params.sortOrder || 0, params.discountPercent || 0,
        params.createdBy || null, now, now
      ]
    );

    if (!result) throw new Error('Failed to create customer group');
    return result;
  }

  async update(id: string, params: CustomerGroupUpdateParams): Promise<CustomerGroup | null> {
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

    return await queryOne<CustomerGroup>(
      `UPDATE "customerGroup" SET ${updateFields.join(', ')} WHERE "customerGroupId" = $${paramIndex} AND "deletedAt" IS NULL RETURNING *`,
      values
    );
  }

  async activate(id: string): Promise<CustomerGroup | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<CustomerGroup | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ customerGroupId: string }>(
      `UPDATE "customerGroup" SET "deletedAt" = $1 WHERE "customerGroupId" = $2 AND "deletedAt" IS NULL RETURNING "customerGroupId"`,
      [unixTimestamp(), id]
    );
    return !!result;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await queryOne<{ customerGroupId: string }>(
      `DELETE FROM "customerGroup" WHERE "customerGroupId" = $1 RETURNING "customerGroupId"`,
      [id]
    );
    return !!result;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "customerGroup" WHERE "deletedAt" IS NULL`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }

  async getStatistics(): Promise<{ total: number; active: number; system: number; avgDiscount: number }> {
    const total = await this.count();
    const active = await this.count(true);

    const systemResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "customerGroup" WHERE "isSystem" = true AND "deletedAt" IS NULL`
    );
    const system = systemResult ? parseInt(systemResult.count, 10) : 0;

    const avgResult = await queryOne<{ avg: string }>(
      `SELECT AVG("discountPercent") as avg FROM "customerGroup" WHERE "deletedAt" IS NULL`
    );
    const avgDiscount = avgResult && avgResult.avg ? parseFloat(avgResult.avg) : 0;

    return { total, active, system, avgDiscount: Math.round(avgDiscount * 100) / 100 };
  }
}

export default new CustomerGroupRepo();
