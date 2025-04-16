import { query, queryOne } from '../../../libs/db';
import { 
  TaxZone, TaxRate, TaxCategory, CustomerTaxExemption,
  TaxSettings, AddressInput, TaxCalculationResult,
  TaxBreakdownItem, LineItemTax, TaxExemptionStatus
} from '../taxTypes';

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
 * Repository for tax-related read operations only
 * Following the Command Query Responsibility Segregation (CQRS) pattern
 */
export class TaxQueryRepo {
  // Tax Rate query methods
  async findTaxRateById(id: string): Promise<TaxRate | null> {
    const result = await queryOne<any>(
      `SELECT * FROM "public"."tax_rate" WHERE "id" = $1`,
      [id]
    );
    
    return transformDbToTs<TaxRate>(result, taxRateFields);
  }

  async findAllTaxRates(
    status: TaxRate['isActive'] = true,
    country?: string,
    region?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TaxRate[]> {
    const params: any[] = [status];
    let sql = `
      SELECT tr.*
      FROM "public"."tax_rate" tr
      JOIN "public"."tax_zone" tz ON tr."tax_zone_id" = tz."id"
      WHERE tr."is_active" = $1
    `;
    
    if (country) {
      sql += ` AND $2 = ANY(tz."countries")`;
      params.push(country);
    }
    
    if (region) {
      sql += ` AND $${params.length + 1} = ANY(tz."states")`;
      params.push(region);
    }
    
    sql += ` ORDER BY tr."priority" DESC, tr."rate" ASC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const results = await query<any[]>(sql, params);
    return transformArrayDbToTs<TaxRate>(results || [], taxRateFields);
  }
  
  async findTaxRatesByCategoryAndZone(
    categoryId: string,
    zoneId: string,
    status: TaxRate['isActive'] = true
  ): Promise<TaxRate[]> {
    const results = await query<any[]>(
      `SELECT * 
       FROM "public"."tax_rate" 
       WHERE "tax_category_id" = $1 
       AND "tax_zone_id" = $2 
       AND "is_active" = $3
       ORDER BY "priority" DESC, "rate" ASC`,
      [categoryId, zoneId, status]
    );
    
    return transformArrayDbToTs<TaxRate>(results || [], taxRateFields);
  }

  // Tax Zone query methods
  async findTaxZoneById(id: string): Promise<TaxZone | null> {
    const result = await queryOne<any>(
      `SELECT * FROM "public"."tax_zone" WHERE "id" = $1`,
      [id]
    );
    
    return transformDbToTs<TaxZone>(result, taxZoneFields);
  }
  
  async findTaxZoneByCode(code: string): Promise<TaxZone | null> {
    const result = await queryOne<any>(
      `SELECT * FROM "public"."tax_zone" WHERE "code" = $1`,
      [code]
    );
    
    return transformDbToTs<TaxZone>(result, taxZoneFields);
  }
  
  async findAllTaxZones(
    status: TaxZone['isActive'] = true,
    limit: number = 50,
    offset: number = 0
  ): Promise<TaxZone[]> {
    const results = await query<any[]>(
      `SELECT * 
       FROM "public"."tax_zone" 
       WHERE "is_active" = $1
       ORDER BY "is_default" DESC, "name" ASC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    
    return transformArrayDbToTs<TaxZone>(results || [], taxZoneFields);
  }
  
  async findTaxZoneForAddress(
    country: string,
    state?: string,
    postalCode?: string,
    city?: string
  ): Promise<TaxZone | null> {
    let sql = `
      SELECT * FROM "public"."tax_zone"
      WHERE "is_active" = true
      AND $1 = ANY("countries")
    `;
    
    const params: any[] = [country];
    
    if (state) {
      sql += ` AND ($${params.length + 1} = ANY("states") OR "states" IS NULL OR array_length("states", 1) IS NULL)`;
      params.push(state);
    }
    
    if (postalCode) {
      sql += ` AND (
        $${params.length + 1} = ANY("postcodes") 
        OR EXISTS (
          SELECT 1 FROM unnest("postcodes") AS p 
          WHERE $${params.length + 1} LIKE p
        )
        OR "postcodes" IS NULL 
        OR array_length("postcodes", 1) IS NULL
      )`;
      params.push(postalCode);
    }
    
    if (city) {
      sql += ` AND (
        $${params.length + 1} = ANY("cities") 
        OR EXISTS (
          SELECT 1 FROM unnest("cities") AS c 
          WHERE LOWER($${params.length + 1}) = LOWER(c)
        )
        OR "cities" IS NULL 
        OR array_length("cities", 1) IS NULL
      )`;
      params.push(city);
    }
    
    sql += ` ORDER BY 
      (CASE WHEN $1 = ANY("countries") THEN 10 ELSE 0 END) +
      (CASE WHEN $2 = ANY("states") THEN 5 ELSE 0 END) +
      (CASE WHEN $3 = ANY("postcodes") THEN 3 ELSE 0 END) +
      (CASE WHEN $4 = ANY("cities") THEN 2 ELSE 0 END) DESC,
      "is_default" DESC
      LIMIT 1`;
    
    const result = await queryOne<any>(sql, params);
    return transformDbToTs<TaxZone>(result, taxZoneFields);
  }

  // Tax Category query methods
  async findTaxCategoryById(id: string): Promise<TaxCategory | null> {
    const result = await queryOne<any>(
      `SELECT * FROM "public"."tax_category" WHERE "id" = $1`,
      [id]
    );
    
    return transformDbToTs<TaxCategory>(result, taxCategoryFields);
  }
  
  async findTaxCategoryByCode(code: string): Promise<TaxCategory | null> {
    const result = await queryOne<any>(
      `SELECT * FROM "public"."tax_category" WHERE "code" = $1`,
      [code]
    );
    
    return transformDbToTs<TaxCategory>(result, taxCategoryFields);
  }
  
  async findAllTaxCategories(
    status: TaxCategory['isActive'] = true,
    limit: number = 50,
    offset: number = 0
  ): Promise<TaxCategory[]> {
    const results = await query<any[]>(
      `SELECT * 
       FROM "public"."tax_category" 
       WHERE "is_active" = $1
       ORDER BY "sort_order" ASC, "name" ASC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    
    return transformArrayDbToTs<TaxCategory>(results || [], taxCategoryFields);
  }
  
  async findDefaultTaxCategory(): Promise<TaxCategory | null> {
    const result = await queryOne<any>(
      `SELECT * 
       FROM "public"."tax_category" 
       WHERE "is_default" = true AND "is_active" = true
       LIMIT 1`
    );
    
    return transformDbToTs<TaxCategory>(result, taxCategoryFields);
  }

  // Customer Tax Exemption query methods
  async findCustomerTaxExemptions(
    customerId: string,
    status: TaxExemptionStatus = 'active'
  ): Promise<CustomerTaxExemption[]> {
    const results = await query<any[]>(
      `SELECT * 
       FROM "public"."customer_tax_exemption" 
       WHERE "customer_id" = $1 
       AND "status" = $2
       AND ("expiry_date" IS NULL OR "expiry_date" > CURRENT_TIMESTAMP)
       ORDER BY "tax_category_id", "start_date" DESC`,
      [customerId, status]
    );
    
    return transformArrayDbToTs<CustomerTaxExemption>(results || [], customerTaxExemptionFields);
  }
  
  async findCustomerExemptionsByCategory(
    customerId: string,
    taxCategoryId: string,
    status: TaxExemptionStatus = 'active'
  ): Promise<CustomerTaxExemption[]> {
    const results = await query<any[]>(
      `SELECT * 
       FROM "public"."customer_tax_exemption" 
       WHERE "customer_id" = $1 
       AND "tax_category_id" = $2
       AND "status" = $3
       AND ("expiry_date" IS NULL OR "expiry_date" > CURRENT_TIMESTAMP)
       ORDER BY "start_date" DESC`,
      [customerId, taxCategoryId, status]
    );
    
    return transformArrayDbToTs<CustomerTaxExemption>(results || [], customerTaxExemptionFields);
  }
  
  /**
   * Get tax rate for a specific address
   * This method determines the applicable tax rate based on location data
   */
  async getTaxRateForAddress(address: AddressInput): Promise<number> {
    // Find the appropriate tax zone for this address
    const taxZone = await this.findTaxZoneForAddress(
      address.country,
      address.region,
      address.postalCode,
      address.city
    );
    
    if (!taxZone) {
      // No applicable tax zone found, return default rate (0%)
      return 0;
    }
    
    // Get the default tax category (usually general/standard sales tax)
    const defaultCategory = await this.findDefaultTaxCategory();
    
    if (!defaultCategory) {
      // No default tax category defined, return default rate (0%)
      return 0;
    }
    
    // Find applicable tax rates for this zone and category
    const taxRates = await this.findTaxRatesByCategoryAndZone(
      defaultCategory.id,
      taxZone.id,
      true // Only active tax rates
    );
    
    if (!taxRates || taxRates.length === 0) {
      // No applicable tax rates found, return default rate (0%)
      return 0;
    }
    
    // Return the rate of the first applicable tax rate (highest priority)
    return taxRates[0].rate;
  }
  
  /**
   * Calculate tax for an order based on customer, location and items
   */
  async calculateTax(
    items: Array<{
      productId: string;
      taxCategoryId?: string;
      quantity: number;
      unitPrice: number;
      taxable?: boolean;
    }>,
    address: AddressInput,
    customerId?: string,
    shippingAmount: number = 0
  ): Promise<TaxCalculationResult> {
    // Implementation would go here - calculating taxes for multiple products
    // with potentially different tax categories and exemptions
    
    // For simplicity in this implementation, use the getTaxRateForAddress method
    const taxRate = await this.getTaxRateForAddress(address);
    
    let subtotal = 0;
    const lineItemTaxes: LineItemTax[] = [];
    
    // Calculate taxes for each line item
    for (const item of items) {
      const itemSubtotal = item.quantity * item.unitPrice;
      subtotal += itemSubtotal;
      
      if (item.taxable === false) {
        lineItemTaxes.push({
          lineItemId: item.productId, // Using productId as lineItem identifier
          productId: item.productId,
          taxAmount: 0,
          taxBreakdown: []
        });
      } else {
        const itemTaxAmount = itemSubtotal * (taxRate / 100);
        const itemTaxBreakdown = [{
          rateId: 'default',
          rateName: 'Default Tax Rate',
          rateValue: taxRate,
          taxableAmount: itemSubtotal,
          taxAmount: itemTaxAmount,
          jurisdictionLevel: 'national',
          jurisdictionName: address.country || 'Unknown'
        }];
        
        lineItemTaxes.push({
          lineItemId: item.productId, // Using productId as lineItem identifier
          productId: item.productId,
          taxAmount: itemTaxAmount,
          taxBreakdown: itemTaxBreakdown
        });
      }
    }
    
    // Calculate tax on shipping if applicable
    const shippingTaxAmount = shippingAmount * (taxRate / 100);
    
    // Sum up all taxes
    const totalTaxAmount = lineItemTaxes.reduce((sum, item) => sum + item.taxAmount, 0) + shippingTaxAmount;
    
    return {
      taxAmount: totalTaxAmount,
      subtotal,
      total: subtotal + shippingAmount + totalTaxAmount,
      taxBreakdown: [{
        rateId: 'default',
        rateName: 'Default Tax Rate',
        rateValue: taxRate,
        taxableAmount: subtotal + shippingAmount,
        taxAmount: totalTaxAmount,
        jurisdictionLevel: 'national',
        jurisdictionName: address.country || 'Unknown'
      }],
      lineItemTaxes
    };
  }
}

export default new TaxQueryRepo();
