/**
 * Tax Settings Repository
 * CRUD operations for tax settings
 */

import { queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

// ============================================================================
// Table Constants
// ============================================================================


// ============================================================================
// Types
// ============================================================================

export type TaxCalculationMethod = 'unitBased' | 'itemBased';
export type TaxBasedOn = 'shippingAddress' | 'billingAddress';
export type TaxDisplayTotals = 'itemized' | 'summary';
export type TaxProvider = 'internal' | 'external';

export interface TaxSettings {
  taxSettingsId: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  calculationMethod: TaxCalculationMethod;
  pricesIncludeTax: boolean;
  displayPricesWithTax: boolean;
  taxBasedOn: TaxBasedOn;
  shippingTaxClass?: string;
  displayTaxTotals: TaxDisplayTotals;
  applyTaxToShipping: boolean;
  applyDiscountBeforeTax: boolean;
  roundTaxAtSubtotal: boolean;
  taxDecimalPlaces: number;
  defaultTaxCategory?: string;
  defaultTaxZone?: string;
  taxProvider?: TaxProvider;
  taxProviderSettings?: unknown; // JSON
}

export type TaxSettingsCreateParams = Omit<TaxSettings, 'taxSettingsId' | 'createdAt' | 'updatedAt'>;
export type TaxSettingsUpdateParams = Partial<Omit<TaxSettings, 'taxSettingsId' | 'organizationId' | 'createdAt' | 'updatedAt'>>;

export class TaxSettingsRepo {
  async findById(id: string): Promise<TaxSettings | null> {
    return await queryOne<TaxSettings>(`SELECT * FROM "taxSettings" WHERE "taxSettingsId" = $1`, [id]);
  }

  async findByMerchant(organizationId: string): Promise<TaxSettings | null> {
    return await queryOne<TaxSettings>(`SELECT * FROM "taxSettings" WHERE "organizationId" = $1`, [organizationId]);
  }

  async create(params: TaxSettingsCreateParams): Promise<TaxSettings> {
    const now = unixTimestamp();
    const result = await queryOne<TaxSettings>(
      `INSERT INTO "taxSettings" (
        "organizationId", "calculationMethod", "pricesIncludeTax", "displayPricesWithTax", "taxBasedOn",
        "shippingTaxClass", "displayTaxTotals", "applyTaxToShipping", "applyDiscountBeforeTax",
        "roundTaxAtSubtotal", "taxDecimalPlaces", "defaultTaxCategory", "defaultTaxZone",
        "taxProvider", "taxProviderSettings", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        params.organizationId,
        params.calculationMethod || 'unitBased',
        params.pricesIncludeTax || false,
        params.displayPricesWithTax || false,
        params.taxBasedOn || 'shippingAddress',
        params.shippingTaxClass || null,
        params.displayTaxTotals || 'itemized',
        params.applyTaxToShipping ?? true,
        params.applyDiscountBeforeTax ?? true,
        params.roundTaxAtSubtotal || false,
        params.taxDecimalPlaces || 2,
        params.defaultTaxCategory || null,
        params.defaultTaxZone || null,
        params.taxProvider || 'internal',
        JSON.stringify(params.taxProviderSettings || {}),
        now,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create tax settings');
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

    return await queryOne<TaxSettings>(
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
