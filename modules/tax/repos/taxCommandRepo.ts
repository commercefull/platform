/**
 * Tax Command Repository
 * Write operations for tax data
 */

import { unixTimestamp } from '../../../libs/date';
import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';
import { generateUUID } from '../../../libs/uuid';
import { 
  TaxZone, TaxRate, TaxCategory, CustomerTaxExemption,
  TaxSettings
} from '../taxTypes';
import taxQueryRepo from './taxQueryRepo';

// ============================================================================
// Table Constants
// ============================================================================

const TABLES = {
  TAX_CATEGORY: Table.TaxCategory,
  TAX_ZONE: Table.TaxZone,
  TAX_RATE: Table.TaxRate,
  TAX_RULE: Table.TaxRule,
  TAX_SETTINGS: Table.TaxSettings,
  CUSTOMER_TAX_EXEMPTION: Table.CustomerTaxExemption
};

// Helper to add id field to result
function addId<T>(result: any, idField: string): T {
  if (!result) return null as any;
  return { ...result, id: result[idField] } as T;
}

/**
 * Repository for tax-related data manipulation operations only
 * Following the Command Query Responsibility Segregation (CQRS) pattern
 */
export class TaxCommandRepo {
  // Tax Rate command methods
  async createTaxRate(taxRate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxRate> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    
    // Use taxRate directly - DB uses camelCase
    
    const result = await queryOne<any>(
      `INSERT INTO "${TABLES.TAX_RATE}" (
        "taxRateId", "taxCategoryId", "taxZoneId", "name",
        "rate", "type", "priority", "isCompound", "includeInPrice",
        "isShippingTaxable", "fixedAmount", "minimumAmount", "maximumAmount",
        "threshold", "startDate", "endDate", "isActive",
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
        taxRate.fixedAmount || null,
        taxRate.minimumAmount || null,
        taxRate.maximumAmount || null,
        taxRate.threshold || null,
        taxRate.startDate,
        taxRate.endDate || null,
        taxRate.isActive,
        now,
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax rate');
    }
    
    
    return addId<TaxRate>(result, 'taxRateId');
  }

  async updateTaxRate(id: string, taxRate: Partial<Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxRate> {
    const now = unixTimestamp();
    
    
    // Use taxRate directly - DB uses camelCase
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    // Use camelCase database field names for updates
    if (taxRate.taxCategoryId !== undefined) {
      sets.push(`"taxCategoryId" = $${paramIndex++}`);
      params.push(taxRate.taxCategoryId);
    }
    
    if (taxRate.taxZoneId !== undefined) {
      sets.push(`"taxZoneId" = $${paramIndex++}`);
      params.push(taxRate.taxZoneId);
    }
    
    if (taxRate.name !== undefined) {
      sets.push(`"name" = $${paramIndex++}`);
      params.push(taxRate.name);
    }
    
    if (taxRate.rate !== undefined) {
      sets.push(`"rate" = $${paramIndex++}`);
      params.push(taxRate.rate);
    }
    
    if (taxRate.type !== undefined) {
      sets.push(`"type" = $${paramIndex++}`);
      params.push(taxRate.type);
    }
    
    if (taxRate.priority !== undefined) {
      sets.push(`"priority" = $${paramIndex++}`);
      params.push(taxRate.priority);
    }
    
    if (taxRate.isCompound !== undefined) {
      sets.push(`"isCompound" = $${paramIndex++}`);
      params.push(taxRate.isCompound);
    }
    
    if (taxRate.includeInPrice !== undefined) {
      sets.push(`"includeInPrice" = $${paramIndex++}`);
      params.push(taxRate.includeInPrice);
    }
    
    if (taxRate.isShippingTaxable !== undefined) {
      sets.push(`"isShippingTaxable" = $${paramIndex++}`);
      params.push(taxRate.isShippingTaxable);
    }
    
    if (taxRate.fixedAmount !== undefined) {
      sets.push(`"fixedAmount" = $${paramIndex++}`);
      params.push(taxRate.fixedAmount);
    }
    
    if (taxRate.minimumAmount !== undefined) {
      sets.push(`"minimumAmount" = $${paramIndex++}`);
      params.push(taxRate.minimumAmount);
    }
    
    if (taxRate.maximumAmount !== undefined) {
      sets.push(`"maximumAmount" = $${paramIndex++}`);
      params.push(taxRate.maximumAmount);
    }
    
    if (taxRate.threshold !== undefined) {
      sets.push(`"threshold" = $${paramIndex++}`);
      params.push(taxRate.threshold);
    }
    
    if (taxRate.startDate !== undefined) {
      sets.push(`"startDate" = $${paramIndex++}`);
      params.push(taxRate.startDate);
    }
    
    if (taxRate.endDate !== undefined) {
      sets.push(`"endDate" = $${paramIndex++}`);
      params.push(taxRate.endDate);
    }
    
    if (taxRate.isActive !== undefined) {
      sets.push(`"isActive" = $${paramIndex++}`);
      params.push(taxRate.isActive);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    
    const result = await queryOne<any>(
      `UPDATE "${TABLES.TAX_RATE}" SET ${sets.join(', ')} WHERE "taxRateId" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax rate with ID ${id} not found`);
    }
    
    
    return addId<TaxRate>(result, 'taxRateId');
  }

  async deleteTaxRate(id: string): Promise<boolean> {
    const result = await queryOne<{ taxRateId: string }>(
      `DELETE FROM "${TABLES.TAX_RATE}" WHERE "taxRateId" = $1 RETURNING "taxRateId"`,
      [id]
    );
    
    return !!result;
  }

  // Tax Category command methods
  async createTaxCategory(category: Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxCategory> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    
    // Use category directly - DB uses camelCase
    
    const result = await queryOne<any>(
      `INSERT INTO "${TABLES.TAX_CATEGORY}" (
        "taxCategoryId", "name", "code", "description", "isDefault", "sortOrder",
        "isActive", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *`,
      [
        id,
        category.name,
        category.code,
        category.description || null,
        category.isDefault,
        category.sortOrder,
        category.isActive,
        now,
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax category');
    }
    
    
    return addId<TaxCategory>(result, 'taxCategoryId');
  }

  async updateTaxCategory(id: string, category: Partial<Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxCategory> {
    const now = unixTimestamp();
    
    
    // Use category directly - DB uses camelCase
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    if (category.name !== undefined) {
      sets.push(`"name" = $${paramIndex++}`);
      params.push(category.name);
    }
    
    if (category.code !== undefined) {
      sets.push(`"code" = $${paramIndex++}`);
      params.push(category.code);
    }
    
    if (category.description !== undefined) {
      sets.push(`"description" = $${paramIndex++}`);
      params.push(category.description);
    }
    
    if (category.isDefault !== undefined) {
      sets.push(`"isDefault" = $${paramIndex++}`);
      params.push(category.isDefault);
    }
    
    if (category.sortOrder !== undefined) {
      sets.push(`"sortOrder" = $${paramIndex++}`);
      params.push(category.sortOrder);
    }
    
    if (category.isActive !== undefined) {
      sets.push(`"isActive" = $${paramIndex++}`);
      params.push(category.isActive);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    
    const result = await queryOne<any>(
      `UPDATE "${TABLES.TAX_CATEGORY}" SET ${sets.join(', ')} WHERE "taxCategoryId" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax category with ID ${id} not found`);
    }
    
    
    return addId<TaxCategory>(result, 'taxCategoryId');
  }

  async deleteTaxCategory(id: string): Promise<boolean> {
    const result = await queryOne<{ taxCategoryId: string }>(
      `DELETE FROM "${TABLES.TAX_CATEGORY}" WHERE "taxCategoryId" = $1 RETURNING "taxCategoryId"`,
      [id]
    );
    
    return !!result;
  }

  // Tax Zone command methods
  async createTaxZone(taxZone: Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxZone> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    
    // Use taxZone directly - DB uses camelCase
    
    const result = await queryOne<any>(
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
        taxZone.countries, 
        taxZone.states || null, 
        taxZone.postcodes || null, 
        taxZone.cities || null, 
        taxZone.isActive,
        now, 
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax zone');
    }
    
    
    return addId<TaxZone>(result, 'taxZoneId');
  }

  async updateTaxZone(id: string, taxZone: Partial<Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxZone> {
    const now = unixTimestamp();
    
    
    // Use taxZone directly - DB uses camelCase
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    if (taxZone.name !== undefined) {
      sets.push(`"name" = $${paramIndex++}`);
      params.push(taxZone.name);
    }
    
    if (taxZone.code !== undefined) {
      sets.push(`"code" = $${paramIndex++}`);
      params.push(taxZone.code);
    }
    
    if (taxZone.description !== undefined) {
      sets.push(`"description" = $${paramIndex++}`);
      params.push(taxZone.description);
    }
    
    if (taxZone.isDefault !== undefined) {
      sets.push(`"isDefault" = $${paramIndex++}`);
      params.push(taxZone.isDefault);
    }
    
    if (taxZone.countries !== undefined) {
      sets.push(`"countries" = $${paramIndex++}`);
      params.push(taxZone.countries);
    }
    
    if (taxZone.states !== undefined) {
      sets.push(`"states" = $${paramIndex++}`);
      params.push(taxZone.states);
    }
    
    if (taxZone.postcodes !== undefined) {
      sets.push(`"postcodes" = $${paramIndex++}`);
      params.push(taxZone.postcodes);
    }
    
    if (taxZone.cities !== undefined) {
      sets.push(`"cities" = $${paramIndex++}`);
      params.push(taxZone.cities);
    }
    
    if (taxZone.isActive !== undefined) {
      sets.push(`"isActive" = $${paramIndex++}`);
      params.push(taxZone.isActive);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    
    const result = await queryOne<any>(
      `UPDATE "${TABLES.TAX_ZONE}" SET ${sets.join(', ')} WHERE "taxZoneId" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax zone with ID ${id} not found`);
    }
    
    
    return addId<TaxZone>(result, 'taxZoneId');
  }
  
  async deleteTaxZone(id: string): Promise<boolean> {
    const result = await queryOne<{ taxZoneId: string }>(
      `DELETE FROM "${TABLES.TAX_ZONE}" WHERE "taxZoneId" = $1 RETURNING "taxZoneId"`,
      [id]
    );
    
    return !!result;
  }

  // Tax Exemption command methods
  async createTaxExemption(exemption: Omit<CustomerTaxExemption, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerTaxExemption> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    
    // Use exemption directly - DB uses camelCase
    
    const result = await queryOne<any>(
      `INSERT INTO "${TABLES.CUSTOMER_TAX_EXEMPTION}" (
        "customerTaxExemptionId", "customerId", "taxZoneId", "type", "status", 
        "name", "exemptionNumber", "businessName", "exemptionReason", "documentUrl", 
        "startDate", "expiryDate", "isVerified", "verifiedBy", 
        "verifiedAt", "notes", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
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
        now,
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax exemption');
    }
    
    
    return addId<CustomerTaxExemption>(result, 'customerTaxExemptionId');
  }

  async updateTaxExemption(
    id: string, 
    exemption: Partial<Omit<CustomerTaxExemption, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>
  ): Promise<CustomerTaxExemption> {
    const now = unixTimestamp();
    
    
    // Use exemption directly - DB uses camelCase
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    if (exemption.taxZoneId !== undefined) {
      sets.push(`"taxZoneId" = $${paramIndex++}`);
      params.push(exemption.taxZoneId);
    }
    
    if (exemption.type !== undefined) {
      sets.push(`"type" = $${paramIndex++}`);
      params.push(exemption.type);
    }
    
    if (exemption.status !== undefined) {
      sets.push(`"status" = $${paramIndex++}`);
      params.push(exemption.status);
    }
    
    if (exemption.name !== undefined) {
      sets.push(`"name" = $${paramIndex++}`);
      params.push(exemption.name);
    }
    
    if (exemption.exemptionNumber !== undefined) {
      sets.push(`"exemptionNumber" = $${paramIndex++}`);
      params.push(exemption.exemptionNumber);
    }
    
    if (exemption.businessName !== undefined) {
      sets.push(`"businessName" = $${paramIndex++}`);
      params.push(exemption.businessName);
    }
    
    if (exemption.exemptionReason !== undefined) {
      sets.push(`"exemptionReason" = $${paramIndex++}`);
      params.push(exemption.exemptionReason);
    }
    
    if (exemption.documentUrl !== undefined) {
      sets.push(`"documentUrl" = $${paramIndex++}`);
      params.push(exemption.documentUrl);
    }
    
    if (exemption.startDate !== undefined) {
      sets.push(`"startDate" = $${paramIndex++}`);
      params.push(exemption.startDate);
    }
    
    if (exemption.expiryDate !== undefined) {
      sets.push(`"expiryDate" = $${paramIndex++}`);
      params.push(exemption.expiryDate);
    }
    
    if (exemption.isVerified !== undefined) {
      sets.push(`"isVerified" = $${paramIndex++}`);
      params.push(exemption.isVerified);
    }
    
    if (exemption.verifiedBy !== undefined) {
      sets.push(`"verifiedBy" = $${paramIndex++}`);
      params.push(exemption.verifiedBy);
    }
    
    if (exemption.verifiedAt !== undefined) {
      sets.push(`"verifiedAt" = $${paramIndex++}`);
      params.push(exemption.verifiedAt);
    }
    
    if (exemption.notes !== undefined) {
      sets.push(`"notes" = $${paramIndex++}`);
      params.push(exemption.notes);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    
    const result = await queryOne<any>(
      `UPDATE "${TABLES.CUSTOMER_TAX_EXEMPTION}" SET ${sets.join(', ')} WHERE "customerTaxExemptionId" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax exemption with ID ${id} not found`);
    }
    
    
    return addId<CustomerTaxExemption>(result, 'customerTaxExemptionId');
  }

  async deleteTaxExemption(id: string): Promise<boolean> {
    const result = await queryOne<{ customerTaxExemptionId: string }>(
      `DELETE FROM "${TABLES.CUSTOMER_TAX_EXEMPTION}" WHERE "customerTaxExemptionId" = $1 RETURNING "customerTaxExemptionId"`,
      [id]
    );
    
    return !!result;
  }

  // Tax Settings methods
  async createTaxSettings(settings: Omit<TaxSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxSettings> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    
    // Use settings directly - DB uses camelCase
    
    const result = await queryOne<any>(
      `INSERT INTO "${TABLES.TAX_SETTINGS}" (
        "taxSettingsId", "merchantId", "calculationMethod", "pricesIncludeTax", 
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
        settings.merchantId,
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
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax settings');
    }
    
    
    return addId<TaxSettings>(result, 'taxSettingsId');
  }
  
  async updateTaxSettings(id: string, settings: Partial<Omit<TaxSettings, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'>>): Promise<TaxSettings> {
    const now = unixTimestamp();
    
    
    // Use settings directly - DB uses camelCase
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    if (settings.calculationMethod !== undefined) {
      sets.push(`"calculationMethod" = $${paramIndex++}`);
      params.push(settings.calculationMethod);
    }
    
    if (settings.pricesIncludeTax !== undefined) {
      sets.push(`"pricesIncludeTax" = $${paramIndex++}`);
      params.push(settings.pricesIncludeTax);
    }
    
    if (settings.displayPricesWithTax !== undefined) {
      sets.push(`"displayPricesWithTax" = $${paramIndex++}`);
      params.push(settings.displayPricesWithTax);
    }
    
    if (settings.taxBasedOn !== undefined) {
      sets.push(`"taxBasedOn" = $${paramIndex++}`);
      params.push(settings.taxBasedOn);
    }
    
    if (settings.shippingTaxClass !== undefined) {
      sets.push(`"shippingTaxClass" = $${paramIndex++}`);
      params.push(settings.shippingTaxClass);
    }
    
    if (settings.displayTaxTotals !== undefined) {
      sets.push(`"displayTaxTotals" = $${paramIndex++}`);
      params.push(settings.displayTaxTotals);
    }
    
    if (settings.applyTaxToShipping !== undefined) {
      sets.push(`"applyTaxToShipping" = $${paramIndex++}`);
      params.push(settings.applyTaxToShipping);
    }
    
    if (settings.applyDiscountBeforeTax !== undefined) {
      sets.push(`"applyDiscountBeforeTax" = $${paramIndex++}`);
      params.push(settings.applyDiscountBeforeTax);
    }
    
    if (settings.roundTaxAtSubtotal !== undefined) {
      sets.push(`"roundTaxAtSubtotal" = $${paramIndex++}`);
      params.push(settings.roundTaxAtSubtotal);
    }
    
    if (settings.taxDecimalPlaces !== undefined) {
      sets.push(`"taxDecimalPlaces" = $${paramIndex++}`);
      params.push(settings.taxDecimalPlaces);
    }
    
    if (settings.defaultTaxCategory !== undefined) {
      sets.push(`"defaultTaxCategory" = $${paramIndex++}`);
      params.push(settings.defaultTaxCategory);
    }
    
    if (settings.defaultTaxZone !== undefined) {
      sets.push(`"defaultTaxZone" = $${paramIndex++}`);
      params.push(settings.defaultTaxZone);
    }
    
    if (settings.taxProvider !== undefined) {
      sets.push(`"taxProvider" = $${paramIndex++}`);
      params.push(settings.taxProvider);
    }
    
    if (settings.taxProviderSettings !== undefined) {
      sets.push(`"taxProviderSettings" = $${paramIndex++}`);
      params.push(settings.taxProviderSettings);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    const result = await queryOne<any>(
      `UPDATE "${TABLES.TAX_SETTINGS}" SET ${sets.join(', ')} WHERE "taxSettingsId" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax settings with ID ${id} not found`);
    }
    
    
    return addId<TaxSettings>(result, 'taxSettingsId');
  }

  async deleteTaxSettings(id: string): Promise<boolean> {
    const result = await queryOne<{ taxSettingsId: string }>(
      `DELETE FROM "${TABLES.TAX_SETTINGS}" WHERE "taxSettingsId" = $1 RETURNING "taxSettingsId"`,
      [id]
    );
    
    return !!result;
  }
}