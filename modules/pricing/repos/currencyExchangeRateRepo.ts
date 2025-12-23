import { query, queryOne } from '../../../libs/db';
import { Table, CurrencyExchangeRate } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

export type CurrencyExchangeRateCreateParams = Omit<CurrencyExchangeRate, 
  'currencyExchangeRateId' | 'createdAt' | 'updatedAt' | 'inverseRate' | 'lastUpdated'
>;

export type CurrencyExchangeRateUpdateParams = Partial<Pick<CurrencyExchangeRate,
  'rate' | 'provider' | 'providerReference' | 'effectiveFrom' | 'effectiveTo' | 'isActive' | 'updatedBy'
>>;

export class CurrencyExchangeRateRepo {
  /**
   * Find exchange rate by ID
   */
  async findById(currencyExchangeRateId: string): Promise<CurrencyExchangeRate | null> {
    return await queryOne<CurrencyExchangeRate>(
      `SELECT * FROM "${Table.CurrencyExchangeRate}" WHERE "currencyExchangeRateId" = $1`,
      [currencyExchangeRateId]
    );
  }

  /**
   * Find current rate between two currencies
   */
  async findCurrentRate(sourceCurrencyId: string, targetCurrencyId: string): Promise<CurrencyExchangeRate | null> {
    const now = unixTimestamp();
    
    return await queryOne<CurrencyExchangeRate>(
      `SELECT * FROM "${Table.CurrencyExchangeRate}" 
       WHERE "sourceCurrencyId" = $1 
       AND "targetCurrencyId" = $2 
       AND "isActive" = true
       AND "effectiveFrom" <= $3
       AND ("effectiveTo" IS NULL OR "effectiveTo" >= $3)
       ORDER BY "effectiveFrom" DESC
       LIMIT 1`,
      [sourceCurrencyId, targetCurrencyId, now]
    );
  }

  /**
   * Find all rates for source currency
   */
  async findBySourceCurrency(sourceCurrencyId: string, activeOnly: boolean = true): Promise<CurrencyExchangeRate[]> {
    let sql = `SELECT * FROM "${Table.CurrencyExchangeRate}" WHERE "sourceCurrencyId" = $1`;
    const params: any[] = [sourceCurrencyId];
    
    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }
    
    sql += ` ORDER BY "targetCurrencyId" ASC, "effectiveFrom" DESC`;
    
    const results = await query<CurrencyExchangeRate[]>(sql, params);
    return results || [];
  }

  /**
   * Find all rates for target currency
   */
  async findByTargetCurrency(targetCurrencyId: string, activeOnly: boolean = true): Promise<CurrencyExchangeRate[]> {
    let sql = `SELECT * FROM "${Table.CurrencyExchangeRate}" WHERE "targetCurrencyId" = $1`;
    const params: any[] = [targetCurrencyId];
    
    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }
    
    sql += ` ORDER BY "sourceCurrencyId" ASC, "effectiveFrom" DESC`;
    
    const results = await query<CurrencyExchangeRate[]>(sql, params);
    return results || [];
  }

  /**
   * Find rates by provider
   */
  async findByProvider(provider: string, activeOnly: boolean = true): Promise<CurrencyExchangeRate[]> {
    let sql = `SELECT * FROM "${Table.CurrencyExchangeRate}" WHERE "provider" = $1`;
    const params: any[] = [provider];
    
    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }
    
    sql += ` ORDER BY "lastUpdated" DESC`;
    
    const results = await query<CurrencyExchangeRate[]>(sql, params);
    return results || [];
  }

  /**
   * Find expired rates
   */
  async findExpired(): Promise<CurrencyExchangeRate[]> {
    const now = unixTimestamp();
    
    const results = await query<CurrencyExchangeRate[]>(
      `SELECT * FROM "${Table.CurrencyExchangeRate}" 
       WHERE "effectiveTo" IS NOT NULL 
       AND "effectiveTo" < $1
       AND "isActive" = true
       ORDER BY "effectiveTo" ASC`,
      [now]
    );
    return results || [];
  }

  /**
   * Find rates effective at specific date
   */
  async findEffectiveAt(effectiveDate: string): Promise<CurrencyExchangeRate[]> {
    const results = await query<CurrencyExchangeRate[]>(
      `SELECT * FROM "${Table.CurrencyExchangeRate}" 
       WHERE "effectiveFrom" <= $1
       AND ("effectiveTo" IS NULL OR "effectiveTo" >= $1)
       AND "isActive" = true
       ORDER BY "sourceCurrencyId", "targetCurrencyId"`,
      [effectiveDate]
    );
    return results || [];
  }

  /**
   * Create exchange rate
   */
  async create(params: CurrencyExchangeRateCreateParams): Promise<CurrencyExchangeRate> {
    const now = unixTimestamp();

    // Prevent same currency exchange
    if (params.sourceCurrencyId === params.targetCurrencyId) {
      throw new Error('Source and target currencies must be different');
    }

    // Calculate inverse rate - convert string to number for calculation
    const rateNum = typeof params.rate === 'string' ? parseFloat(params.rate) : params.rate;
    const inverseRate = (1 / rateNum).toString();

    const result = await queryOne<CurrencyExchangeRate>(
      `INSERT INTO "${Table.CurrencyExchangeRate}" (
        "sourceCurrencyId", "targetCurrencyId", "rate", "inverseRate",
        "provider", "providerReference", "effectiveFrom", "effectiveTo",
        "isActive", "lastUpdated", "updatedBy",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        params.sourceCurrencyId,
        params.targetCurrencyId,
        params.rate,
        inverseRate,
        params.provider || 'manual',
        params.providerReference || null,
        params.effectiveFrom || now,
        params.effectiveTo || null,
        params.isActive !== undefined ? params.isActive : true,
        now,
        params.updatedBy || null,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create currency exchange rate');
    }

    return result;
  }

  /**
   * Update exchange rate
   */
  async update(currencyExchangeRateId: string, params: CurrencyExchangeRateUpdateParams): Promise<CurrencyExchangeRate | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // If rate is updated, calculate inverse rate
    if (params.rate !== undefined) {
      updateFields.push(`"rate" = $${paramIndex++}`, `"inverseRate" = $${paramIndex++}`);
      const rateNum = typeof params.rate === 'string' ? parseFloat(params.rate) : Number(params.rate);
      values.push(params.rate, (1 / rateNum).toString());
      
      // Remove rate from params since we handled it
      const { rate, ...otherParams } = params;
      params = otherParams as CurrencyExchangeRateUpdateParams;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(currencyExchangeRateId);
    }

    updateFields.push(`"lastUpdated" = $${paramIndex++}`, `"updatedAt" = $${paramIndex++}`);
    const now = unixTimestamp();
    values.push(now, now);
    values.push(currencyExchangeRateId);

    const result = await queryOne<CurrencyExchangeRate>(
      `UPDATE "${Table.CurrencyExchangeRate}" 
       SET ${updateFields.join(', ')}
       WHERE "currencyExchangeRateId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Update rate value
   */
  async updateRate(currencyExchangeRateId: string, newRate: number, updatedBy?: string): Promise<CurrencyExchangeRate | null> {
    return this.update(currencyExchangeRateId, { 
      rate: newRate.toString(),
      updatedBy: updatedBy ?? null
    });
  }

  /**
   * Activate exchange rate
   */
  async activate(currencyExchangeRateId: string): Promise<CurrencyExchangeRate | null> {
    return this.update(currencyExchangeRateId, { isActive: true });
  }

  /**
   * Deactivate exchange rate
   */
  async deactivate(currencyExchangeRateId: string): Promise<CurrencyExchangeRate | null> {
    return this.update(currencyExchangeRateId, { isActive: false });
  }

  /**
   * Expire rate (set effectiveTo to now)
   */
  async expire(currencyExchangeRateId: string): Promise<CurrencyExchangeRate | null> {
    return this.update(currencyExchangeRateId, { 
      effectiveTo: new Date(),
      isActive: false 
    });
  }

  /**
   * Delete exchange rate
   */
  async delete(currencyExchangeRateId: string): Promise<boolean> {
    const result = await queryOne<{ currencyExchangeRateId: string }>(
      `DELETE FROM "${Table.CurrencyExchangeRate}" WHERE "currencyExchangeRateId" = $1 RETURNING "currencyExchangeRateId"`,
      [currencyExchangeRateId]
    );

    return !!result;
  }

  /**
   * Convert amount between currencies
   */
  async convertAmount(
    amount: number,
    sourceCurrencyId: string,
    targetCurrencyId: string
  ): Promise<{ convertedAmount: number; rate: number; rateId: string } | null> {
    // If same currency, return as-is
    if (sourceCurrencyId === targetCurrencyId) {
      return {
        convertedAmount: amount,
        rate: 1,
        rateId: 'same-currency'
      };
    }

    const rate = await this.findCurrentRate(sourceCurrencyId, targetCurrencyId);
    
    if (!rate) {
      return null;
    }

    const rateNum = parseFloat(rate.rate);
    return {
      convertedAmount: amount * rateNum,
      rate: rateNum,
      rateId: rate.currencyExchangeRateId
    };
  }

  /**
   * Bulk create/update rates from provider
   */
  async bulkUpsertFromProvider(
    rates: Array<{
      sourceCurrencyId: string;
      targetCurrencyId: string;
      rate: number;
    }>,
    provider: string,
    providerReference?: string
  ): Promise<CurrencyExchangeRate[]> {
    const now = unixTimestamp();
    const created: CurrencyExchangeRate[] = [];

    for (const rateData of rates) {
      // Check if current rate exists
      const existing = await this.findCurrentRate(rateData.sourceCurrencyId, rateData.targetCurrencyId);

      if (existing) {
        // Update if rate changed
        const existingRateNum = parseFloat(existing.rate);
        if (Math.abs(existingRateNum - rateData.rate) > 0.0001) {
          const updated = await this.update(existing.currencyExchangeRateId, {
            rate: rateData.rate.toString(),
            provider,
            providerReference: providerReference ?? null
          });
          if (updated) created.push(updated);
        } else {
          created.push(existing);
        }
      } else {
        // Create new rate
        const newRate = await this.create({
          sourceCurrencyId: rateData.sourceCurrencyId,
          targetCurrencyId: rateData.targetCurrencyId,
          rate: rateData.rate.toString(),
          provider,
          providerReference: providerReference ?? null,
          effectiveFrom: new Date(),
          effectiveTo: null,
          isActive: true,
          updatedBy: null
        });
        created.push(newRate);
      }
    }

    return created;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    byProvider: Record<string, number>;
    expired: number;
  }> {
    const totalResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${Table.CurrencyExchangeRate}"`,
      []
    );
    const total = totalResult ? parseInt(totalResult.count, 10) : 0;

    const activeResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${Table.CurrencyExchangeRate}" WHERE "isActive" = true`,
      []
    );
    const active = activeResult ? parseInt(activeResult.count, 10) : 0;

    const providerResults = await query<{ provider: string; count: string }[]>(
      `SELECT "provider", COUNT(*) as count 
       FROM "${Table.CurrencyExchangeRate}" 
       WHERE "isActive" = true
       GROUP BY "provider"`,
      []
    );

    const byProvider: Record<string, number> = {};
    if (providerResults) {
      providerResults.forEach(row => {
        byProvider[row.provider] = parseInt(row.count, 10);
      });
    }

    const expiredRates = await this.findExpired();

    return {
      total,
      active,
      byProvider,
      expired: expiredRates.length
    };
  }
}

export default new CurrencyExchangeRateRepo();
