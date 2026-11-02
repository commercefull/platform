/**
 * Tax Settings Repository
 * CRUD operations for tax settings
 */

import { queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import { FailedToCreateTaxError } from '../../domain/errors/TaxErrors';
import type { TaxSettings as DbTaxSettings } from '../../../../libs/db/types';

// ============================================================================
// Table Constants
// ============================================================================

type TaxSettings = DbTaxSettings;

type TaxSettingsCreateParams = Omit<TaxSettings, 'taxSettingsId' | 'createdAt' | 'updatedAt'>;
type TaxSettingsUpdateParams = Partial<Omit<TaxSettings, 'taxSettingsId' | 'organizationId' | 'createdAt' | 'updatedAt'>>;

// `||`/`??`-style defaulting kept out of the create params to keep complexity low.
function fallback<T, D>(value: T | undefined | null, defaultValue: D): T | D {
  return value || defaultValue;
}
function nvl<T>(value: T | undefined | null, defaultValue: T): T {
  return value ?? defaultValue;
}

function taxSettingsInsertValues(params: TaxSettingsCreateParams, now: string): unknown[] {
  return [
    params.organizationId,
    fallback(params.calculationMethod, 'unitBased'),
    fallback(params.pricesIncludeTax, false),
    fallback(params.displayPricesWithTax, false),
    fallback(params.taxBasedOn, 'shippingAddress'),
    fallback(params.shippingTaxClass, null),
    fallback(params.displayTaxTotals, 'itemized'),
    nvl(params.applyTaxToShipping, true),
    nvl(params.applyDiscountBeforeTax, true),
    fallback(params.roundTaxAtSubtotal, false),
    fallback(params.taxDecimalPlaces, 2),
    fallback(params.defaultTaxCategory, null),
    fallback(params.defaultTaxZone, null),
    fallback(params.taxProvider, 'internal'),
    JSON.stringify(params.taxProviderSettings || {}),
    now,
    now,
  ];
}

class TaxSettingsRepo {
  async findById(id: string): Promise<TaxSettings | null> {
    return await queryOne<DbTaxSettings>(`SELECT * FROM "taxSettings" WHERE "taxSettingsId" = $1`, [id]);
  }

  async findByMerchant(organizationId: string): Promise<TaxSettings | null> {
    return await queryOne<DbTaxSettings>(`SELECT * FROM "taxSettings" WHERE "organizationId" = $1`, [organizationId]);
  }

  async create(params: TaxSettingsCreateParams): Promise<TaxSettings> {
    const now = unixTimestamp();
    const result = await queryOne<DbTaxSettings>(
      `INSERT INTO "taxSettings" (
        "organizationId", "calculationMethod", "pricesIncludeTax", "displayPricesWithTax", "taxBasedOn",
        "shippingTaxClass", "displayTaxTotals", "applyTaxToShipping", "applyDiscountBeforeTax",
        "roundTaxAtSubtotal", "taxDecimalPlaces", "defaultTaxCategory", "defaultTaxZone",
        "taxProvider", "taxProviderSettings", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      taxSettingsInsertValues(params, now),
    );
    if (!result) throw new FailedToCreateTaxError('Failed to create tax settings');
    return result;
  }

  async update(id: string, params: TaxSettingsUpdateParams): Promise<TaxSettings | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'taxProviderSettings' ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<DbTaxSettings>(
      `UPDATE "taxSettings" SET ${updateFields.join(', ')} WHERE "taxSettingsId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  async updateByMerchant(organizationId: string, params: TaxSettingsUpdateParams): Promise<TaxSettings | null> {
    const existing = await this.findByMerchant(organizationId);
    if (!existing) return null;
    return this.update(existing.taxSettingsId, params);
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ taxSettingsId: string }>(
      `DELETE FROM "taxSettings" WHERE "taxSettingsId" = $1 RETURNING "taxSettingsId"`,
      [id],
    );
    return !!result;
  }
}

export default new TaxSettingsRepo();
