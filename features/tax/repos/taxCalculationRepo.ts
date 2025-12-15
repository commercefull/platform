/**
 * Tax Calculation Repository
 * CRUD operations for tax calculations
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

const TABLE = Table.TaxCalculation;

export type TaxCalculationMethod = 'unitBased' | 'itemBased';
export type TaxCalculationStatus = 'pending' | 'completed' | 'failed';
export type TaxCalculationSourceType = 'order' | 'invoice' | 'basket';

export interface TaxCalculation {
  taxCalculationId: string;
  createdAt: string;
  updatedAt: string;
  merchantId: string;
  orderId?: string;
  invoiceId?: string;
  basketId?: string;
  customerId?: string;
  calculationMethod: TaxCalculationMethod;
  status: TaxCalculationStatus;
  sourceType: TaxCalculationSourceType;
  sourceId?: string;
  taxAddress?: any; // JSON
  taxableAmount: number;
  taxExemptAmount: number;
  taxAmount: number;
  totalAmount: number;
  currencyCode: string;
  exchangeRate: number;
  taxProviderResponse?: any; // JSON
  taxProviderReference?: string;
  errorMessage?: string;
}

export type TaxCalculationCreateParams = Omit<TaxCalculation, 'taxCalculationId' | 'createdAt' | 'updatedAt'>;
export type TaxCalculationUpdateParams = Partial<Omit<TaxCalculation, 'taxCalculationId' | 'merchantId' | 'createdAt' | 'updatedAt'>>;

export class TaxCalculationRepo {
  async findById(id: string): Promise<TaxCalculation | null> {
    return await queryOne<TaxCalculation>(`SELECT * FROM "taxCalculation" WHERE "taxCalculationId" = $1`, [id]);
  }

  async findByOrder(orderId: string): Promise<TaxCalculation | null> {
    return await queryOne<TaxCalculation>(`SELECT * FROM "taxCalculation" WHERE "orderId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [orderId]);
  }

  async findByBasket(basketId: string): Promise<TaxCalculation | null> {
    return await queryOne<TaxCalculation>(`SELECT * FROM "taxCalculation" WHERE "basketId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [basketId]);
  }

  async findBySource(sourceType: TaxCalculationSourceType, sourceId: string): Promise<TaxCalculation[]> {
    return (await query<TaxCalculation[]>(
      `SELECT * FROM "taxCalculation" WHERE "sourceType" = $1 AND "sourceId" = $2 ORDER BY "createdAt" DESC`,
      [sourceType, sourceId]
    )) || [];
  }

  async findByMerchant(merchantId: string, status?: TaxCalculationStatus, limit = 100): Promise<TaxCalculation[]> {
    let sql = `SELECT * FROM "taxCalculation" WHERE "merchantId" = $1`;
    const params: any[] = [merchantId];
    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }
    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    return (await query<TaxCalculation[]>(sql, params)) || [];
  }

  async create(params: TaxCalculationCreateParams): Promise<TaxCalculation> {
    const now = unixTimestamp();
    const result = await queryOne<TaxCalculation>(
      `INSERT INTO "taxCalculation" (
        "merchantId", "orderId", "invoiceId", "basketId", "customerId", "calculationMethod",
        "status", "sourceType", "sourceId", "taxAddress", "taxableAmount", "taxExemptAmount",
        "taxAmount", "totalAmount", "currencyCode", "exchangeRate", "taxProviderResponse",
        "taxProviderReference", "errorMessage", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
      [
        params.merchantId, params.orderId || null, params.invoiceId || null, params.basketId || null,
        params.customerId || null, params.calculationMethod || 'unitBased', params.status || 'pending',
        params.sourceType, params.sourceId || null, JSON.stringify(params.taxAddress || {}),
        params.taxableAmount || 0, params.taxExemptAmount || 0, params.taxAmount || 0,
        params.totalAmount || 0, params.currencyCode || 'USD', params.exchangeRate || 1.0,
        JSON.stringify(params.taxProviderResponse || {}), params.taxProviderReference || null,
        params.errorMessage || null, now, now
      ]
    );
    if (!result) throw new Error('Failed to create tax calculation');
    return result;
  }

  async update(id: string, params: TaxCalculationUpdateParams): Promise<TaxCalculation | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        if (['taxAddress', 'taxProviderResponse'].includes(key)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<TaxCalculation>(
      `UPDATE "taxCalculation" SET ${updateFields.join(', ')} WHERE "taxCalculationId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async markComplete(id: string, taxAmount: number, totalAmount: number): Promise<TaxCalculation | null> {
    return this.update(id, { status: 'completed', taxAmount, totalAmount });
  }

  async markFailed(id: string, errorMessage: string): Promise<TaxCalculation | null> {
    return this.update(id, { status: 'failed', errorMessage });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ taxCalculationId: string }>(
      `DELETE FROM "taxCalculation" WHERE "taxCalculationId" = $1 RETURNING "taxCalculationId"`,
      [id]
    );
    return !!result;
  }

  async count(merchantId?: string, status?: TaxCalculationStatus): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "taxCalculation" WHERE 1=1`;
    const params: any[] = [];

    if (merchantId) {
      sql += ` AND "merchantId" = $${params.length + 1}`;
      params.push(merchantId);
    }
    if (status) {
      sql += ` AND "status" = $${params.length + 1}`;
      params.push(status);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new TaxCalculationRepo();
