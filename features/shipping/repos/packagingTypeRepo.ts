import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export interface PackagingType {
  packagingTypeId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  weight: number;
  length: number;
  width: number;
  height: number;
  volume: number;
  maxWeight?: number;
  maxItems?: number;
  cost?: number;
  currency: string;
  recyclable: boolean;
  imageUrl?: string;
  validCarriers?: string[];
  createdBy?: string;
}

export type PackagingTypeCreateParams = Omit<PackagingType, 'packagingTypeId' | 'createdAt' | 'updatedAt'>;
export type PackagingTypeUpdateParams = Partial<Omit<PackagingType, 'packagingTypeId' | 'createdAt' | 'updatedAt'>>;

export class PackagingTypeRepo {
  async findById(id: string): Promise<PackagingType | null> {
    return await queryOne<PackagingType>(`SELECT * FROM "packagingType" WHERE "packagingTypeId" = $1`, [id]);
  }

  async findByCode(code: string): Promise<PackagingType | null> {
    return await queryOne<PackagingType>(`SELECT * FROM "packagingType" WHERE "code" = $1`, [code]);
  }

  async findAll(activeOnly = false): Promise<PackagingType[]> {
    let sql = `SELECT * FROM "packagingType"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    sql += ` ORDER BY "volume" ASC`;
    return (await query<PackagingType[]>(sql)) || [];
  }

  async findDefault(): Promise<PackagingType | null> {
    return await queryOne<PackagingType>(
      `SELECT * FROM "packagingType" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`
    );
  }

  async create(params: PackagingTypeCreateParams): Promise<PackagingType> {
    const now = unixTimestamp();

    if (params.isDefault) {
      await query(`UPDATE "packagingType" SET "isDefault" = false, "updatedAt" = $1 WHERE "isDefault" = true`, [now]);
    }

    const result = await queryOne<PackagingType>(
      `INSERT INTO "packagingType" (
        "name", "code", "description", "isActive", "isDefault", "weight", "length", "width",
        "height", "volume", "maxWeight", "maxItems", "cost", "currency", "recyclable",
        "imageUrl", "validCarriers", "createdBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
      [
        params.name, params.code, params.description || null, params.isActive ?? true, params.isDefault || false,
        params.weight || 0, params.length, params.width, params.height, params.volume, params.maxWeight || null,
        params.maxItems || null, params.cost || null, params.currency || 'USD', params.recyclable || false,
        params.imageUrl || null, params.validCarriers || null, params.createdBy || null, now, now
      ]
    );
    if (!result) throw new Error('Failed to create packaging type');
    return result;
  }

  async update(id: string, params: PackagingTypeUpdateParams): Promise<PackagingType | null> {
    if (params.isDefault === true) {
      await query(
        `UPDATE "packagingType" SET "isDefault" = false, "updatedAt" = $1 WHERE "isDefault" = true AND "packagingTypeId" != $2`,
        [unixTimestamp(), id]
      );
    }

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

    return await queryOne<PackagingType>(
      `UPDATE "packagingType" SET ${updateFields.join(', ')} WHERE "packagingTypeId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ packagingTypeId: string }>(
      `DELETE FROM "packagingType" WHERE "packagingTypeId" = $1 RETURNING "packagingTypeId"`,
      [id]
    );
    return !!result;
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "packagingType"`);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new PackagingTypeRepo();
