import { unixTimestamp } from '../../../libs/date';
import { query, queryOne } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';
import { 
  TaxZone, TaxRate, TaxCategory, CustomerTaxExemption,
  TaxSettings
} from '../taxTypes';
import taxQueryRepo from './taxQueryRepo';

/**
 * Repository for tax-related data manipulation operations only
 * Following the Command Query Responsibility Segregation (CQRS) pattern
 */
export class TaxCommandRepo {
  // Tax Rate command methods
  async createTaxRate(taxRate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxRate> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const result = await queryOne<TaxRate>(
      `INSERT INTO "public"."tax_rate" (
        "id", "tax_category_id", "tax_zone_id", "name", "description",
        "rate", "type", "priority", "is_compound", "include_in_price",
        "is_shipping_taxable", "fixed_amount", "minimum_amount", "maximum_amount",
        "threshold", "start_date", "end_date", "is_active", "metadata",
        "created_at", "updated_at"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
        $15, $16, $17, $18, $19, $20, $21
      ) RETURNING 
        id,
        tax_category_id AS "taxCategoryId",
        tax_zone_id AS "taxZoneId",
        name,
        description,
        rate,
        type,
        priority,
        is_compound AS "isCompound",
        include_in_price AS "includeInPrice", 
        is_shipping_taxable AS "isShippingTaxable",
        fixed_amount AS "fixedAmount",
        minimum_amount AS "minimumAmount",
        maximum_amount AS "maximumAmount",
        threshold,
        start_date AS "startDate",
        end_date AS "endDate",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        id,
        taxRate.taxCategoryId,
        taxRate.taxZoneId,
        taxRate.name,
        taxRate.description || null,
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
        taxRate.metadata || null,
        now,
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax rate');
    }
    
    return result;
  }

  async updateTaxRate(id: string, taxRate: Partial<Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxRate> {
    const now = unixTimestamp();
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    if (taxRate.taxCategoryId !== undefined) {
      sets.push(`"tax_category_id" = $${paramIndex++}`);
      params.push(taxRate.taxCategoryId);
    }
    
    if (taxRate.taxZoneId !== undefined) {
      sets.push(`"tax_zone_id" = $${paramIndex++}`);
      params.push(taxRate.taxZoneId);
    }
    
    if (taxRate.name !== undefined) {
      sets.push(`"name" = $${paramIndex++}`);
      params.push(taxRate.name);
    }
    
    if (taxRate.description !== undefined) {
      sets.push(`"description" = $${paramIndex++}`);
      params.push(taxRate.description);
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
      sets.push(`"is_compound" = $${paramIndex++}`);
      params.push(taxRate.isCompound);
    }
    
    if (taxRate.includeInPrice !== undefined) {
      sets.push(`"include_in_price" = $${paramIndex++}`);
      params.push(taxRate.includeInPrice);
    }
    
    if (taxRate.isShippingTaxable !== undefined) {
      sets.push(`"is_shipping_taxable" = $${paramIndex++}`);
      params.push(taxRate.isShippingTaxable);
    }
    
    if (taxRate.fixedAmount !== undefined) {
      sets.push(`"fixed_amount" = $${paramIndex++}`);
      params.push(taxRate.fixedAmount);
    }
    
    if (taxRate.minimumAmount !== undefined) {
      sets.push(`"minimum_amount" = $${paramIndex++}`);
      params.push(taxRate.minimumAmount);
    }
    
    if (taxRate.maximumAmount !== undefined) {
      sets.push(`"maximum_amount" = $${paramIndex++}`);
      params.push(taxRate.maximumAmount);
    }
    
    if (taxRate.threshold !== undefined) {
      sets.push(`"threshold" = $${paramIndex++}`);
      params.push(taxRate.threshold);
    }
    
    if (taxRate.startDate !== undefined) {
      sets.push(`"start_date" = $${paramIndex++}`);
      params.push(taxRate.startDate);
    }
    
    if (taxRate.endDate !== undefined) {
      sets.push(`"end_date" = $${paramIndex++}`);
      params.push(taxRate.endDate);
    }
    
    if (taxRate.isActive !== undefined) {
      sets.push(`"is_active" = $${paramIndex++}`);
      params.push(taxRate.isActive);
    }
    
    if (taxRate.metadata !== undefined) {
      sets.push(`"metadata" = $${paramIndex++}`);
      params.push(taxRate.metadata);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updated_at" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    const result = await queryOne<TaxRate>(
      `UPDATE "public"."tax_rate" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING 
        id,
        tax_category_id AS "taxCategoryId",
        tax_zone_id AS "taxZoneId",
        name,
        description,
        rate,
        type,
        priority,
        is_compound AS "isCompound",
        include_in_price AS "includeInPrice", 
        is_shipping_taxable AS "isShippingTaxable",
        fixed_amount AS "fixedAmount",
        minimum_amount AS "minimumAmount",
        maximum_amount AS "maximumAmount",
        threshold,
        start_date AS "startDate",
        end_date AS "endDate",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax rate with ID ${id} not found`);
    }
    
    return result;
  }

  async deleteTaxRate(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."tax_rate" WHERE "id" = $1 RETURNING id',
      [id]
    );
    
    return !!result;
  }

  // Tax Category command methods
  async createTaxCategory(category: Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxCategory> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const result = await queryOne<TaxCategory>(
      `INSERT INTO "public"."tax_category" (
        "id", "name", "code", "description", "is_default", "sort_order", "is_active", 
        "metadata", "created_at", "updated_at"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING 
        id,
        name,
        code,
        description,
        is_default AS "isDefault",
        sort_order AS "sortOrder",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        id, 
        category.name, 
        category.code, 
        category.description || null, 
        category.isDefault, 
        category.sortOrder, 
        category.isActive, 
        category.metadata || null,
        now, 
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax category');
    }
    
    return result;
  }

  async updateTaxCategory(id: string, category: Partial<Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxCategory> {
    const now = unixTimestamp();
    
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
      sets.push(`"is_default" = $${paramIndex++}`);
      params.push(category.isDefault);
    }
    
    if (category.sortOrder !== undefined) {
      sets.push(`"sort_order" = $${paramIndex++}`);
      params.push(category.sortOrder);
    }
    
    if (category.isActive !== undefined) {
      sets.push(`"is_active" = $${paramIndex++}`);
      params.push(category.isActive);
    }
    
    if (category.metadata !== undefined) {
      sets.push(`"metadata" = $${paramIndex++}`);
      params.push(category.metadata);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updated_at" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    const result = await queryOne<TaxCategory>(
      `UPDATE "public"."tax_category" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING 
        id,
        name,
        code,
        description,
        is_default AS "isDefault",
        sort_order AS "sortOrder",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax category with ID ${id} not found`);
    }
    
    return result;
  }

  async deleteTaxCategory(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."tax_category" WHERE "id" = $1 RETURNING id',
      [id]
    );
    
    return !!result;
  }

  // Tax Zone command methods
  async createTaxZone(taxZone: Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxZone> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const result = await queryOne<TaxZone>(
      `INSERT INTO "public"."tax_zone" (
        "id", "name", "code", "description", "is_default", "countries", "states", 
        "postcodes", "cities", "is_active", "created_at", "updated_at"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING 
        id,
        name,
        code,
        description,
        is_default AS "isDefault",
        countries,
        states,
        postcodes,
        cities,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        id, 
        taxZone.name, 
        taxZone.code, 
        taxZone.description || null, 
        taxZone.isDefault, 
        taxZone.countries, 
        taxZone.states || [], 
        taxZone.postcodes || [], 
        taxZone.cities || [], 
        taxZone.isActive,
        now, 
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax zone');
    }
    
    return result;
  }

  async updateTaxZone(id: string, taxZone: Partial<Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxZone> {
    const now = unixTimestamp();
    
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
      sets.push(`"is_default" = $${paramIndex++}`);
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
      sets.push(`"is_active" = $${paramIndex++}`);
      params.push(taxZone.isActive);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updated_at" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    const result = await queryOne<TaxZone>(
      `UPDATE "public"."tax_zone" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING 
        id,
        name,
        code,
        description,
        is_default AS "isDefault",
        countries,
        states,
        postcodes,
        cities,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax zone with ID ${id} not found`);
    }
    
    return result;
  }

  async deleteTaxZone(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."tax_zone" WHERE "id" = $1 RETURNING id',
      [id]
    );
    
    return !!result;
  }

  // Tax Exemption command methods
  async createTaxExemption(exemption: Omit<CustomerTaxExemption, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerTaxExemption> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const result = await queryOne<CustomerTaxExemption>(
      `INSERT INTO "public"."customer_tax_exemption" (
        "id", "customer_id", "tax_zone_id", "type", "status", "name", 
        "exemption_number", "business_name", "exemption_reason", "document_url", 
        "start_date", "expiry_date", "is_verified", "verified_by", 
        "verified_at", "notes", "metadata", "created_at", "updated_at"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING 
        id,
        customer_id AS "customerId",
        tax_zone_id AS "taxZoneId",
        type,
        status,
        name,
        exemption_number AS "exemptionNumber",
        business_name AS "businessName",
        exemption_reason AS "exemptionReason",
        document_url AS "documentUrl",
        start_date AS "startDate",
        expiry_date AS "expiryDate",
        is_verified AS "isVerified",
        verified_by AS "verifiedBy",
        verified_at AS "verifiedAt",
        notes,
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
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
        exemption.metadata || null,
        now,
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax exemption');
    }
    
    return result;
  }

  async updateTaxExemption(
    id: string, 
    exemption: Partial<Omit<CustomerTaxExemption, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>
  ): Promise<CustomerTaxExemption> {
    const now = unixTimestamp();
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    if (exemption.taxZoneId !== undefined) {
      sets.push(`"tax_zone_id" = $${paramIndex++}`);
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
      sets.push(`"exemption_number" = $${paramIndex++}`);
      params.push(exemption.exemptionNumber);
    }
    
    if (exemption.businessName !== undefined) {
      sets.push(`"business_name" = $${paramIndex++}`);
      params.push(exemption.businessName);
    }
    
    if (exemption.exemptionReason !== undefined) {
      sets.push(`"exemption_reason" = $${paramIndex++}`);
      params.push(exemption.exemptionReason);
    }
    
    if (exemption.documentUrl !== undefined) {
      sets.push(`"document_url" = $${paramIndex++}`);
      params.push(exemption.documentUrl);
    }
    
    if (exemption.startDate !== undefined) {
      sets.push(`"start_date" = $${paramIndex++}`);
      params.push(exemption.startDate);
    }
    
    if (exemption.expiryDate !== undefined) {
      sets.push(`"expiry_date" = $${paramIndex++}`);
      params.push(exemption.expiryDate);
    }
    
    if (exemption.isVerified !== undefined) {
      sets.push(`"is_verified" = $${paramIndex++}`);
      params.push(exemption.isVerified);
    }
    
    if (exemption.verifiedBy !== undefined) {
      sets.push(`"verified_by" = $${paramIndex++}`);
      params.push(exemption.verifiedBy);
    }
    
    if (exemption.verifiedAt !== undefined) {
      sets.push(`"verified_at" = $${paramIndex++}`);
      params.push(exemption.verifiedAt);
    }
    
    if (exemption.notes !== undefined) {
      sets.push(`"notes" = $${paramIndex++}`);
      params.push(exemption.notes);
    }
    
    if (exemption.metadata !== undefined) {
      sets.push(`"metadata" = $${paramIndex++}`);
      params.push(exemption.metadata);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updated_at" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    const result = await queryOne<CustomerTaxExemption>(
      `UPDATE "public"."customer_tax_exemption" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING 
        id,
        customer_id AS "customerId",
        tax_zone_id AS "taxZoneId",
        type,
        status,
        name,
        exemption_number AS "exemptionNumber",
        business_name AS "businessName",
        exemption_reason AS "exemptionReason",
        document_url AS "documentUrl",
        start_date AS "startDate",
        expiry_date AS "expiryDate",
        is_verified AS "isVerified",
        verified_by AS "verifiedBy",
        verified_at AS "verifiedAt",
        notes,
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax exemption with ID ${id} not found`);
    }
    
    return result;
  }

  async deleteTaxExemption(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."customer_tax_exemption" WHERE "id" = $1 RETURNING id',
      [id]
    );
    
    return !!result;
  }

  // Tax Settings command methods
  async createOrUpdateTaxSettings(settings: Omit<TaxSettings, 'createdAt' | 'updatedAt'>): Promise<TaxSettings> {
    const now = unixTimestamp();
    
    // Check if settings already exist for this merchant
    const existingSettings = await taxQueryRepo.findTaxSettingsByMerchantId(settings.merchantId);
    
    if (existingSettings) {
      // Update existing settings
      return await this.updateTaxSettings(existingSettings.id, settings);
    } else {
      // Create new settings
      const id = settings.id || generateUUID();
      
      const result = await queryOne<TaxSettings>(
        `INSERT INTO "public"."tax_settings" (
          "id", "merchant_id", "calculation_method", "prices_include_tax", 
          "display_prices_with_tax", "tax_based_on", "shipping_tax_class", 
          "display_tax_totals", "apply_tax_to_shipping", "apply_discount_before_tax", 
          "round_tax_at_subtotal", "tax_decimal_places", "default_tax_category", 
          "default_tax_zone", "tax_provider", "tax_provider_settings", 
          "metadata", "created_at", "updated_at"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING 
          id,
          merchant_id AS "merchantId",
          calculation_method AS "calculationMethod",
          prices_include_tax AS "pricesIncludeTax",
          display_prices_with_tax AS "displayPricesWithTax",
          tax_based_on AS "taxBasedOn",
          shipping_tax_class AS "shippingTaxClass",
          display_tax_totals AS "displayTaxTotals",
          apply_tax_to_shipping AS "applyTaxToShipping",
          apply_discount_before_tax AS "applyDiscountBeforeTax",
          round_tax_at_subtotal AS "roundTaxAtSubtotal",
          tax_decimal_places AS "taxDecimalPlaces",
          default_tax_category AS "defaultTaxCategory",
          default_tax_zone AS "defaultTaxZone",
          tax_provider AS "taxProvider",
          tax_provider_settings AS "taxProviderSettings",
          metadata,
          created_at AS "createdAt",
          updated_at AS "updatedAt"`,
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
          settings.taxProvider || 'internal',
          settings.taxProviderSettings || null,
          settings.metadata || null,
          now,
          now
        ]
      );
      
      if (!result) {
        throw new Error('Failed to create tax settings');
      }
      
      return result;
    }
  }

  async updateTaxSettings(id: string, settings: Partial<Omit<TaxSettings, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxSettings> {
    const now = unixTimestamp();
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    if (settings.merchantId !== undefined) {
      sets.push(`"merchant_id" = $${paramIndex++}`);
      params.push(settings.merchantId);
    }
    
    if (settings.calculationMethod !== undefined) {
      sets.push(`"calculation_method" = $${paramIndex++}`);
      params.push(settings.calculationMethod);
    }
    
    if (settings.pricesIncludeTax !== undefined) {
      sets.push(`"prices_include_tax" = $${paramIndex++}`);
      params.push(settings.pricesIncludeTax);
    }
    
    if (settings.displayPricesWithTax !== undefined) {
      sets.push(`"display_prices_with_tax" = $${paramIndex++}`);
      params.push(settings.displayPricesWithTax);
    }
    
    if (settings.taxBasedOn !== undefined) {
      sets.push(`"tax_based_on" = $${paramIndex++}`);
      params.push(settings.taxBasedOn);
    }
    
    if (settings.shippingTaxClass !== undefined) {
      sets.push(`"shipping_tax_class" = $${paramIndex++}`);
      params.push(settings.shippingTaxClass);
    }
    
    if (settings.displayTaxTotals !== undefined) {
      sets.push(`"display_tax_totals" = $${paramIndex++}`);
      params.push(settings.displayTaxTotals);
    }
    
    if (settings.applyTaxToShipping !== undefined) {
      sets.push(`"apply_tax_to_shipping" = $${paramIndex++}`);
      params.push(settings.applyTaxToShipping);
    }
    
    if (settings.applyDiscountBeforeTax !== undefined) {
      sets.push(`"apply_discount_before_tax" = $${paramIndex++}`);
      params.push(settings.applyDiscountBeforeTax);
    }
    
    if (settings.roundTaxAtSubtotal !== undefined) {
      sets.push(`"round_tax_at_subtotal" = $${paramIndex++}`);
      params.push(settings.roundTaxAtSubtotal);
    }
    
    if (settings.taxDecimalPlaces !== undefined) {
      sets.push(`"tax_decimal_places" = $${paramIndex++}`);
      params.push(settings.taxDecimalPlaces);
    }
    
    if (settings.defaultTaxCategory !== undefined) {
      sets.push(`"default_tax_category" = $${paramIndex++}`);
      params.push(settings.defaultTaxCategory);
    }
    
    if (settings.defaultTaxZone !== undefined) {
      sets.push(`"default_tax_zone" = $${paramIndex++}`);
      params.push(settings.defaultTaxZone);
    }
    
    if (settings.taxProvider !== undefined) {
      sets.push(`"tax_provider" = $${paramIndex++}`);
      params.push(settings.taxProvider);
    }
    
    if (settings.taxProviderSettings !== undefined) {
      sets.push(`"tax_provider_settings" = $${paramIndex++}`);
      params.push(settings.taxProviderSettings);
    }
    
    if (settings.metadata !== undefined) {
      sets.push(`"metadata" = $${paramIndex++}`);
      params.push(settings.metadata);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updated_at" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    const result = await queryOne<TaxSettings>(
      `UPDATE "public"."tax_settings" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING 
        id,
        merchant_id AS "merchantId",
        calculation_method AS "calculationMethod",
        prices_include_tax AS "pricesIncludeTax",
        display_prices_with_tax AS "displayPricesWithTax",
        tax_based_on AS "taxBasedOn",
        shipping_tax_class AS "shippingTaxClass",
        display_tax_totals AS "displayTaxTotals",
        apply_tax_to_shipping AS "applyTaxToShipping",
        apply_discount_before_tax AS "applyDiscountBeforeTax",
        round_tax_at_subtotal AS "roundTaxAtSubtotal",
        tax_decimal_places AS "taxDecimalPlaces",
        default_tax_category AS "defaultTaxCategory",
        default_tax_zone AS "defaultTaxZone",
        tax_provider AS "taxProvider",
        tax_provider_settings AS "taxProviderSettings",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax settings with ID ${id} not found`);
    }
    
    return result;
  }

  async deleteTaxSettings(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."tax_settings" WHERE "id" = $1 RETURNING id',
      [id]
    );
    
    return !!result;
  }
}

// Export instance for use throughout the application
const taxCommandRepo = new TaxCommandRepo();
export default taxCommandRepo;
