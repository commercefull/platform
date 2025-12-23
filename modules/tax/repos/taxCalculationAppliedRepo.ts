/**
 * Tax Calculation Applied Repository
 * CRUD operations for applied tax calculations
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

const TABLE = Table.TaxCalculationApplied;

export type TaxJurisdictionLevel = 'country' | 'state' | 'county' | 'city' | 'district' | 'special';

export interface TaxCalculationApplied {
  taxCalculationAppliedId: string;
  createdAt: string;
  updatedAt: string;
  calculationId: string;
  calculationLineId?: string;
  taxRateId?: string;
  taxRateName: string;
  taxZoneId?: string;
  taxZoneName?: string;
  taxCategoryId?: string;
  taxCategoryName?: string;
  jurisdictionLevel: TaxJurisdictionLevel;
  jurisdictionName: string;
  rate: number;
  isCompound: boolean;
  taxableAmount: number;
  taxAmount: number;
}

export type TaxCalculationAppliedCreateParams = Omit<TaxCalculationApplied, 'taxCalculationAppliedId' | 'createdAt' | 'updatedAt'>;
export type TaxCalculationAppliedUpdateParams = Partial<
  Omit<TaxCalculationApplied, 'taxCalculationAppliedId' | 'calculationId' | 'createdAt' | 'updatedAt'>
>;

export class TaxCalculationAppliedRepo {
  async findById(id: string): Promise<TaxCalculationApplied | null> {
    return await queryOne<TaxCalculationApplied>(`SELECT * FROM "taxCalculationApplied" WHERE "taxCalculationAppliedId" = $1`, [id]);
  }

  async findByCalculation(calculationId: string): Promise<TaxCalculationApplied[]> {
    return (
      (await query<TaxCalculationApplied[]>(
        `SELECT * FROM "taxCalculationApplied" WHERE "calculationId" = $1 ORDER BY "jurisdictionLevel" ASC`,
        [calculationId],
      )) || []
    );
  }

  async findByCalculationLine(calculationLineId: string): Promise<TaxCalculationApplied[]> {
    return (
      (await query<TaxCalculationApplied[]>(
        `SELECT * FROM "taxCalculationApplied" WHERE "calculationLineId" = $1 ORDER BY "jurisdictionLevel" ASC`,
        [calculationLineId],
      )) || []
    );
  }

  async findByJurisdiction(calculationId: string, jurisdictionLevel: TaxJurisdictionLevel): Promise<TaxCalculationApplied[]> {
    return (
      (await query<TaxCalculationApplied[]>(
        `SELECT * FROM "taxCalculationApplied" WHERE "calculationId" = $1 AND "jurisdictionLevel" = $2`,
        [calculationId, jurisdictionLevel],
      )) || []
    );
  }

  async create(params: TaxCalculationAppliedCreateParams): Promise<TaxCalculationApplied> {
    const now = unixTimestamp();
    const result = await queryOne<TaxCalculationApplied>(
      `INSERT INTO "taxCalculationApplied" (
        "calculationId", "calculationLineId", "taxRateId", "taxRateName", "taxZoneId", "taxZoneName",
        "taxCategoryId", "taxCategoryName", "jurisdictionLevel", "jurisdictionName", "rate",
        "isCompound", "taxableAmount", "taxAmount", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        params.calculationId,
        params.calculationLineId || null,
        params.taxRateId || null,
        params.taxRateName,
        params.taxZoneId || null,
        params.taxZoneName || null,
        params.taxCategoryId || null,
        params.taxCategoryName || null,
        params.jurisdictionLevel,
        params.jurisdictionName,
        params.rate,
        params.isCompound || false,
        params.taxableAmount,
        params.taxAmount,
        now,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create tax calculation applied');
    return result;
  }

  async update(id: string, params: TaxCalculationAppliedUpdateParams): Promise<TaxCalculationApplied | null> {
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

    return await queryOne<TaxCalculationApplied>(
      `UPDATE "taxCalculationApplied" SET ${updateFields.join(', ')} WHERE "taxCalculationAppliedId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ taxCalculationAppliedId: string }>(
      `DELETE FROM "taxCalculationApplied" WHERE "taxCalculationAppliedId" = $1 RETURNING "taxCalculationAppliedId"`,
      [id],
    );
    return !!result;
  }

  async deleteByCalculation(calculationId: string): Promise<number> {
    const results = await query<{ taxCalculationAppliedId: string }[]>(
      `DELETE FROM "taxCalculationApplied" WHERE "calculationId" = $1 RETURNING "taxCalculationAppliedId"`,
      [calculationId],
    );
    return results ? results.length : 0;
  }

  async getTotalTaxAmount(calculationId: string): Promise<number> {
    const result = await queryOne<{ total: string }>(
      `SELECT SUM("taxAmount") as total FROM "taxCalculationApplied" WHERE "calculationId" = $1`,
      [calculationId],
    );
    return result ? parseFloat(result.total) || 0 : 0;
  }

  async count(calculationId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "taxCalculationApplied"`;
    const params: any[] = [];

    if (calculationId) {
      sql += ` WHERE "calculationId" = $1`;
      params.push(calculationId);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new TaxCalculationAppliedRepo();
