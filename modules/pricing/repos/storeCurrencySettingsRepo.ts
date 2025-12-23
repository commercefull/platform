import { query, queryOne } from '../../../libs/db';
import { Table, StoreCurrencySettings } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

export type RoundingMethod = 'up' | 'down' | 'ceiling' | 'floor' | 'half_up' | 'half_down' | 'half_even';
export type PriceDisplayFormat = 'symbol' | 'code' | 'symbol_code' | 'name';

export type StoreCurrencySettingsCreateParams = Omit<StoreCurrencySettings, 'storeCurrencySettingsId' | 'createdAt' | 'updatedAt'>;
export type StoreCurrencySettingsUpdateParams = Partial<Omit<StoreCurrencySettings, 'storeCurrencySettingsId' | 'createdAt' | 'updatedAt'>>;

export class StoreCurrencySettingsRepo {
  /**
   * Find settings by ID
   */
  async findById(storeCurrencySettingsId: string): Promise<StoreCurrencySettings | null> {
    return await queryOne<StoreCurrencySettings>(
      `SELECT * FROM "${Table.StoreCurrencySettings}" WHERE "storeCurrencySettingsId" = $1`,
      [storeCurrencySettingsId]
    );
  }

  /**
   * Find settings by store currency
   */
  async findByStoreCurrency(storeCurrencyId: string): Promise<StoreCurrencySettings | null> {
    return await queryOne<StoreCurrencySettings>(
      `SELECT * FROM "${Table.StoreCurrencySettings}" WHERE "storeCurrencyId" = $1`,
      [storeCurrencyId]
    );
  }

  /**
   * Find default settings (typically only one row exists per store)
   */
  async findDefault(): Promise<StoreCurrencySettings | null> {
    return await queryOne<StoreCurrencySettings>(
      `SELECT * FROM "${Table.StoreCurrencySettings}" ORDER BY "createdAt" ASC LIMIT 1`
    );
  }

  /**
   * Find all settings
   */
  async findAll(): Promise<StoreCurrencySettings[]> {
    const results = await query<StoreCurrencySettings[]>(
      `SELECT * FROM "${Table.StoreCurrencySettings}" ORDER BY "createdAt" ASC`
    );
    return results || [];
  }

  /**
   * Find settings by base currency
   */
  async findByBaseCurrency(baseCurrencyId: string): Promise<StoreCurrencySettings[]> {
    const results = await query<StoreCurrencySettings[]>(
      `SELECT * FROM "${Table.StoreCurrencySettings}" WHERE "baseCurrencyId" = $1`,
      [baseCurrencyId]
    );
    return results || [];
  }

  /**
   * Find settings with auto-update enabled
   */
  async findWithAutoUpdate(): Promise<StoreCurrencySettings[]> {
    const results = await query<StoreCurrencySettings[]>(
      `SELECT * FROM "${Table.StoreCurrencySettings}" WHERE "autoUpdateRates" = true`,
      []
    );
    return results || [];
  }

  /**
   * Create settings
   */
  async create(params: StoreCurrencySettingsCreateParams): Promise<StoreCurrencySettings> {
    const now = unixTimestamp();

    // Check if settings already exist for this store currency
    const existing = await this.findByStoreCurrency(params.storeCurrencyId);
    if (existing) {
      throw new Error(`Settings already exist for store currency ID '${params.storeCurrencyId}'`);
    }

    const result = await queryOne<StoreCurrencySettings>(
      `INSERT INTO "${Table.StoreCurrencySettings}" (
        "storeCurrencyId", "baseCurrencyId", "displayCurrencyId",
        "allowCustomerCurrencySelection", "showCurrencySelector", "autoUpdateRates",
        "rateUpdateFrequency", "activeProviderCode", "markupPercentage",
        "roundPrecision", "roundingMethod", "enabledCurrencies", "priceDisplayFormat",
        "updatedBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        params.storeCurrencyId,
        params.baseCurrencyId,
        params.displayCurrencyId,
        params.allowCustomerCurrencySelection !== undefined ? params.allowCustomerCurrencySelection : true,
        params.showCurrencySelector !== undefined ? params.showCurrencySelector : true,
        params.autoUpdateRates || false,
        params.rateUpdateFrequency || 1440,
        params.activeProviderCode || null,
        params.markupPercentage || 0,
        params.roundPrecision !== undefined ? params.roundPrecision : 2,
        params.roundingMethod || 'half_up',
        params.enabledCurrencies || null,
        params.priceDisplayFormat || 'symbol',
        params.updatedBy || null,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create store currency settings');
    }

    return result;
  }

  /**
   * Update settings
   */
  async update(storeCurrencySettingsId: string, params: StoreCurrencySettingsUpdateParams): Promise<StoreCurrencySettings | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(storeCurrencySettingsId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(storeCurrencySettingsId);

    const result = await queryOne<StoreCurrencySettings>(
      `UPDATE "${Table.StoreCurrencySettings}" 
       SET ${updateFields.join(', ')}
       WHERE "storeCurrencySettingsId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Enable auto-update
   */
  async enableAutoUpdate(storeCurrencySettingsId: string, frequency?: number): Promise<StoreCurrencySettings | null> {
    const updates: StoreCurrencySettingsUpdateParams = { 
      autoUpdateRates: true 
    };
    
    if (frequency) {
      updates.rateUpdateFrequency = frequency;
    }
    
    return this.update(storeCurrencySettingsId, updates);
  }

  /**
   * Disable auto-update
   */
  async disableAutoUpdate(storeCurrencySettingsId: string): Promise<StoreCurrencySettings | null> {
    return this.update(storeCurrencySettingsId, { autoUpdateRates: false });
  }

  /**
   * Update base currency
   */
  async updateBaseCurrency(storeCurrencySettingsId: string, baseCurrencyId: string): Promise<StoreCurrencySettings | null> {
    return this.update(storeCurrencySettingsId, { baseCurrencyId });
  }

  /**
   * Update display currency
   */
  async updateDisplayCurrency(storeCurrencySettingsId: string, displayCurrencyId: string): Promise<StoreCurrencySettings | null> {
    return this.update(storeCurrencySettingsId, { displayCurrencyId });
  }

  /**
   * Add enabled currency
   */
  async addEnabledCurrency(storeCurrencySettingsId: string, currencyCode: string): Promise<StoreCurrencySettings | null> {
    const result = await queryOne<StoreCurrencySettings>(
      `UPDATE "${Table.StoreCurrencySettings}" 
       SET "enabledCurrencies" = array_append("enabledCurrencies", $1), "updatedAt" = $2
       WHERE "storeCurrencySettingsId" = $3
       RETURNING *`,
      [currencyCode, unixTimestamp(), storeCurrencySettingsId]
    );

    return result;
  }

  /**
   * Remove enabled currency
   */
  async removeEnabledCurrency(storeCurrencySettingsId: string, currencyCode: string): Promise<StoreCurrencySettings | null> {
    const result = await queryOne<StoreCurrencySettings>(
      `UPDATE "${Table.StoreCurrencySettings}" 
       SET "enabledCurrencies" = array_remove("enabledCurrencies", $1), "updatedAt" = $2
       WHERE "storeCurrencySettingsId" = $3
       RETURNING *`,
      [currencyCode, unixTimestamp(), storeCurrencySettingsId]
    );

    return result;
  }

  /**
   * Set enabled currencies (replace all)
   */
  async setEnabledCurrencies(storeCurrencySettingsId: string, currencyCodes: string[]): Promise<StoreCurrencySettings | null> {
    return this.update(storeCurrencySettingsId, { enabledCurrencies: currencyCodes });
  }

  /**
   * Update markup percentage
   */
  async updateMarkup(storeCurrencySettingsId: string, markupPercentage: number): Promise<StoreCurrencySettings | null> {
    if (markupPercentage < 0 || markupPercentage > 100) {
      throw new Error('Markup percentage must be between 0 and 100');
    }
    
    return this.update(storeCurrencySettingsId, { markupPercentage: markupPercentage.toString() });
  }

  /**
   * Update rounding settings
   */
  async updateRounding(
    storeCurrencySettingsId: string,
    precision: number,
    method: RoundingMethod
  ): Promise<StoreCurrencySettings | null> {
    return this.update(storeCurrencySettingsId, {
      roundPrecision: precision,
      roundingMethod: method
    });
  }

  /**
   * Update provider
   */
  async updateProvider(storeCurrencySettingsId: string, providerCode: string): Promise<StoreCurrencySettings | null> {
    return this.update(storeCurrencySettingsId, { activeProviderCode: providerCode });
  }

  /**
   * Delete settings
   */
  async delete(storeCurrencySettingsId: string): Promise<boolean> {
    const result = await queryOne<{ storeCurrencySettingsId: string }>(
      `DELETE FROM "${Table.StoreCurrencySettings}" WHERE "storeCurrencySettingsId" = $1 RETURNING "storeCurrencySettingsId"`,
      [storeCurrencySettingsId]
    );

    return !!result;
  }

  /**
   * Count settings
   */
  async count(): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${Table.StoreCurrencySettings}"`,
      []
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    total: number;
    withAutoUpdate: number;
    avgMarkup: number;
    byRoundingMethod: Record<RoundingMethod, number>;
    byDisplayFormat: Record<PriceDisplayFormat, number>;
  }> {
    const total = await this.count();

    const autoUpdateResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${Table.StoreCurrencySettings}" WHERE "autoUpdateRates" = true`,
      []
    );
    const withAutoUpdate = autoUpdateResult ? parseInt(autoUpdateResult.count, 10) : 0;

    const avgResult = await queryOne<{ avg: string }>(
      `SELECT AVG("markupPercentage") as avg FROM "${Table.StoreCurrencySettings}"`,
      []
    );
    const avgMarkup = avgResult && avgResult.avg ? parseFloat(avgResult.avg) : 0;

    const roundingResults = await query<{ roundingMethod: RoundingMethod; count: string }[]>(
      `SELECT "roundingMethod", COUNT(*) as count FROM "${Table.StoreCurrencySettings}" GROUP BY "roundingMethod"`,
      []
    );

    const byRoundingMethod: Record<string, number> = {};
    if (roundingResults) {
      roundingResults.forEach(row => {
        byRoundingMethod[row.roundingMethod] = parseInt(row.count, 10);
      });
    }

    const displayResults = await query<{ priceDisplayFormat: PriceDisplayFormat; count: string }[]>(
      `SELECT "priceDisplayFormat", COUNT(*) as count FROM "${Table.StoreCurrencySettings}" GROUP BY "priceDisplayFormat"`,
      []
    );

    const byDisplayFormat: Record<string, number> = {};
    if (displayResults) {
      displayResults.forEach(row => {
        byDisplayFormat[row.priceDisplayFormat] = parseInt(row.count, 10);
      });
    }

    return {
      total,
      withAutoUpdate,
      avgMarkup: Math.round(avgMarkup * 100) / 100,
      byRoundingMethod: byRoundingMethod as Record<RoundingMethod, number>,
      byDisplayFormat: byDisplayFormat as Record<PriceDisplayFormat, number>
    };
  }
}

export default new StoreCurrencySettingsRepo();
