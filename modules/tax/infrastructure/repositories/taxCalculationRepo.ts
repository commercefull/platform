/**
 * Tax Calculation Repository
 * CRUD operations for tax calculations
 */

import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import { FailedToCreateTaxError } from '../../domain/errors/TaxErrors';
import type { TaxCalculation as DbTaxCalculation } from '../../../../libs/db/types';

type TaxCalculationStatus = 'pending' | 'completed' | 'failed';
type TaxCalculationSourceType = 'order' | 'invoice' | 'basket';

type TaxCalculation = DbTaxCalculation;

type TaxCalculationCreateParams = Omit<TaxCalculation, 'taxCalculationId' | 'createdAt' | 'updatedAt'>;
type TaxCalculationUpdateParams = Partial<Omit<TaxCalculation, 'taxCalculationId' | 'organizationId' | 'createdAt' | 'updatedAt'>>;

// `||`-style defaulting kept out of the create params to keep complexity low.
function fallback<T, D>(value: T | undefined | null, defaultValue: D): T | D {
  return value || defaultValue;
}

function taxCalculationInsertValues(params: TaxCalculationCreateParams, now: string): unknown[] {
  return [
    params.organizationId,
    fallback(params.orderId, null),
    fallback(params.invoiceId, null),
    fallback(params.basketId, null),
    fallback(params.customerId, null),
    fallback(params.calculationMethod, 'unitBased'),
    fallback(params.status, 'pending'),
    params.sourceType,
    fallback(params.sourceId, null),
    JSON.stringify(params.taxAddress || {}),
    fallback(params.taxableAmountCents, 0),
    fallback(params.taxExemptAmountCents, 0),
    fallback(params.taxAmountCents, 0),
    fallback(params.totalAmountCents, 0),
    fallback(params.currencyCode, 'USD'),
    fallback(params.exchangeRate, 1.0),
    JSON.stringify(params.taxProviderResponse || {}),
    fallback(params.taxProviderReference, null),
    fallback(params.errorMessage, null),
    now,
    now,
  ];
}

class TaxCalculationRepo {
  async findById(id: string): Promise<TaxCalculation | null> {
    return await queryOne<DbTaxCalculation>(`SELECT * FROM "taxCalculation" WHERE "taxCalculationId" = $1`, [id]);
  }

  async findByOrder(orderId: string): Promise<TaxCalculation | null> {
    return await queryOne<DbTaxCalculation>(`SELECT * FROM "taxCalculation" WHERE "orderId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [
      orderId,
    ]);
  }

  async findByBasket(basketId: string): Promise<TaxCalculation | null> {
    return await queryOne<DbTaxCalculation>(`SELECT * FROM "taxCalculation" WHERE "basketId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [
      basketId,
    ]);
  }

  async findBySource(sourceType: TaxCalculationSourceType, sourceId: string): Promise<TaxCalculation[]> {
    return (
      (await query<DbTaxCalculation[]>(
        `SELECT * FROM "taxCalculation" WHERE "sourceType" = $1 AND "sourceId" = $2 ORDER BY "createdAt" DESC`,
        [sourceType, sourceId],
      )) || []
    );
  }

  async findByMerchant(organizationId: string, status?: TaxCalculationStatus, limit = 100): Promise<TaxCalculation[]> {
    let sql = `SELECT * FROM "taxCalculation" WHERE "organizationId" = $1`;
    const params: unknown[] = [organizationId];
    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }
    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    return (await query<DbTaxCalculation[]>(sql, params)) || [];
  }

  async create(params: TaxCalculationCreateParams): Promise<TaxCalculation> {
    const now = unixTimestamp();
    const result = await queryOne<DbTaxCalculation>(
      `INSERT INTO "taxCalculation" (
        "organizationId", "orderId", "invoiceId", "basketId", "customerId", "calculationMethod",
        "status", "sourceType", "sourceId", "taxAddress", "taxableAmountCents", "taxExemptAmountCents",
        "taxAmountCents", "totalAmountCents", "currencyCode", "exchangeRate", "taxProviderResponse",
        "taxProviderReference", "errorMessage", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
      taxCalculationInsertValues(params, now),
    );
    if (!result) throw new FailedToCreateTaxError('Failed to create tax calculation');
    return result;
  }

  async update(id: string, params: TaxCalculationUpdateParams): Promise<TaxCalculation | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
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

    return await queryOne<DbTaxCalculation>(
      `UPDATE "taxCalculation" SET ${updateFields.join(', ')} WHERE "taxCalculationId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  async markComplete(id: string, taxAmountCents: number, totalAmountCents: number): Promise<TaxCalculation | null> {
    return this.update(id, { status: 'completed', taxAmountCents, totalAmountCents });
  }

  async markFailed(id: string, errorMessage: string): Promise<TaxCalculation | null> {
    return this.update(id, { status: 'failed', errorMessage });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ taxCalculationId: string }>(
      `DELETE FROM "taxCalculation" WHERE "taxCalculationId" = $1 RETURNING "taxCalculationId"`,
      [id],
    );
    return !!result;
  }

  async count(organizationId?: string, status?: TaxCalculationStatus): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "taxCalculation" WHERE 1=1`;
    const params: unknown[] = [];

    if (organizationId) {
      sql += ` AND "organizationId" = $${params.length + 1}`;
      params.push(organizationId);
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
