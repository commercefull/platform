import { unixTimestamp } from '../../../libs/date';
import { query, queryOne } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';
import { 
  TaxZone, TaxRate, TaxCategory, CustomerTaxExemption,
  TaxSettings
} from '../taxTypes';
import taxQueryRepo from './taxQueryRepo';

// Field mapping dictionaries for database to TypeScript conversion
const taxRateFields: Record<string, string> = {
  id: 'id',
  taxCategoryId: 'tax_category_id',
  taxZoneId: 'tax_zone_id',
  name: 'name',
  description: 'description',
  rate: 'rate',
  type: 'type',
  priority: 'priority',
  isCompound: 'is_compound',
  includeInPrice: 'include_in_price',
  isShippingTaxable: 'is_shipping_taxable',
  fixedAmount: 'fixed_amount',
  minimumAmount: 'minimum_amount',
  maximumAmount: 'maximum_amount',
  threshold: 'threshold',
  startDate: 'start_date',
  endDate: 'end_date',
  isActive: 'is_active',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const taxZoneFields: Record<string, string> = {
  id: 'id',
  name: 'name',
  code: 'code',
  description: 'description',
  isDefault: 'is_default',
  countries: 'countries',
  states: 'states',
  postcodes: 'postcodes',
  cities: 'cities',
  isActive: 'is_active',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const taxCategoryFields: Record<string, string> = {
  id: 'id',
  name: 'name',
  code: 'code',
  description: 'description',
  isDefault: 'is_default',
  sortOrder: 'sort_order',
  isActive: 'is_active',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const customerTaxExemptionFields: Record<string, string> = {
  id: 'id',
  customerId: 'customer_id',
  taxCategoryId: 'tax_category_id',
  exemptionNumber: 'exemption_number',
  exemptionType: 'exemption_type',
  issuingAuthority: 'issuing_authority',
  validFrom: 'start_date',
  validUntil: 'expiry_date',
  documentUrl: 'document_url',
  notes: 'notes',
  isVerified: 'is_verified',
  verifiedBy: 'verified_by',
  verifiedAt: 'verified_at',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const taxSettingsFields: Record<string, string> = {
  id: 'id',
  merchantId: 'merchant_id',
  calculationMethod: 'calculation_method',
  pricesIncludeTax: 'prices_include_tax',
  displayPricesWithTax: 'display_prices_with_tax',
  taxBasedOn: 'tax_based_on',
  shippingTaxClass: 'shipping_tax_class',
  displayTaxTotals: 'display_tax_totals',
  applyTaxToShipping: 'apply_tax_to_shipping',
  applyDiscountBeforeTax: 'apply_discount_before_tax',
  roundTaxAtSubtotal: 'round_tax_at_subtotal',
  taxDecimalPlaces: 'tax_decimal_places',
  defaultTaxCategory: 'default_tax_category',
  defaultTaxZone: 'default_tax_zone',
  taxProvider: 'tax_provider',
  taxProviderSettings: 'tax_provider_settings',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

/**
 * Transform a database record to a TypeScript object using field mapping
 */
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}

/**
 * Transform an array of database records to TypeScript objects
 */
function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  if (!dbRecords || !Array.isArray(dbRecords)) return [];
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap));
}

/**
 * Transform TypeScript object to database format (camelCase to snake_case)
 */
function transformTsToDb<T>(tsObject: any, fieldMap: Record<string, string>): T {
  if (!tsObject) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (tsObject[tsKey] !== undefined) {
      result[dbKey] = tsObject[tsKey];
    }
  });
  
  return result as T;
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
    
    // Transform TypeScript object to database format
    const dbTaxRate = transformTsToDb<any>(taxRate, taxRateFields);
    
    const result = await queryOne<any>(
      `INSERT INTO "public"."tax_rate" (
        "id", "tax_category_id", "tax_zone_id", "name", "description",
        "rate", "type", "priority", "is_compound", "include_in_price",
        "is_shipping_taxable", "fixed_amount", "minimum_amount", "maximum_amount",
        "threshold", "start_date", "end_date", "isActive", "metadata",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
        $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *`,
      [
        id,
        dbTaxRate.tax_category_id,
        dbTaxRate.tax_zone_id,
        dbTaxRate.name,
        dbTaxRate.description || null,
        dbTaxRate.rate,
        dbTaxRate.type,
        dbTaxRate.priority,
        dbTaxRate.is_compound,
        dbTaxRate.include_in_price,
        dbTaxRate.is_shipping_taxable,
        dbTaxRate.fixed_amount || null,
        dbTaxRate.minimum_amount || null,
        dbTaxRate.maximum_amount || null,
        dbTaxRate.threshold || null,
        dbTaxRate.start_date,
        dbTaxRate.end_date || null,
        dbTaxRate.is_active,
        dbTaxRate.metadata || null,
        now,
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax rate');
    }
    
    // Transform database record to TypeScript object
    return transformDbToTs<TaxRate>(result, taxRateFields);
  }

  async updateTaxRate(id: string, taxRate: Partial<Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxRate> {
    const now = unixTimestamp();
    
    // Transform TypeScript object to database format
    const dbTaxRate = transformTsToDb<any>(taxRate, taxRateFields);
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    // Use the database field names (snake_case) for updates
    if (dbTaxRate.tax_category_id !== undefined) {
      sets.push(`"tax_category_id" = $${paramIndex++}`);
      params.push(dbTaxRate.tax_category_id);
    }
    
    if (dbTaxRate.tax_zone_id !== undefined) {
      sets.push(`"tax_zone_id" = $${paramIndex++}`);
      params.push(dbTaxRate.tax_zone_id);
    }
    
    if (dbTaxRate.name !== undefined) {
      sets.push(`"name" = $${paramIndex++}`);
      params.push(dbTaxRate.name);
    }
    
    if (dbTaxRate.description !== undefined) {
      sets.push(`"description" = $${paramIndex++}`);
      params.push(dbTaxRate.description);
    }
    
    if (dbTaxRate.rate !== undefined) {
      sets.push(`"rate" = $${paramIndex++}`);
      params.push(dbTaxRate.rate);
    }
    
    if (dbTaxRate.type !== undefined) {
      sets.push(`"type" = $${paramIndex++}`);
      params.push(dbTaxRate.type);
    }
    
    if (dbTaxRate.priority !== undefined) {
      sets.push(`"priority" = $${paramIndex++}`);
      params.push(dbTaxRate.priority);
    }
    
    if (dbTaxRate.is_compound !== undefined) {
      sets.push(`"is_compound" = $${paramIndex++}`);
      params.push(dbTaxRate.is_compound);
    }
    
    if (dbTaxRate.include_in_price !== undefined) {
      sets.push(`"include_in_price" = $${paramIndex++}`);
      params.push(dbTaxRate.include_in_price);
    }
    
    if (dbTaxRate.is_shipping_taxable !== undefined) {
      sets.push(`"is_shipping_taxable" = $${paramIndex++}`);
      params.push(dbTaxRate.is_shipping_taxable);
    }
    
    if (dbTaxRate.fixed_amount !== undefined) {
      sets.push(`"fixed_amount" = $${paramIndex++}`);
      params.push(dbTaxRate.fixed_amount);
    }
    
    if (dbTaxRate.minimum_amount !== undefined) {
      sets.push(`"minimum_amount" = $${paramIndex++}`);
      params.push(dbTaxRate.minimum_amount);
    }
    
    if (dbTaxRate.maximum_amount !== undefined) {
      sets.push(`"maximum_amount" = $${paramIndex++}`);
      params.push(dbTaxRate.maximum_amount);
    }
    
    if (dbTaxRate.threshold !== undefined) {
      sets.push(`"threshold" = $${paramIndex++}`);
      params.push(dbTaxRate.threshold);
    }
    
    if (dbTaxRate.start_date !== undefined) {
      sets.push(`"start_date" = $${paramIndex++}`);
      params.push(dbTaxRate.start_date);
    }
    
    if (dbTaxRate.end_date !== undefined) {
      sets.push(`"end_date" = $${paramIndex++}`);
      params.push(dbTaxRate.end_date);
    }
    
    if (dbTaxRate.is_active !== undefined) {
      sets.push(`"isActive" = $${paramIndex++}`);
      params.push(dbTaxRate.is_active);
    }
    
    if (dbTaxRate.metadata !== undefined) {
      sets.push(`"metadata" = $${paramIndex++}`);
      params.push(dbTaxRate.metadata);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Get all columns directly, and then transform to TypeScript objects
    const result = await queryOne<any>(
      `UPDATE "public"."tax_rate" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax rate with ID ${id} not found`);
    }
    
    // Transform database record to TypeScript object
    return transformDbToTs<TaxRate>(result, taxRateFields);
  }

  async deleteTaxRate(id: string): Promise<boolean> {
    // For delete operations, we're just returning a boolean indicator of success
    // No need for transformation in this case
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
    
    // Transform TypeScript object to database format
    const dbCategory = transformTsToDb<any>(category, taxCategoryFields);
    
    const result = await queryOne<any>(
      `INSERT INTO "public"."tax_category" (
        "id", "name", "code", "description", "isDefault", "sort_order",
        "isActive", "metadata", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING *`,
      [
        id,
        dbCategory.name,
        dbCategory.code,
        dbCategory.description || null,
        dbCategory.is_default,
        dbCategory.sort_order,
        dbCategory.is_active,
        dbCategory.metadata || null,
        now,
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax category');
    }
    
    // Transform database record to TypeScript object
    return transformDbToTs<TaxCategory>(result, taxCategoryFields);
  }

  async updateTaxCategory(id: string, category: Partial<Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxCategory> {
    const now = unixTimestamp();
    
    // Transform TypeScript object to database format
    const dbCategory = transformTsToDb<any>(category, taxCategoryFields);
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    if (dbCategory.name !== undefined) {
      sets.push(`"name" = $${paramIndex++}`);
      params.push(dbCategory.name);
    }
    
    if (dbCategory.code !== undefined) {
      sets.push(`"code" = $${paramIndex++}`);
      params.push(dbCategory.code);
    }
    
    if (dbCategory.description !== undefined) {
      sets.push(`"description" = $${paramIndex++}`);
      params.push(dbCategory.description);
    }
    
    if (dbCategory.is_default !== undefined) {
      sets.push(`"isDefault" = $${paramIndex++}`);
      params.push(dbCategory.is_default);
    }
    
    if (dbCategory.sort_order !== undefined) {
      sets.push(`"sort_order" = $${paramIndex++}`);
      params.push(dbCategory.sort_order);
    }
    
    if (dbCategory.is_active !== undefined) {
      sets.push(`"isActive" = $${paramIndex++}`);
      params.push(dbCategory.is_active);
    }
    
    if (dbCategory.metadata !== undefined) {
      sets.push(`"metadata" = $${paramIndex++}`);
      params.push(dbCategory.metadata);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Get all columns directly, and then transform to TypeScript objects
    const result = await queryOne<any>(
      `UPDATE "public"."tax_category" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax category with ID ${id} not found`);
    }
    
    // Transform database record to TypeScript object
    return transformDbToTs<TaxCategory>(result, taxCategoryFields);
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
    
    // Transform TypeScript object to database format
    const dbTaxZone = transformTsToDb<any>(taxZone, taxZoneFields);
    
    const result = await queryOne<any>(
      `INSERT INTO "public"."tax_zone" (
        "id", "name", "code", "description", "isDefault", "countries", "states", 
        "postcodes", "cities", "isActive", "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        id, 
        dbTaxZone.name, 
        dbTaxZone.code, 
        dbTaxZone.description || null, 
        dbTaxZone.is_default, 
        dbTaxZone.countries, 
        dbTaxZone.states || [], 
        dbTaxZone.postcodes || [], 
        dbTaxZone.cities || [], 
        dbTaxZone.is_active,
        dbTaxZone.metadata || null,
        now, 
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax zone');
    }
    
    // Transform database record to TypeScript object
    return transformDbToTs<TaxZone>(result, taxZoneFields);
  }

  async updateTaxZone(id: string, taxZone: Partial<Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxZone> {
    const now = unixTimestamp();
    
    // Transform TypeScript object to database format
    const dbTaxZone = transformTsToDb<any>(taxZone, taxZoneFields);
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    if (dbTaxZone.name !== undefined) {
      sets.push(`"name" = $${paramIndex++}`);
      params.push(dbTaxZone.name);
    }
    
    if (dbTaxZone.code !== undefined) {
      sets.push(`"code" = $${paramIndex++}`);
      params.push(dbTaxZone.code);
    }
    
    if (dbTaxZone.description !== undefined) {
      sets.push(`"description" = $${paramIndex++}`);
      params.push(dbTaxZone.description);
    }
    
    if (dbTaxZone.is_default !== undefined) {
      sets.push(`"isDefault" = $${paramIndex++}`);
      params.push(dbTaxZone.is_default);
    }
    
    if (dbTaxZone.countries !== undefined) {
      sets.push(`"countries" = $${paramIndex++}`);
      params.push(dbTaxZone.countries);
    }
    
    if (dbTaxZone.states !== undefined) {
      sets.push(`"states" = $${paramIndex++}`);
      params.push(dbTaxZone.states);
    }
    
    if (dbTaxZone.postcodes !== undefined) {
      sets.push(`"postcodes" = $${paramIndex++}`);
      params.push(dbTaxZone.postcodes);
    }
    
    if (dbTaxZone.cities !== undefined) {
      sets.push(`"cities" = $${paramIndex++}`);
      params.push(dbTaxZone.cities);
    }
    
    if (dbTaxZone.is_active !== undefined) {
      sets.push(`"isActive" = $${paramIndex++}`);
      params.push(dbTaxZone.is_active);
    }
    
    if (dbTaxZone.metadata !== undefined) {
      sets.push(`"metadata" = $${paramIndex++}`);
      params.push(dbTaxZone.metadata);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Get all columns directly, and then transform to TypeScript objects
    const result = await queryOne<any>(
      `UPDATE "public"."tax_zone" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax zone with ID ${id} not found`);
    }
    
    // Transform database record to TypeScript object
    return transformDbToTs<TaxZone>(result, taxZoneFields);
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
    
    // Transform TypeScript object to database format
    const dbExemption = transformTsToDb<any>(exemption, customerTaxExemptionFields);
    
    const result = await queryOne<any>(
      `INSERT INTO "public"."customer_tax_exemption" (
        "id", "customerId", "tax_category_id", "exemption_type", "status", 
        "exemption_number", "issuing_authority", "document_url", 
        "start_date", "expiry_date", "isVerified", "verified_by", 
        "verified_at", "notes", "metadata", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *`,
      [
        id,
        dbExemption.customer_id,
        dbExemption.tax_category_id || null,
        dbExemption.exemption_type,
        dbExemption.status,
        dbExemption.exemption_number,
        dbExemption.issuing_authority || null,
        dbExemption.document_url || null,
        dbExemption.start_date,
        dbExemption.expiry_date || null,
        dbExemption.is_verified,
        dbExemption.verified_by || null,
        dbExemption.verified_at || null,
        dbExemption.notes || null,
        dbExemption.metadata || null,
        now,
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax exemption');
    }
    
    // Transform database record to TypeScript object
    return transformDbToTs<CustomerTaxExemption>(result, customerTaxExemptionFields);
  }

  async updateTaxExemption(
    id: string, 
    exemption: Partial<Omit<CustomerTaxExemption, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>
  ): Promise<CustomerTaxExemption> {
    const now = unixTimestamp();
    
    // Transform TypeScript object to database format
    const dbExemption = transformTsToDb<any>(exemption, customerTaxExemptionFields);
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    if (dbExemption.tax_category_id !== undefined) {
      sets.push(`"tax_category_id" = $${paramIndex++}`);
      params.push(dbExemption.tax_category_id);
    }
    
    if (dbExemption.exemption_type !== undefined) {
      sets.push(`"exemption_type" = $${paramIndex++}`);
      params.push(dbExemption.exemption_type);
    }
    
    if (dbExemption.status !== undefined) {
      sets.push(`"status" = $${paramIndex++}`);
      params.push(dbExemption.status);
    }
    
    if (dbExemption.exemption_number !== undefined) {
      sets.push(`"exemption_number" = $${paramIndex++}`);
      params.push(dbExemption.exemption_number);
    }
    
    if (dbExemption.issuing_authority !== undefined) {
      sets.push(`"issuing_authority" = $${paramIndex++}`);
      params.push(dbExemption.issuing_authority);
    }
    
    if (dbExemption.document_url !== undefined) {
      sets.push(`"document_url" = $${paramIndex++}`);
      params.push(dbExemption.document_url);
    }
    
    if (dbExemption.start_date !== undefined) {
      sets.push(`"start_date" = $${paramIndex++}`);
      params.push(dbExemption.start_date);
    }
    
    if (dbExemption.expiry_date !== undefined) {
      sets.push(`"expiry_date" = $${paramIndex++}`);
      params.push(dbExemption.expiry_date);
    }
    
    if (dbExemption.is_verified !== undefined) {
      sets.push(`"isVerified" = $${paramIndex++}`);
      params.push(dbExemption.is_verified);
    }
    
    if (dbExemption.verified_by !== undefined) {
      sets.push(`"verified_by" = $${paramIndex++}`);
      params.push(dbExemption.verified_by);
    }
    
    if (dbExemption.verified_at !== undefined) {
      sets.push(`"verified_at" = $${paramIndex++}`);
      params.push(dbExemption.verified_at);
    }
    
    if (dbExemption.notes !== undefined) {
      sets.push(`"notes" = $${paramIndex++}`);
      params.push(dbExemption.notes);
    }
    
    if (dbExemption.metadata !== undefined) {
      sets.push(`"metadata" = $${paramIndex++}`);
      params.push(dbExemption.metadata);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Get all columns directly, and then transform to TypeScript objects
    const result = await queryOne<any>(
      `UPDATE "public"."customer_tax_exemption" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax exemption with ID ${id} not found`);
    }
    
    // Transform database record to TypeScript object
    return transformDbToTs<CustomerTaxExemption>(result, customerTaxExemptionFields);
  }

  async deleteTaxExemption(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."customer_tax_exemption" WHERE "id" = $1 RETURNING id',
      [id]
    );
    
    return !!result;
  }

  // Tax Settings methods
  async createTaxSettings(settings: Omit<TaxSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxSettings> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    // Transform TypeScript object to database format
    const dbSettings = transformTsToDb<any>(settings, taxSettingsFields);
    
    const result = await queryOne<any>(
      `INSERT INTO "public"."tax_settings" (
        "id", "merchantId", "calculation_method", "prices_include_tax", 
        "display_prices_with_tax", "tax_based_on", "shipping_tax_class", 
        "display_tax_totals", "apply_tax_to_shipping", "apply_discount_before_tax", 
        "round_tax_at_subtotal", "tax_decimal_places", "default_tax_category", 
        "default_tax_zone", "tax_provider", "tax_provider_settings", 
        "metadata", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        id,
        dbSettings.merchant_id,
        dbSettings.calculation_method,
        dbSettings.prices_include_tax,
        dbSettings.display_prices_with_tax,
        dbSettings.tax_based_on,
        dbSettings.shipping_tax_class || null,
        dbSettings.display_tax_totals,
        dbSettings.apply_tax_to_shipping,
        dbSettings.apply_discount_before_tax,
        dbSettings.round_tax_at_subtotal,
        dbSettings.tax_decimal_places,
        dbSettings.default_tax_category || null,
        dbSettings.default_tax_zone || null,
        dbSettings.tax_provider || null,
        dbSettings.tax_provider_settings || null,
        dbSettings.metadata || null,
        now,
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax settings');
    }
    
    // Transform database record to TypeScript object
    return transformDbToTs<TaxSettings>(result, taxSettingsFields);
  }
  
  async updateTaxSettings(id: string, settings: Partial<Omit<TaxSettings, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'>>): Promise<TaxSettings> {
    const now = unixTimestamp();
    
    // Transform TypeScript object to database format
    const dbSettings = transformTsToDb<any>(settings, taxSettingsFields);
    
    // Build update fields dynamically
    const sets: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    if (dbSettings.calculation_method !== undefined) {
      sets.push(`"calculation_method" = $${paramIndex++}`);
      params.push(dbSettings.calculation_method);
    }
    
    if (dbSettings.prices_include_tax !== undefined) {
      sets.push(`"prices_include_tax" = $${paramIndex++}`);
      params.push(dbSettings.prices_include_tax);
    }
    
    if (dbSettings.display_prices_with_tax !== undefined) {
      sets.push(`"display_prices_with_tax" = $${paramIndex++}`);
      params.push(dbSettings.display_prices_with_tax);
    }
    
    if (dbSettings.tax_based_on !== undefined) {
      sets.push(`"tax_based_on" = $${paramIndex++}`);
      params.push(dbSettings.tax_based_on);
    }
    
    if (dbSettings.shipping_tax_class !== undefined) {
      sets.push(`"shipping_tax_class" = $${paramIndex++}`);
      params.push(dbSettings.shipping_tax_class);
    }
    
    if (dbSettings.display_tax_totals !== undefined) {
      sets.push(`"display_tax_totals" = $${paramIndex++}`);
      params.push(dbSettings.display_tax_totals);
    }
    
    if (dbSettings.apply_tax_to_shipping !== undefined) {
      sets.push(`"apply_tax_to_shipping" = $${paramIndex++}`);
      params.push(dbSettings.apply_tax_to_shipping);
    }
    
    if (dbSettings.apply_discount_before_tax !== undefined) {
      sets.push(`"apply_discount_before_tax" = $${paramIndex++}`);
      params.push(dbSettings.apply_discount_before_tax);
    }
    
    if (dbSettings.round_tax_at_subtotal !== undefined) {
      sets.push(`"round_tax_at_subtotal" = $${paramIndex++}`);
      params.push(dbSettings.round_tax_at_subtotal);
    }
    
    if (dbSettings.tax_decimal_places !== undefined) {
      sets.push(`"tax_decimal_places" = $${paramIndex++}`);
      params.push(dbSettings.tax_decimal_places);
    }
    
    if (dbSettings.default_tax_category !== undefined) {
      sets.push(`"default_tax_category" = $${paramIndex++}`);
      params.push(dbSettings.default_tax_category);
    }
    
    if (dbSettings.default_tax_zone !== undefined) {
      sets.push(`"default_tax_zone" = $${paramIndex++}`);
      params.push(dbSettings.default_tax_zone);
    }
    
    if (dbSettings.tax_provider !== undefined) {
      sets.push(`"tax_provider" = $${paramIndex++}`);
      params.push(dbSettings.tax_provider);
    }
    
    if (dbSettings.tax_provider_settings !== undefined) {
      sets.push(`"tax_provider_settings" = $${paramIndex++}`);
      params.push(dbSettings.tax_provider_settings);
    }
    
    if (dbSettings.metadata !== undefined) {
      sets.push(`"metadata" = $${paramIndex++}`);
      params.push(dbSettings.metadata);
    }
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${paramIndex++}`);
    params.push(now);
    
    if (sets.length === 0) {
      throw new Error('No fields to update');
    }
    
    const result = await queryOne<any>(
      `UPDATE "public"."tax_settings" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Tax settings with ID ${id} not found`);
    }
    
    // Transform database record to TypeScript object
    return transformDbToTs<TaxSettings>(result, taxSettingsFields);
  }

  async deleteTaxSettings(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."tax_settings" WHERE "id" = $1 RETURNING id',
      [id]
    );
    
    return !!result;
  }
}