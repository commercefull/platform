/**
 * Tax Command Repository
 * Write operations for tax data
 */

import { unixTimestamp } from '../../../../libs/date';
import { queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { generateUUID } from '../../../../libs/uuid';
import { TaxZone, TaxRate, TaxCategory, CustomerTaxExemption, TaxSettings } from '../../taxTypes';
import {
  FailedToCreateTaxError,
  TaxRateNotFoundError,
  TaxValidationError,
  TaxCategoryNotFoundError,
  TaxZoneNotFoundError,
  TaxExemptionNotFoundError,
  TaxSettingsNotFoundError,
} from '../../domain/errors/TaxErrors';
import type { CustomerTaxExemption as DbCustomerTaxExemption, TaxCategory as DbTaxCategory, TaxRate as DbTaxRate, TaxSettings as DbTaxSettings, TaxZone as DbTaxZone } from '../../../../libs/db/types';

// ============================================================================
// Table Constants
// ============================================================================

const TABLES = {
  TAX_CATEGORY: Table.TaxCategory,
  TAX_ZONE: Table.TaxZone,
  TAX_RATE: Table.TaxRate,
  TAX_RULE: Table.TaxRule,
  TAX_SETTINGS: Table.TaxSettings,
  CUSTOMER_TAX_EXEMPTION: Table.CustomerTaxExemption,
};

// Helper to add id field to result
function addId<T>(result: Record<string, unknown>, idField: string): T {
  if (!result) return null as unknown as T;
  return { ...result, id: result[idField] } as T;
}

/**
 * Repository for tax-related data manipulation operations only
 * Following the Command Query Responsibility Segregation (CQRS) pattern
 */

// Field-driven UPDATE builders — keeps update methods' complexity low.
type UpdateField = string | [field: string, transform: (value: unknown) => unknown];

function buildUpdateSets(source: Record<string, unknown>, fields: UpdateField[]): { sets: string[]; params: unknown[] } {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const f of fields) {
    const [field, transform] = Array.isArray(f) ? f : [f];
    const value = source[field];
    if (value !== undefined) {
      sets.push(`"${field}" = $${params.length + 2}`);
      params.push(transform ? transform(value) : value);
    }
  }
  return { sets, params };
}

const TAX_RATE_UPDATE_FIELDS: UpdateField[] = [
  'taxCategoryId',
  'taxZoneId',
  'name',
  'rate',
  'type',
  'priority',
  'isCompound',
  'includeInPrice',
  'isShippingTaxable',
  'fixedAmountCents',
  'minimumAmountCents',
  'maximumAmountCents',
  'thresholdCents',
  'startDate',
  'endDate',
  'isActive',
];

const TAX_EXEMPTION_UPDATE_FIELDS: UpdateField[] = [
  'taxZoneId',
  'type',
  'status',
  'name',
  'exemptionNumber',
  'businessName',
  'exemptionReason',
  'documentUrl',
  'startDate',
  'expiryDate',
  'isVerified',
  'verifiedBy',
  'verifiedAt',
  'notes',
  ['applicableTaxCategoryIds', v => (v ? JSON.stringify(v) : null)],
  ['minOrderAmountCents', v => v ?? null],
  ['maxOrderAmountCents', v => v ?? null],
  'exemptionPercent',
];

const TAX_CATEGORY_UPDATE_FIELDS: UpdateField[] = ['name', 'code', 'description', 'isDefault', 'sortOrder', 'isActive'];

const TAX_ZONE_UPDATE_FIELDS: UpdateField[] = [
  'name',
  'code',
  'description',
  'isDefault',
  ['countries', v => JSON.stringify(v)],
  ['states', v => JSON.stringify(v)],
  ['postcodes', v => JSON.stringify(v)],
  ['cities', v => JSON.stringify(v)],
  'isActive',
];

const TAX_SETTINGS_UPDATE_FIELDS: UpdateField[] = [
  'calculationMethod',
  'pricesIncludeTax',
  'displayPricesWithTax',
  'taxBasedOn',
  'shippingTaxClass',
  'displayTaxTotals',
  'applyTaxToShipping',
  'applyDiscountBeforeTax',
  'roundTaxAtSubtotal',
  'taxDecimalPlaces',
  'defaultTaxCategory',
  'defaultTaxZone',
  'taxProvider',
  'taxProviderSettings',
];

export class TaxCommandRepo {
  // Tax Rate command methods
  async createTaxRate(taxRate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxRate> {
    const now = unixTimestamp();
    const id = generateUUID();

    // Use taxRate directly - DB uses camelCase

    const result = await queryOne<DbTaxRate>(
      `INSERT INTO "${TABLES.TAX_RATE}" (
        "taxRateId", "taxCategoryId", "taxZoneId", "name",
        "rate", "type", "priority", "isCompound", "includeInPrice",
        "isShippingTaxable", "fixedAmountCents", "minimumAmountCents", "maximumAmountCents",
        "thresholdCents", "startDate", "endDate", "isActive",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
        $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        id,
        taxRate.taxCategoryId,
        taxRate.taxZoneId,
        taxRate.name,
        taxRate.rate,
        taxRate.type,
        taxRate.priority,
        taxRate.isCompound,
        taxRate.includeInPrice,
        taxRate.isShippingTaxable,
        taxRate.fixedAmountCents || null,
        taxRate.minimumAmountCents || null,
        taxRate.maximumAmountCents || null,
        taxRate.thresholdCents || null,
        taxRate.startDate || now,
        taxRate.endDate || null,
        taxRate.isActive,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateTaxError('Failed to create tax rate');
    }

    return addId<TaxRate>(result, 'taxRateId');
  }

  async updateTaxRate(id: string, taxRate: Partial<Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxRate> {
    // Build update fields dynamically
    const { sets, params } = buildUpdateSets(taxRate as Record<string, unknown>, TAX_RATE_UPDATE_FIELDS);

    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${params.length + 2}`);

    if (sets.length === 0) {
      throw new TaxValidationError('No fields to update');
    }

    const result = await queryOne<DbTaxRate>(
      `UPDATE "${TABLES.TAX_RATE}" SET ${sets.join(', ')} WHERE "taxRateId" = $1 RETURNING *`,
      [id, ...params, unixTimestamp()],
    );

    if (!result) {
      throw new TaxRateNotFoundError(id);
    }

    return addId<TaxRate>(result, 'taxRateId');
  }

  async deleteTaxRate(id: string): Promise<boolean> {
    const result = await queryOne<{ taxRateId: string }>(`DELETE FROM "${TABLES.TAX_RATE}" WHERE "taxRateId" = $1 RETURNING "taxRateId"`, [
      id,
    ]);

    return !!result;
  }

  // Tax Category command methods
  async createTaxCategory(category: Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxCategory> {
    const now = unixTimestamp();
    const id = generateUUID();

    // Use category directly - DB uses camelCase

    const result = await queryOne<DbTaxCategory>(
      `INSERT INTO "${TABLES.TAX_CATEGORY}" (
        "taxCategoryId", "name", "code", "description", "isDefault", "sortOrder",
        "isActive", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *`,
      [id, category.name, category.code, category.description || null, category.isDefault, category.sortOrder, category.isActive, now, now],
    );

    if (!result) {
      throw new FailedToCreateTaxError('Failed to create tax category');
    }

    return addId<TaxCategory>(result, 'taxCategoryId');
  }

  async updateTaxCategory(id: string, category: Partial<Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxCategory> {
    // Build update fields dynamically
    const { sets, params } = buildUpdateSets(category as Record<string, unknown>, TAX_CATEGORY_UPDATE_FIELDS);

    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${params.length + 2}`);

    if (sets.length === 0) {
      throw new TaxValidationError('No fields to update');
    }

    const result = await queryOne<DbTaxCategory>(
      `UPDATE "${TABLES.TAX_CATEGORY}" SET ${sets.join(', ')} WHERE "taxCategoryId" = $1 RETURNING *`,
      [id, ...params, unixTimestamp()],
    );

    if (!result) {
      throw new TaxCategoryNotFoundError(id);
    }

    return addId<TaxCategory>(result, 'taxCategoryId');
  }

  async deleteTaxCategory(id: string): Promise<boolean> {
    const result = await queryOne<{ taxCategoryId: string }>(
      `DELETE FROM "${TABLES.TAX_CATEGORY}" WHERE "taxCategoryId" = $1 RETURNING "taxCategoryId"`,
      [id],
    );

    return !!result;
  }

  // Tax Zone command methods
  async createTaxZone(taxZone: Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxZone> {
    const now = unixTimestamp();
    const id = generateUUID();

    // Use taxZone directly - DB uses camelCase

    const result = await queryOne<DbTaxZone>(
      `INSERT INTO "${TABLES.TAX_ZONE}" (
        "taxZoneId", "name", "code", "description", "isDefault", "countries", "states", 
        "postcodes", "cities", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        id,
        taxZone.name,
        taxZone.code,
        taxZone.description || null,
        taxZone.isDefault,
        JSON.stringify(taxZone.countries),
        taxZone.states ? JSON.stringify(taxZone.states) : null,
        taxZone.postcodes ? JSON.stringify(taxZone.postcodes) : null,
        taxZone.cities ? JSON.stringify(taxZone.cities) : null,
        taxZone.isActive,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateTaxError('Failed to create tax zone');
    }

    return addId<TaxZone>(result, 'taxZoneId');
  }

  async updateTaxZone(id: string, taxZone: Partial<Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxZone> {
    // Build update fields dynamically
    const { sets, params } = buildUpdateSets(taxZone as Record<string, unknown>, TAX_ZONE_UPDATE_FIELDS);

    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${params.length + 2}`);

    if (sets.length === 0) {
      throw new TaxValidationError('No fields to update');
    }

    const result = await queryOne<DbTaxZone>(
      `UPDATE "${TABLES.TAX_ZONE}" SET ${sets.join(', ')} WHERE "taxZoneId" = $1 RETURNING *`,
      [id, ...params, unixTimestamp()],
    );

    if (!result) {
      throw new TaxZoneNotFoundError(id);
    }

    return addId<TaxZone>(result, 'taxZoneId');
  }

  async deleteTaxZone(id: string): Promise<boolean> {
    const result = await queryOne<{ taxZoneId: string }>(`DELETE FROM "${TABLES.TAX_ZONE}" WHERE "taxZoneId" = $1 RETURNING "taxZoneId"`, [
      id,
    ]);

    return !!result;
  }

  // Tax Exemption command methods
  async createTaxExemption(exemption: Omit<CustomerTaxExemption, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerTaxExemption> {
    const now = unixTimestamp();
    const id = generateUUID();

    // Use exemption directly - DB uses camelCase

    const result = await queryOne<DbCustomerTaxExemption>(
      `INSERT INTO "${TABLES.CUSTOMER_TAX_EXEMPTION}" (
        "customerTaxExemptionId", "customerId", "taxZoneId", "type", "status", 
        "name", "exemptionNumber", "businessName", "exemptionReason", "documentUrl", 
        "startDate", "expiryDate", "isVerified", "verifiedBy", 
        "verifiedAt", "notes", "applicableTaxCategoryIds", "minOrderAmount", "maxOrderAmount", "exemptionPercent",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *`,
      [
        id,
        exemption.customerId,
        exemption.taxZoneId || null,
        exemption.type,
        exemption.status,
        exemption.name,
        exemption.exemptionNumber,
        exemption.businessName || null,
        exemption.exemptionReason || null,
        exemption.documentUrl || null,
        exemption.startDate,
        exemption.expiryDate || null,
        exemption.isVerified,
        exemption.verifiedBy || null,
        exemption.verifiedAt || null,
        exemption.notes || null,
        exemption.applicableTaxCategoryIds ? JSON.stringify(exemption.applicableTaxCategoryIds) : null,
        exemption.minOrderAmountCents ?? null,
        exemption.maxOrderAmountCents ?? null,
        exemption.exemptionPercent ?? 100,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateTaxError('Failed to create tax exemption');
    }

    return addId<CustomerTaxExemption>(result, 'customerTaxExemptionId');
  }

  async updateTaxExemption(
    id: string,
    exemption: Partial<Omit<CustomerTaxExemption, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<CustomerTaxExemption> {
    // Build update fields dynamically
    const { sets, params } = buildUpdateSets(exemption as Record<string, unknown>, TAX_EXEMPTION_UPDATE_FIELDS);

    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${params.length + 2}`);

    if (sets.length === 0) {
      throw new TaxValidationError('No fields to update');
    }

    const result = await queryOne<DbCustomerTaxExemption>(
      `UPDATE "${TABLES.CUSTOMER_TAX_EXEMPTION}" SET ${sets.join(', ')} WHERE "customerTaxExemptionId" = $1 RETURNING *`,
      [id, ...params, unixTimestamp()],
    );

    if (!result) {
      throw new TaxExemptionNotFoundError(id);
    }

    return addId<CustomerTaxExemption>(result, 'customerTaxExemptionId');
  }

  async deleteTaxExemption(id: string): Promise<boolean> {
    const result = await queryOne<{ customerTaxExemptionId: string }>(
      `DELETE FROM "${TABLES.CUSTOMER_TAX_EXEMPTION}" WHERE "customerTaxExemptionId" = $1 RETURNING "customerTaxExemptionId"`,
      [id],
    );

    return !!result;
  }

  // Tax Settings methods
  async createTaxSettings(settings: Omit<TaxSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxSettings> {
    const now = unixTimestamp();
    const id = generateUUID();

    // Use settings directly - DB uses camelCase

    const result = await queryOne<DbTaxSettings>(
      `INSERT INTO "${TABLES.TAX_SETTINGS}" (
        "taxSettingsId", "organizationId", "calculationMethod", "pricesIncludeTax", 
        "displayPricesWithTax", "taxBasedOn", "shippingTaxClass", 
        "displayTaxTotals", "applyTaxToShipping", "applyDiscountBeforeTax", 
        "roundTaxAtSubtotal", "taxDecimalPlaces", "defaultTaxCategory", 
        "defaultTaxZone", "taxProvider", "taxProviderSettings", 
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *`,
      [
        id,
        settings.organizationId,
        settings.calculationMethod,
        settings.pricesIncludeTax,
        settings.displayPricesWithTax,
        settings.taxBasedOn,
        settings.shippingTaxClass || null,
        settings.displayTaxTotals,
        settings.applyTaxToShipping,
        settings.applyDiscountBeforeTax,
        settings.roundTaxAtSubtotal,
        settings.taxDecimalPlaces,
        settings.defaultTaxCategory || null,
        settings.defaultTaxZone || null,
        settings.taxProvider || null,
        settings.taxProviderSettings || null,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateTaxError('Failed to create tax settings');
    }

    return addId<TaxSettings>(result, 'taxSettingsId');
  }

  async updateTaxSettings(
    id: string,
    settings: Partial<Omit<TaxSettings, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<TaxSettings> {
    // Build update fields dynamically
    const { sets, params } = buildUpdateSets(settings as Record<string, unknown>, TAX_SETTINGS_UPDATE_FIELDS);

    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${params.length + 2}`);

    if (sets.length === 0) {
      throw new TaxValidationError('No fields to update');
    }

    const result = await queryOne<DbTaxSettings>(
      `UPDATE "${TABLES.TAX_SETTINGS}" SET ${sets.join(', ')} WHERE "taxSettingsId" = $1 RETURNING *`,
      [id, ...params, unixTimestamp()],
    );

    if (!result) {
      throw new TaxSettingsNotFoundError(id);
    }

    return addId<TaxSettings>(result, 'taxSettingsId');
  }

  async deleteTaxSettings(id: string): Promise<boolean> {
    const result = await queryOne<{ taxSettingsId: string }>(
      `DELETE FROM "${TABLES.TAX_SETTINGS}" WHERE "taxSettingsId" = $1 RETURNING "taxSettingsId"`,
      [id],
    );

    return !!result;
  }
}
