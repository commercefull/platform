/**
 * Tax Nexus Repository
 * CRUD operations for tax nexus locations
 */

import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';


export interface TaxNexus {
  taxNexusId: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  name: string;
  country: string;
  region?: string;
  regionCode?: string;
  city?: string;
  postalCode?: string;
  streetAddress?: string;
  taxId?: string;
  registrationNumber?: string;
  isDefault: boolean;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
}

export type TaxNexusCreateParams = Omit<TaxNexus, 'taxNexusId' | 'createdAt' | 'updatedAt'>;
export type TaxNexusUpdateParams = Partial<Omit<TaxNexus, 'taxNexusId' | 'organizationId' | 'createdAt' | 'updatedAt'>>;

export class TaxNexusRepo {
  async findById(id: string): Promise<TaxNexus | null> {
    return await queryOne<TaxNexus>(`SELECT * FROM "taxNexus" WHERE "taxNexusId" = $1`, [id]);
  }

  async findByMerchant(organizationId: string, activeOnly = false): Promise<TaxNexus[]> {
    let sql = `SELECT * FROM "taxNexus" WHERE "organizationId" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true AND "startDate" <= $2 AND ("endDate" IS NULL OR "endDate" >= $2)`;
    sql += ` ORDER BY "isDefault" DESC, "name" ASC`;
    const params = activeOnly ? [organizationId, unixTimestamp()] : [organizationId];
    return (await query<TaxNexus[]>(sql, params)) || [];
  }

  async findByCountry(organizationId: string, country: string, activeOnly = false): Promise<TaxNexus[]> {
    let sql = `SELECT * FROM "taxNexus" WHERE "organizationId" = $1 AND "country" = $2`;
    if (activeOnly) sql += ` AND "isActive" = true AND "startDate" <= $3 AND ("endDate" IS NULL OR "endDate" >= $3)`;
    sql += ` ORDER BY "name" ASC`;
    const params = activeOnly ? [organizationId, country, unixTimestamp()] : [organizationId, country];
    return (await query<TaxNexus[]>(sql, params)) || [];
  }

  async findDefault(organizationId: string): Promise<TaxNexus | null> {
    return await queryOne<TaxNexus>(
      `SELECT * FROM "taxNexus" WHERE "organizationId" = $1 AND "isDefault" = true AND "isActive" = true LIMIT 1`,
      [organizationId],
    );
  }

  async create(params: TaxNexusCreateParams): Promise<TaxNexus> {
    const now = unixTimestamp();

    if (params.isDefault) {
      await query(`UPDATE "taxNexus" SET "isDefault" = false, "updatedAt" = $1 WHERE "organizationId" = $2 AND "isDefault" = true`, [
        now,
        params.organizationId,
      ]);
    }

    const result = await queryOne<TaxNexus>(
      `INSERT INTO "taxNexus" (
        "organizationId", "name", "country", "region", "regionCode", "city", "postalCode",
        "streetAddress", "taxId", "registrationNumber", "isDefault", "startDate", 
        "endDate", "isActive", "notes", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        params.organizationId,
        params.name,
        params.country,
        params.region || null,
        params.regionCode || null,
        params.city || null,
        params.postalCode || null,
        params.streetAddress || null,
        params.taxId || null,
        params.registrationNumber || null,
        params.isDefault || false,
        params.startDate || now,
        params.endDate || null,
        params.isActive ?? true,
        params.notes || null,
        now,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create tax nexus');
    return result;
  }

  async update(id: string, params: TaxNexusUpdateParams): Promise<TaxNexus | null> {
    const nexus = await this.findById(id);
    if (!nexus) return null;

    if (params.isDefault === true) {
      await query(
        `UPDATE "taxNexus" SET "isDefault" = false, "updatedAt" = $1 WHERE "organizationId" = $2 AND "isDefault" = true AND "taxNexusId" != $3`,
        [unixTimestamp(), nexus.organizationId, id],
      );
    }

    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return nexus;

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<TaxNexus>(
      `UPDATE "taxNexus" SET ${updateFields.join(', ')} WHERE "taxNexusId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  async activate(id: string): Promise<TaxNexus | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<TaxNexus | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ taxNexusId: string }>(`DELETE FROM "taxNexus" WHERE "taxNexusId" = $1 RETURNING "taxNexusId"`, [id]);
    return !!result;
  }

  async count(organizationId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "taxNexus"`;
    const params: unknown[] = [];

    if (organizationId) {
      sql += ` WHERE "organizationId" = $1`;
      params.push(organizationId);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new TaxNexusRepo();
