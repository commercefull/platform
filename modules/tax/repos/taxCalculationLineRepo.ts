/**
 * Tax Calculation Line Repository
 * CRUD operations for tax calculation line items
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

const TABLE = Table.TaxCalculationLine;

export interface TaxCalculationLine {
  taxCalculationLineId: string;
  createdAt: string;
  updatedAt: string;
  calculationId: string;
  lineItemId?: string;
  lineItemType: string;
  productId?: string;
  productVariantId?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxExemptAmount: number;
  taxCategoryId?: string;
  taxCategoryCode?: string;
}

export type TaxCalculationLineCreateParams = Omit<TaxCalculationLine, 'taxCalculationLineId' | 'createdAt' | 'updatedAt'>;
export type TaxCalculationLineUpdateParams = Partial<Omit<TaxCalculationLine, 'taxCalculationLineId' | 'calculationId' | 'createdAt' | 'updatedAt'>>;

export class TaxCalculationLineRepo {
  async findById(id: string): Promise<TaxCalculationLine | null> {
    return await queryOne<TaxCalculationLine>(`SELECT * FROM "taxCalculationLine" WHERE "taxCalculationLineId" = $1`, [id]);
  }

  async findByCalculation(calculationId: string): Promise<TaxCalculationLine[]> {
    return (await query<TaxCalculationLine[]>(
      `SELECT * FROM "taxCalculationLine" WHERE "calculationId" = $1 ORDER BY "createdAt" ASC`,
      [calculationId]
    )) || [];
  }

  async findByLineItem(lineItemId: string): Promise<TaxCalculationLine[]> {
    return (await query<TaxCalculationLine[]>(
      `SELECT * FROM "taxCalculationLine" WHERE "lineItemId" = $1 ORDER BY "createdAt" DESC`,
      [lineItemId]
    )) || [];
  }

  async create(params: TaxCalculationLineCreateParams): Promise<TaxCalculationLine> {
    const now = unixTimestamp();
    const result = await queryOne<TaxCalculationLine>(
      `INSERT INTO "taxCalculationLine" (
        "calculationId", "lineItemId", "lineItemType", "productId", "productVariantId", "sku",
        "name", "quantity", "unitPrice", "lineTotal", "discountAmount", "taxableAmount",
        "taxExemptAmount", "taxCategoryId", "taxCategoryCode", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        params.calculationId, params.lineItemId || null, params.lineItemType, params.productId || null,
        params.productVariantId || null, params.sku || null, params.name, params.quantity || 1,
        params.unitPrice, params.lineTotal, params.discountAmount || 0, params.taxableAmount,
        params.taxExemptAmount || 0, params.taxCategoryId || null, params.taxCategoryCode || null, now, now
      ]
    );
    if (!result) throw new Error('Failed to create tax calculation line');
    return result;
  }

  async update(id: string, params: TaxCalculationLineUpdateParams): Promise<TaxCalculationLine | null> {
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

    return await queryOne<TaxCalculationLine>(
      `UPDATE "taxCalculationLine" SET ${updateFields.join(', ')} WHERE "taxCalculationLineId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ taxCalculationLineId: string }>(
      `DELETE FROM "taxCalculationLine" WHERE "taxCalculationLineId" = $1 RETURNING "taxCalculationLineId"`,
      [id]
    );
    return !!result;
  }

  async deleteByCalculation(calculationId: string): Promise<number> {
    const results = await query<{ taxCalculationLineId: string }[]>(
      `DELETE FROM "taxCalculationLine" WHERE "calculationId" = $1 RETURNING "taxCalculationLineId"`,
      [calculationId]
    );
    return results ? results.length : 0;
  }

  async count(calculationId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "taxCalculationLine"`;
    const params: any[] = [];

    if (calculationId) {
      sql += ` WHERE "calculationId" = $1`;
      params.push(calculationId);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new TaxCalculationLineRepo();
