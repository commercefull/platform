import { unixTimestamp } from '../../../libs/date';
import { query, queryOne } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';

// Tax Types
export type TaxCalculationMethod = 'unit_based' | 'row_based' | 'total_based';
export type TaxRateType = 'percentage' | 'fixed_amount' | 'compound' | 'combined';
export type TaxExemptionStatus = 'pending' | 'active' | 'expired' | 'revoked' | 'rejected';
export type TaxExemptionType = 'business' | 'government' | 'nonprofit' | 'educational' | 'reseller' | 'diplomatic' | 'other';
export type TaxCalculationStatus = 'pending' | 'completed' | 'failed' | 'adjusted' | 'refunded';
export type TaxTransactionSource = 'order' | 'invoice' | 'refund' | 'adjustment' | 'manual' | 'estimate';

export type TaxZone = {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  countries: string[];
  states?: string[];
  postcodes?: string[];
  cities?: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export type TaxRate = {
  id: string;
  taxCategoryId: string;
  taxZoneId: string;
  name: string;
  description?: string;
  rate: number;
  type: TaxRateType;
  priority: number;
  isCompound: boolean;
  includeInPrice: boolean;
  isShippingTaxable: boolean;
  fixedAmount?: number;
  minimumAmount?: number;
  maximumAmount?: number;
  threshold?: number;
  startDate: number;
  endDate?: number;
  isActive: boolean;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
};

export type TaxCategory = {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
};

export type CustomerTaxExemption = {
  id: string;
  customerId: string;
  taxZoneId?: string;
  type: TaxExemptionType;
  status: TaxExemptionStatus;
  name: string;
  exemptionNumber: string;
  businessName?: string;
  exemptionReason?: string;
  documentUrl?: string;
  startDate: number;
  expiryDate?: number;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: number;
  notes?: string;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
};

export type TaxSettings = {
  id: string;
  merchantId: string;
  calculationMethod: TaxCalculationMethod;
  pricesIncludeTax: boolean;
  displayPricesWithTax: boolean;
  taxBasedOn: 'shipping_address' | 'billing_address' | 'store_address' | 'origin_address';
  shippingTaxClass?: string;
  displayTaxTotals: 'itemized' | 'combined' | 'none';
  applyTaxToShipping: boolean;
  applyDiscountBeforeTax: boolean;
  roundTaxAtSubtotal: boolean;
  taxDecimalPlaces: number;
  defaultTaxCategory?: string;
  defaultTaxZone?: string;
  taxProvider?: 'internal' | 'avalara' | 'taxjar' | 'external';
  taxProviderSettings?: any;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
};

export type TaxBreakdownItem = {
  rateId: string;
  rateName: string;
  rateValue: number;
  taxableAmount: number;
  taxAmount: number;
  jurisdictionLevel: string;
  jurisdictionName: string;
};

export type LineItemTax = {
  lineItemId: string;
  productId: string;
  taxAmount: number;
  taxBreakdown: TaxBreakdownItem[];
};

export type TaxCalculationResult = {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxBreakdown: TaxBreakdownItem[];
  taxZoneApplied?: string;
  taxCategoryApplied?: string;
  calculationReference?: string;
  lineItemTaxes?: LineItemTax[];
};

export type AddressInput = {
  country: string;
  region?: string;
  city?: string;
  postalCode?: string;
};

export type TaxNexus = {
  id: string;
  merchantId: string;
  name: string;
  country: string;
  region?: string;
  regionCode?: string;
  city?: string;
  postalCode?: string;
  streetAddress?: string;
  taxId?: string;
  registrationNumber?: string;
  isDefault: boolean;
  startDate: number;
  endDate?: number;
  isActive: boolean;
  notes?: string;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
};

export class TaxRepo {
  // Tax Rate methods
  async findTaxRateById(id: string): Promise<TaxRate | null> {
    return await queryOne<TaxRate>('SELECT * FROM "public"."tax_rate" WHERE "id" = $1', [id]);
  }

  async findAllTaxRates(
    status: TaxRate['isActive'] = true,
    country?: string,
    region?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TaxRate[]> {
    let sql = 'SELECT * FROM "public"."tax_rate" WHERE "isActive" = $1';
    const params: any[] = [status];
    
    if (country) {
      sql += ' AND "country" = $' + (params.length + 1);
      params.push(country);
    }
    
    if (region) {
      sql += ' AND "region" = $' + (params.length + 1);
      params.push(region);
    }
    
    sql += ' ORDER BY "priority" DESC, "name" ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    return await query<TaxRate[]>(sql, params) || [];
  }

  async findTaxRatesByCategory(categoryId: string): Promise<TaxRate[]> {
    const sql = 'SELECT * FROM "public"."tax_rate" WHERE "taxCategoryId" = $1';
    return await query<TaxRate[]>(sql, [categoryId]) || [];
  }

  async createTaxRate(taxRate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxRate> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const result = await queryOne<TaxRate>(
      `INSERT INTO "public"."tax_rate" (
        "id", "taxCategoryId", "taxZoneId", "name", "description", "rate", "type", 
        "priority", "isCompound", "includeInPrice", "isShippingTaxable", "fixedAmount", 
        "minimumAmount", "maximumAmount", "threshold", "startDate", "endDate", "isActive", 
        "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
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
    const sets: string[] = [];
    const params: any[] = [id];
    
    // Build dynamic SET clause
    Object.entries(taxRate).forEach(([key, value]) => {
      if (value !== undefined) {
        sets.push(`"${key}" = $${params.length + 1}`);
        if (key === 'metadata' && typeof value === 'object') {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
      }
    });
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${params.length + 1}`);
    params.push(now);
    
    if (sets.length <= 1) {
      throw new Error('No fields to update');
    }
    
    const result = await queryOne<TaxRate>(
      `UPDATE "public"."tax_rate" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Failed to update tax rate with ID ${id}`);
    }
    
    return result;
  }

  async deleteTaxRate(id: string): Promise<boolean> {
    // Check if this tax rate is being used in any active orders
    const taxUsageCount = await query<Array<{count: string}>>(
      'SELECT COUNT(*) as count FROM "public"."order_tax" WHERE "taxRateId" = $1', 
      [id]
    );
    
    if (taxUsageCount && taxUsageCount.length > 0 && parseInt(taxUsageCount[0].count) > 0) {
      throw new Error(`Cannot delete tax rate as it is being used by ${taxUsageCount[0].count} orders`);
    }
    
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."tax_rate" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  // Tax Category methods
  async findTaxCategoryById(id: string): Promise<TaxCategory | null> {
    return await queryOne<TaxCategory>('SELECT * FROM "public"."tax_category" WHERE "id" = $1', [id]);
  }

  async findTaxCategoryByCode(code: string): Promise<TaxCategory | null> {
    return await queryOne<TaxCategory>('SELECT * FROM "public"."tax_category" WHERE "code" = $1', [code]);
  }

  async findAllTaxCategories(
    status: TaxCategory['isActive'] = true,
    limit: number = 50,
    offset: number = 0
  ): Promise<TaxCategory[]> {
    return await query<TaxCategory[]>(
      'SELECT * FROM "public"."tax_category" WHERE "isActive" = $1 ORDER BY "name" ASC LIMIT $2 OFFSET $3',
      [status, limit, offset]
    ) || [];
  }

  async createTaxCategory(category: Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxCategory> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const result = await queryOne<TaxCategory>(
      `INSERT INTO "public"."tax_category" (
        "id", "name", "code", "description", "isDefault", "sortOrder", "isActive", 
        "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
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
    const sets: string[] = [];
    const params: any[] = [id];
    
    // Build dynamic SET clause
    Object.entries(category).forEach(([key, value]) => {
      if (value !== undefined) {
        sets.push(`"${key}" = $${params.length + 1}`);
        if (key === 'metadata' && typeof value === 'object') {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
      }
    });
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${params.length + 1}`);
    params.push(now);
    
    if (sets.length <= 1) {
      throw new Error('No fields to update');
    }
    
    const result = await queryOne<TaxCategory>(
      `UPDATE "public"."tax_category" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Failed to update tax category with ID ${id}`);
    }
    
    return result;
  }

  async deleteTaxCategory(id: string): Promise<boolean> {
    // Check if any products are using this tax category
    const categoryUsageCount = await query<Array<{count: string}>>(
      'SELECT COUNT(*) as count FROM "public"."product" WHERE "taxCategoryId" = $1', 
      [id]
    );
    
    if (categoryUsageCount && categoryUsageCount.length > 0 && parseInt(categoryUsageCount[0].count) > 0) {
      throw new Error(`Cannot delete tax category as it is being used by ${categoryUsageCount[0].count} products`);
    }
    
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."tax_category" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  // Tax Exemption methods
  async findTaxExemptionById(id: string): Promise<CustomerTaxExemption | null> {
    return await queryOne<CustomerTaxExemption>('SELECT * FROM "public"."tax_exemption" WHERE "id" = $1', [id]);
  }

  async findTaxExemptionsByCustomerId(customerId: string): Promise<CustomerTaxExemption[]> {
    return await query<CustomerTaxExemption[]>(
      'SELECT * FROM "public"."tax_exemption" WHERE "customerId" = $1 ORDER BY "createdAt" DESC',
      [customerId]
    ) || [];
  }

  async createTaxExemption(exemption: Omit<CustomerTaxExemption, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerTaxExemption> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const result = await queryOne<CustomerTaxExemption>(
      `INSERT INTO "public"."tax_exemption" (
        "id", "customerId", "taxZoneId", "type", "status", "name", "exemptionNumber", 
        "businessName", "exemptionReason", "documentUrl", "startDate", "expiryDate", 
        "isVerified", "verifiedBy", "verifiedAt", "notes", "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
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

  async updateTaxExemption(id: string, exemption: Partial<Omit<CustomerTaxExemption, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>): Promise<CustomerTaxExemption> {
    const now = unixTimestamp();
    const sets: string[] = [];
    const params: any[] = [id];
    
    // Build dynamic SET clause
    Object.entries(exemption).forEach(([key, value]) => {
      if (value !== undefined) {
        sets.push(`"${key}" = $${params.length + 1}`);
        if (key === 'metadata' && typeof value === 'object') {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
      }
    });
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${params.length + 1}`);
    params.push(now);
    
    if (sets.length <= 1) {
      throw new Error('No fields to update');
    }
    
    const result = await queryOne<CustomerTaxExemption>(
      `UPDATE "public"."tax_exemption" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Failed to update tax exemption with ID ${id}`);
    }
    
    return result;
  }

  async deleteTaxExemption(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."tax_exemption" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  // Tax calculation method
  async calculateTaxForLineItem(
    productId: string,
    quantity: number,
    price: number,
    shippingAddress: AddressInput,
    customerId?: string
  ): Promise<TaxCalculationResult> {
    const subtotal = price * quantity;
    
    // Check if customer has tax exemption
    if (customerId) {
      const exemptions = await this.findTaxExemptionsByCustomerId(customerId);
      const activeExemption = exemptions.find(e => 
        e.status === 'active' && 
        (!e.expiryDate || (Number(e.expiryDate) > parseInt(unixTimestamp())))
      );
      
      if (activeExemption) {
        // Customer is tax exempt
        return {
          subtotal,
          taxAmount: 0,
          total: subtotal,
          taxBreakdown: []
        };
      }
    }
    
    // Get product tax category
    const productTaxCategory = await queryOne<{ taxCategoryId: string }>(
      'SELECT "taxCategoryId" FROM "public"."product" WHERE "id" = $1',
      [productId]
    );
    
    // Get applicable tax rates for this location and category
    let taxRateQuery = `
      SELECT * FROM "public"."tax_rate" 
      WHERE "isActive" = TRUE 
      AND "taxZoneId" IN (
        SELECT "id" FROM "public"."tax_zone" 
        WHERE "countries" @> $1
      )
    `;
    
    const queryParams: any[] = [shippingAddress.country];
    
    if (shippingAddress.region) {
      taxRateQuery += ` AND ($2 IS NULL OR "states" @> ARRAY[$2]::varchar(10)[])`;
      queryParams.push(shippingAddress.region);
    } else {
      taxRateQuery += ` AND "states" IS NULL`;
    }
    
    if (shippingAddress.postalCode) {
      taxRateQuery += ` AND ($3 IS NULL OR "postcodes" @> ARRAY[$3]::text[])`;
      queryParams.push(shippingAddress.postalCode);
    } else {
      taxRateQuery += ` AND "postcodes" IS NULL`;
    }
    
    // Add category filtering if product has a tax category
    if (productTaxCategory && productTaxCategory.taxCategoryId) {
      taxRateQuery += ` AND ("taxCategoryId" = $${queryParams.length + 1})`;
      queryParams.push(productTaxCategory.taxCategoryId);
    }
    
    taxRateQuery += ` ORDER BY "priority" DESC`;
    
    const applicableTaxRates = await query<TaxRate[]>(taxRateQuery, queryParams) || [];
    
    // Calculate tax amounts
    let totalTaxAmount = 0;
    const taxBreakdown: TaxCalculationResult['taxBreakdown'] = [];
    
    for (const taxRate of applicableTaxRates) {
      const taxAmount = subtotal * taxRate.rate;
      totalTaxAmount += taxAmount;
      
      taxBreakdown.push({
        rateId: taxRate.id,
        rateName: taxRate.name,
        rateValue: taxRate.rate,
        taxableAmount: subtotal,
        taxAmount,
        jurisdictionLevel: 'state',
        jurisdictionName: shippingAddress.region || ''
      });
    }
    
    return {
      subtotal,
      taxAmount: totalTaxAmount,
      total: subtotal + totalTaxAmount,
      taxBreakdown
    };
  }

  // Calculate taxes for entire basket
  async calculateTaxForBasket(
    basketId: string,
    shippingAddress: AddressInput,
    customerId?: string
  ): Promise<{
    subtotal: number;
    taxAmount: number;
    total: number;
    taxBreakdown: TaxBreakdownItem[];
    taxZoneApplied?: string;
    taxCategoryApplied?: string;
    calculationReference?: string;
    lineItemTaxes?: LineItemTax[];
  }> {
    // Get basket line items
    const lineItems = await query<Array<{
      id: string;
      productId: string;
      quantity: number;
      price: number;
    }>>(
      `SELECT "id", "productId", "quantity", "price" FROM "public"."basket_item" WHERE "basketId" = $1`,
      [basketId]
    ) || [];
    
    if (!lineItems.length) {
      return {
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        taxBreakdown: [],
        taxZoneApplied: undefined,
        taxCategoryApplied: undefined,
        calculationReference: undefined,
        lineItemTaxes: undefined
      };
    }
    
    let subtotal = 0;
    let totalTaxAmount = 0;
    const lineItemTaxes: LineItemTax[] = [];
    
    // Aggregate tax breakdown across all items
    const aggregatedTaxBreakdown: Map<string, TaxBreakdownItem> = new Map();
    
    // Calculate tax for each line item
    for (const item of lineItems) {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      
      const taxResult = await this.calculateTaxForLineItem(
        item.productId,
        item.quantity,
        item.price,
        shippingAddress,
        customerId
      );
      
      totalTaxAmount += taxResult.taxAmount;
      
      // Store line item taxes
      lineItemTaxes.push({
        lineItemId: item.id,
        productId: item.productId,
        taxAmount: taxResult.taxAmount,
        taxBreakdown: taxResult.taxBreakdown
      });
      
      // Aggregate tax breakdown
      for (const tax of taxResult.taxBreakdown) {
        const existing = aggregatedTaxBreakdown.get(tax.rateId);
        
        if (existing) {
          existing.taxAmount += tax.taxAmount;
        } else {
          aggregatedTaxBreakdown.set(tax.rateId, { ...tax });
        }
      }
    }
    
    // Convert aggregated tax breakdown to array
    const taxBreakdown = Array.from(aggregatedTaxBreakdown.values());
    
    return {
      subtotal,
      taxAmount: totalTaxAmount,
      total: subtotal + totalTaxAmount,
      taxBreakdown,
      taxZoneApplied: undefined,
      taxCategoryApplied: undefined,
      calculationReference: undefined,
      lineItemTaxes
    };
  }

  // Tax Zone methods
  async findTaxZoneById(id: string): Promise<TaxZone | null> {
    return await queryOne<TaxZone>('SELECT * FROM "public"."tax_zone" WHERE "id" = $1', [id]);
  }

  async findTaxZoneByCode(code: string): Promise<TaxZone | null> {
    return await queryOne<TaxZone>('SELECT * FROM "public"."tax_zone" WHERE "code" = $1', [code]);
  }

  async findAllTaxZones(
    isActive: boolean = true,
    limit: number = 50,
    offset: number = 0
  ): Promise<TaxZone[]> {
    return await query<TaxZone[]>(
      'SELECT * FROM "public"."tax_zone" WHERE "isActive" = $1 ORDER BY "name" ASC LIMIT $2 OFFSET $3',
      [isActive, limit, offset]
    ) || [];
  }

  async createTaxZone(taxZone: Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxZone> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const result = await queryOne<TaxZone>(
      `INSERT INTO "public"."tax_zone" (
        "id", "name", "code", "description", "isDefault", "countries", "states", 
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
    
    return result;
  }

  async updateTaxZone(id: string, taxZone: Partial<Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxZone> {
    const now = unixTimestamp();
    const sets: string[] = [];
    const params: any[] = [id];
    
    // Build dynamic SET clause
    Object.entries(taxZone).forEach(([key, value]) => {
      if (value !== undefined) {
        sets.push(`"${key}" = $${params.length + 1}`);
        params.push(value);
      }
    });
    
    // Always update the updatedAt timestamp
    sets.push(`"updatedAt" = $${params.length + 1}`);
    params.push(now);
    
    if (sets.length <= 1) {
      throw new Error('No fields to update');
    }
    
    const result = await queryOne<TaxZone>(
      `UPDATE "public"."tax_zone" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING *`,
      params
    );
    
    if (!result) {
      throw new Error(`Failed to update tax zone with ID ${id}`);
    }
    
    return result;
  }

  async deleteTaxZone(id: string): Promise<boolean> {
    // Check if this tax zone is being used by any tax rates
    const zoneUsageCount = await query<Array<{count: string}>>(
      'SELECT COUNT(*) as count FROM "public"."tax_rate" WHERE "taxZoneId" = $1', 
      [id]
    );
    
    if (zoneUsageCount && zoneUsageCount.length > 0 && parseInt(zoneUsageCount[0].count) > 0) {
      throw new Error(`Cannot delete tax zone as it is being used by ${zoneUsageCount[0].count} tax rates`);
    }
    
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."tax_zone" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  // Tax Zone Matching
  async getTaxZoneByAddress(address: AddressInput): Promise<TaxZone | null> {
    // Find the most specific matching tax zone using GIN indexes
    // Order of specificity: postal code > city > state > country
    
    // Try to match with postal code (most specific)
    if (address.postalCode) {
      const postalCodeMatch = await queryOne<TaxZone>(
        `SELECT * FROM "public"."tax_zone"
        WHERE "isActive" = TRUE
        AND "countries" @> ARRAY[$1]::varchar(2)[]
        AND ($2 IS NULL OR "states" @> ARRAY[$2]::varchar(10)[])
        AND "postcodes" @> ARRAY[$3]::text[]
        ORDER BY "isDefault" DESC
        LIMIT 1`,
        [address.country, address.region || null, address.postalCode]
      );
      
      if (postalCodeMatch) {
        return postalCodeMatch;
      }
    }
    
    // Try to match with city
    if (address.city) {
      const cityMatch = await queryOne<TaxZone>(
        `SELECT * FROM "public"."tax_zone"
        WHERE "isActive" = TRUE
        AND "countries" @> ARRAY[$1]::varchar(2)[]
        AND ($2 IS NULL OR "states" @> ARRAY[$2]::varchar(10)[])
        AND "cities" @> ARRAY[$3]::text[]
        ORDER BY "isDefault" DESC
        LIMIT 1`,
        [address.country, address.region || null, address.city]
      );
      
      if (cityMatch) {
        return cityMatch;
      }
    }
    
    // Try to match with state/region
    if (address.region) {
      const stateMatch = await queryOne<TaxZone>(
        `SELECT * FROM "public"."tax_zone"
        WHERE "isActive" = TRUE
        AND "countries" @> ARRAY[$1]::varchar(2)[]
        AND "states" @> ARRAY[$2]::varchar(10)[]
        ORDER BY "isDefault" DESC
        LIMIT 1`,
        [address.country, address.region]
      );
      
      if (stateMatch) {
        return stateMatch;
      }
    }
    
    // Try to match with country only
    const countryMatch = await queryOne<TaxZone>(
      `SELECT * FROM "public"."tax_zone"
      WHERE "isActive" = TRUE
      AND "countries" @> ARRAY[$1]::varchar(2)[]
      AND (ARRAY_LENGTH("states", 1) IS NULL OR "states" = '{}')
      AND (ARRAY_LENGTH("postcodes", 1) IS NULL OR "postcodes" = '{}')
      AND (ARRAY_LENGTH("cities", 1) IS NULL OR "cities" = '{}')
      ORDER BY "isDefault" DESC
      LIMIT 1`,
      [address.country]
    );
    
    if (countryMatch) {
      return countryMatch;
    }
    
    // Fallback to default tax zone
    return await queryOne<TaxZone>(
      'SELECT * FROM "public"."tax_zone" WHERE "isDefault" = TRUE AND "isActive" = TRUE LIMIT 1'
    );
  }

  // Tax Settings methods
  async getMerchantTaxSettings(merchantId: string): Promise<TaxSettings | null> {
    return await queryOne<TaxSettings>(
      'SELECT * FROM "public"."tax_settings" WHERE "merchantId" = $1',
      [merchantId]
    );
  }

  async getDefaultTaxSettings(): Promise<TaxSettings | null> {
    // Get the first tax settings we find (typically belonging to the main merchant)
    return await queryOne<TaxSettings>('SELECT * FROM "public"."tax_settings" LIMIT 1');
  }

  async createOrUpdateTaxSettings(
    merchantId: string, 
    settings: Partial<Omit<TaxSettings, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'>>
  ): Promise<TaxSettings> {
    const now = unixTimestamp();
    const existing = await this.getMerchantTaxSettings(merchantId);
    
    if (existing) {
      // Update existing settings
      const sets: string[] = [];
      const params: any[] = [existing.id];
      
      // Build dynamic SET clause
      Object.entries(settings).forEach(([key, value]) => {
        if (value !== undefined) {
          sets.push(`"${key}" = $${params.length + 1}`);
          if (key === 'taxProviderSettings' && typeof value === 'object') {
            params.push(JSON.stringify(value));
          } else if (key === 'metadata' && typeof value === 'object') {
            params.push(JSON.stringify(value));
          } else {
            params.push(value);
          }
        }
      });
      
      // Always update the updatedAt timestamp
      sets.push(`"updatedAt" = $${params.length + 1}`);
      params.push(now);
      
      if (sets.length <= 1) {
        throw new Error('No fields to update');
      }
      
      const result = await queryOne<TaxSettings>(
        `UPDATE "public"."tax_settings" SET ${sets.join(', ')} WHERE "id" = $1 RETURNING *`,
        params
      );
      
      if (!result) {
        throw new Error(`Failed to update tax settings for merchant ${merchantId}`);
      }
      
      return result;
    } else {
      // Create new settings
      const id = generateUUID();
      const defaultValues = {
        calculationMethod: 'unit_based' as TaxCalculationMethod,
        pricesIncludeTax: false,
        displayPricesWithTax: false,
        taxBasedOn: 'shipping_address' as 'shipping_address',
        displayTaxTotals: 'itemized' as 'itemized',
        applyTaxToShipping: true,
        applyDiscountBeforeTax: true,
        roundTaxAtSubtotal: false,
        taxDecimalPlaces: 2,
        taxProvider: 'internal' as 'internal'
      };
      
      // Merge defaults with provided settings
      const mergedSettings = { ...defaultValues, ...settings };
      
      const result = await queryOne<TaxSettings>(
        `INSERT INTO "public"."tax_settings" (
          "id", "merchantId", "calculationMethod", "pricesIncludeTax", "displayPricesWithTax", 
          "taxBasedOn", "shippingTaxClass", "displayTaxTotals", "applyTaxToShipping", 
          "applyDiscountBeforeTax", "roundTaxAtSubtotal", "taxDecimalPlaces", 
          "defaultTaxCategory", "defaultTaxZone", "taxProvider", "taxProviderSettings", 
          "metadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING *`,
        [
          id, merchantId, 
          mergedSettings.calculationMethod, 
          mergedSettings.pricesIncludeTax, 
          mergedSettings.displayPricesWithTax,
          mergedSettings.taxBasedOn, 
          mergedSettings.shippingTaxClass || null, 
          mergedSettings.displayTaxTotals, 
          mergedSettings.applyTaxToShipping,
          mergedSettings.applyDiscountBeforeTax, 
          mergedSettings.roundTaxAtSubtotal, 
          mergedSettings.taxDecimalPlaces,
          mergedSettings.defaultTaxCategory || null, 
          mergedSettings.defaultTaxZone || null, 
          mergedSettings.taxProvider,
          mergedSettings.taxProviderSettings ? JSON.stringify(mergedSettings.taxProviderSettings) : null,
          mergedSettings.metadata ? JSON.stringify(mergedSettings.metadata) : null,
          now, now
        ]
      );
      
      if (!result) {
        throw new Error(`Failed to create tax settings for merchant ${merchantId}`);
      }
      
      return result;
    }
  }

  // Specialized Tax Rate methods
  async getTaxRatesForZoneAndCategory(
    zoneId: string,
    categoryId: string
  ): Promise<TaxRate[]> {
    return await query<TaxRate[]>(
      `SELECT * FROM "public"."tax_rate" 
      WHERE "isActive" = TRUE 
      AND "taxZoneId" = $1 
      AND "taxCategoryId" = $2
      AND ("startDate" IS NULL OR "startDate" <= $3::timestamp)
      AND ("endDate" IS NULL OR "endDate" >= $3::timestamp)
      ORDER BY "priority" ASC`,
      [zoneId, categoryId, new Date()]
    ) || [];
  }

  // Product Tax Category methods
  async getProductWithTaxInfo(productId: string): Promise<{ taxCategoryId: string, taxCategoryName?: string }> {
    const result = await queryOne<{ taxCategoryId: string, categoryName?: string }>(
      `SELECT p."taxCategoryId", tc."name" as categoryName
      FROM "public"."product" p
      LEFT JOIN "public"."tax_category" tc ON tc."id" = p."taxCategoryId"
      WHERE p."id" = $1`,
      [productId]
    );
    
    if (!result) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    return result;
  }

  // Tax Calculation Helper Methods
  private calculateUnitBasedTax(unitPrice: number, quantity: number, rate: TaxRate): number {
    const taxableAmount = unitPrice * quantity;
    
    if (rate.type === 'percentage') {
      return Math.round((taxableAmount * (rate.rate / 100)) * 100) / 100;
    } else if (rate.type === 'fixed_amount' && rate.fixedAmount) {
      return Math.round((rate.fixedAmount * quantity) * 100) / 100;
    }
    
    return 0;
  }
  
  private calculateRowBasedTax(rowTotal: number, rate: TaxRate): number {
    if (rate.type === 'percentage') {
      return Math.round((rowTotal * (rate.rate / 100)) * 100) / 100;
    } else if (rate.type === 'fixed_amount' && rate.fixedAmount) {
      return Math.round(rate.fixedAmount * 100) / 100;
    }
    
    return 0;
  }
  
  private calculateCompoundTax(previousTaxAmount: number, rate: TaxRate): number {
    if (rate.type === 'percentage') {
      return Math.round((previousTaxAmount * (rate.rate / 100)) * 100) / 100;
    }
    
    return 0;
  }

  // Enhanced Tax Calculation
  async calculateComplexTax(
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      price: number;
      taxCategoryId?: string;
    }>,
    shippingAddress: AddressInput,
    billingAddress: AddressInput,
    subtotal: number,
    shippingAmount: number,
    customerId?: string,
    merchantId?: string
  ): Promise<TaxCalculationResult> {
    // Get merchant settings or use defaults
    const settings = merchantId 
      ? await this.getMerchantTaxSettings(merchantId)
      : await this.getDefaultTaxSettings();
    
    if (!settings) {
      // Fallback to simple calculation if no settings found
      return {
        subtotal,
        taxAmount: 0,
        total: subtotal,
        taxBreakdown: []
      };
    }
    
    // Determine tax basis address based on settings
    const taxAddress = settings.taxBasedOn === 'shipping_address'
      ? shippingAddress
      : settings.taxBasedOn === 'billing_address'
      ? billingAddress
      : shippingAddress; // Fallback to shipping address
    
    // Find applicable tax zone
    const taxZone = await this.getTaxZoneByAddress(taxAddress);
    if (!taxZone) {
      // No tax zone found, use default handling from settings
      return {
        subtotal,
        taxAmount: 0,
        total: subtotal,
        taxBreakdown: []
      };
    }
    
    // Check customer exemptions with enhanced logic
    if (customerId) {
      const exemptions = await this.findTaxExemptionsByCustomerId(customerId);
      const activeExemption = exemptions.find(e => 
        e.status === 'active' && 
        (!e.expiryDate || (Number(e.expiryDate) > parseInt(unixTimestamp()))) &&
        (!e.taxZoneId || e.taxZoneId === taxZone.id)
      );
      
      if (activeExemption && activeExemption.isVerified) {
        // Customer is fully exempt
        return {
          subtotal,
          taxAmount: 0,
          total: subtotal,
          taxBreakdown: [],
          taxZoneApplied: taxZone.name,
          calculationReference: `exempt-${activeExemption.id}`
        };
      }
    }
    
    // Process all items
    let totalTaxAmount = 0;
    const taxBreakdown: TaxBreakdownItem[] = [];
    const lineItemTaxes: LineItemTax[] = [];
    const taxBreakdownMap = new Map<string, TaxBreakdownItem>();
    
    for (const item of items) {
      // Get product tax category with fallback to default
      const product = await this.getProductWithTaxInfo(item.productId);
      const taxCategoryId = item.taxCategoryId || product.taxCategoryId || settings.defaultTaxCategory;
      
      if (!taxCategoryId) {
        // Skip tax calculation for this item if no category
        continue;
      }
      
      // Get all applicable tax rates
      const taxRates = await this.getTaxRatesForZoneAndCategory(
        taxZone.id,
        taxCategoryId
      );
      
      let itemTaxAmount = 0;
      const itemTaxBreakdown: TaxBreakdownItem[] = [];
      
      // Sort rates by priority and handle compound flags
      const sortedRates = taxRates.sort((a, b) => a.priority - b.priority);
      
      for (const rate of sortedRates) {
        // Calculate tax according to calculation method
        let rateTaxAmount = 0;
        
        if (settings.calculationMethod === 'unit_based') {
          // Per unit calculation
          rateTaxAmount = this.calculateUnitBasedTax(item.price, item.quantity, rate);
        } else if (settings.calculationMethod === 'row_based') {
          // Row total calculation 
          rateTaxAmount = this.calculateRowBasedTax(item.price * item.quantity, rate);
        }
        
        // Handle compound taxes (tax on tax)
        if (rate.isCompound && itemTaxAmount > 0) {
          rateTaxAmount = this.calculateCompoundTax(itemTaxAmount, rate);
        }
        
        // Apply maximum amount constraint if specified
        if (rate.maximumAmount && rateTaxAmount > rate.maximumAmount) {
          rateTaxAmount = rate.maximumAmount;
        }
        
        // Round to specified decimal places
        rateTaxAmount = Number(rateTaxAmount.toFixed(settings.taxDecimalPlaces));
        
        itemTaxAmount += rateTaxAmount;
        
        // Add to item breakdown
        const taxBreakdownItem: TaxBreakdownItem = {
          rateId: rate.id,
          rateName: rate.name,
          rateValue: rate.rate,
          taxableAmount: item.price * item.quantity,
          taxAmount: rateTaxAmount,
          jurisdictionLevel: 'country', // This would be more specific in a real implementation
          jurisdictionName: taxAddress.country
        };
        
        itemTaxBreakdown.push(taxBreakdownItem);
        
        // Add to overall breakdown
        const key = rate.id;
        if (taxBreakdownMap.has(key)) {
          const existing = taxBreakdownMap.get(key)!;
          existing.taxableAmount += taxBreakdownItem.taxableAmount;
          existing.taxAmount += taxBreakdownItem.taxAmount;
        } else {
          taxBreakdownMap.set(key, { ...taxBreakdownItem });
        }
      }
      
      totalTaxAmount += itemTaxAmount;
      
      // Add to line item taxes
      lineItemTaxes.push({
        lineItemId: item.variantId || item.productId, // Using ID as line item ID for simplicity
        productId: item.productId,
        taxAmount: itemTaxAmount,
        taxBreakdown: itemTaxBreakdown
      });
    }
    
    // Add shipping tax if applicable
    if (settings.applyTaxToShipping && shippingAmount > 0 && settings.shippingTaxClass) {
      const shippingTaxRates = await this.getTaxRatesForZoneAndCategory(
        taxZone.id,
        settings.shippingTaxClass
      );
      
      let shippingTaxAmount = 0;
      
      for (const rate of shippingTaxRates) {
        if (rate.isShippingTaxable) {
          const taxAmount = this.calculateRowBasedTax(shippingAmount, rate);
          shippingTaxAmount += taxAmount;
          
          // Add to overall breakdown
          const key = rate.id;
          if (taxBreakdownMap.has(key)) {
            const existing = taxBreakdownMap.get(key)!;
            existing.taxableAmount += shippingAmount;
            existing.taxAmount += taxAmount;
          } else {
            taxBreakdownMap.set(key, {
              rateId: rate.id,
              rateName: rate.name,
              rateValue: rate.rate,
              taxableAmount: shippingAmount,
              taxAmount,
              jurisdictionLevel: 'country', // This would be more specific in a real implementation
              jurisdictionName: taxAddress.country
            });
          }
        }
      }
      
      totalTaxAmount += shippingTaxAmount;
    }
    
    // Convert map to array for the response
    Array.from(taxBreakdownMap.values()).forEach(item => {
      taxBreakdown.push(item);
    });
    
    // Log tax calculation for reporting
    const calcId = await this.logTaxCalculation({
      merchantId,
      customerId,
      shippingAddress: taxAddress,
      subtotal,
      taxAmount: totalTaxAmount,
      taxBreakdown,
      taxZoneId: taxZone.id,
      lineItemTaxes
    });
    
    return {
      subtotal,
      taxAmount: totalTaxAmount,
      total: subtotal + totalTaxAmount,
      taxBreakdown,
      taxZoneApplied: taxZone.name,
      calculationReference: calcId,
      lineItemTaxes
    };
  }

  // Tax Calculation Logging
  private async logTaxCalculation(params: {
    merchantId?: string;
    customerId?: string;
    shippingAddress: AddressInput;
    subtotal: number;
    taxAmount: number;
    taxBreakdown: TaxBreakdownItem[];
    taxZoneId: string;
    lineItemTaxes?: LineItemTax[];
  }): Promise<string> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    try {
      // Insert calculation record
      await queryOne(
        `INSERT INTO "public"."tax_calculation" (
          "id", "merchantId", "customerId", "calculationMethod", 
          "status", "sourceType", "taxAddress", "taxableAmount", 
          "taxAmount", "totalAmount", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          params.merchantId || null,
          params.customerId || null,
          'unit_based', // This would be from settings in a real implementation
          'completed',
          'estimate',
          JSON.stringify(params.shippingAddress),
          params.subtotal,
          params.taxAmount,
          params.subtotal + params.taxAmount,
          now,
          now
        ]
      );
      
      // Insert tax breakdown
      for (const tax of params.taxBreakdown) {
        await queryOne(
          `INSERT INTO "public"."tax_calculation_applied" (
            "id", "calculationId", "taxRateId", "taxRateName", "taxZoneId",
            "jurisdictionLevel", "jurisdictionName", "rate", "isCompound",
            "taxableAmount", "taxAmount", "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            generateUUID(),
            id,
            tax.rateId,
            tax.rateName,
            params.taxZoneId,
            tax.jurisdictionLevel,
            tax.jurisdictionName,
            tax.rateValue,
            false, // isCompound would be from rate in a real implementation
            tax.taxableAmount,
            tax.taxAmount,
            now
          ]
        );
      }
      
      // Insert line item taxes if available
      if (params.lineItemTaxes) {
        for (const item of params.lineItemTaxes) {
          const lineCalcId = generateUUID();
          
          await queryOne(
            `INSERT INTO "public"."tax_calculation_line" (
              "id", "calculationId", "lineItemId", "lineItemType", "productId",
              "quantity", "unitPrice", "lineTotal", "taxableAmount", "createdAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              lineCalcId,
              id,
              item.lineItemId,
              'product',
              item.productId,
              1, // Quantity would be from lineItem in a real implementation
              0, // Unit price would be from lineItem in a real implementation
              0, // Line total would be from lineItem in a real implementation
              0, // Taxable amount would be from calculation in a real implementation
              now
            ]
          );
        }
      }
      
      return id;
    } catch (error) {
      console.error('Failed to log tax calculation:', error);
      return id; // Return ID even if logging fails
    }
  }
}

export default new TaxRepo();
