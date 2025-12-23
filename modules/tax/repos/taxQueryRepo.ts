/**
 * Tax Query Repository
 * Read operations for tax data
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';
import {
  TaxZone,
  TaxRate,
  TaxCategory,
  CustomerTaxExemption,
  TaxSettings,
  AddressInput,
  TaxCalculationResult,
  TaxBreakdownItem,
  LineItemTax,
  TaxExemptionStatus,
} from '../taxTypes';

// ============================================================================
// Table Constants
// ============================================================================

const TABLES = {
  TAX_CATEGORY: Table.TaxCategory,
  TAX_ZONE: Table.TaxZone,
  TAX_RATE: Table.TaxRate,
  TAX_RULE: Table.TaxRule,
  TAX_SETTINGS: Table.TaxSettings,
  TAX_CALCULATION: Table.TaxCalculation,
  TAX_CALCULATION_LINE: Table.TaxCalculationLine,
  TAX_CALCULATION_APPLIED: Table.TaxCalculationApplied,
  CUSTOMER_TAX_EXEMPTION: Table.CustomerTaxExemption,
};

/**
 * Repository for tax-related read operations only
 * Following the Command Query Responsibility Segregation (CQRS) pattern
 */
export class TaxQueryRepo {
  // Tax Rate query methods
  async findTaxRateById(id: string): Promise<TaxRate | null> {
    const result = await queryOne<any>(`SELECT * FROM "taxRate" WHERE "taxRateId" = $1`, [id]);
    if (!result) return null;
    return { ...result, id: result.taxRateId } as TaxRate;
  }

  async findAllTaxRates(
    status: TaxRate['isActive'] = true,
    country?: string,
    region?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<TaxRate[]> {
    const params: any[] = [status];
    let sql = `
      SELECT tr.*
      FROM "taxRate" tr
      JOIN "taxZone" tz ON tr."taxZoneId" = tz."taxZoneId"
      WHERE tr."isActive" = $1
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
    return (results || []).map(r => ({ ...r, id: r.taxRateId })) as TaxRate[];
  }

  async findTaxRatesByCategoryAndZone(categoryId: string, zoneId: string, status: TaxRate['isActive'] = true): Promise<TaxRate[]> {
    const results = await query<any[]>(
      `SELECT * 
       FROM "taxRate" 
       WHERE "taxCategoryId" = $1 
       AND "taxZoneId" = $2 
       AND "isActive" = $3
       ORDER BY "priority" DESC, "rate" ASC`,
      [categoryId, zoneId, status],
    );

    return (results || []).map(r => ({ ...r, id: r.taxRateId })) as TaxRate[];
  }

  // Tax Zone query methods
  async findTaxZoneById(id: string): Promise<TaxZone | null> {
    const result = await queryOne<any>(`SELECT * FROM "taxZone" WHERE "taxZoneId" = $1`, [id]);
    if (!result) return null;
    return { ...result, id: result.taxZoneId } as TaxZone;
  }

  async findTaxZoneByCode(code: string): Promise<TaxZone | null> {
    const result = await queryOne<any>(`SELECT * FROM "taxZone" WHERE "code" = $1`, [code]);
    if (!result) return null;
    return { ...result, id: result.taxZoneId } as TaxZone;
  }

  async findAllTaxZones(status: TaxZone['isActive'] = true, limit: number = 50, offset: number = 0): Promise<TaxZone[]> {
    const results = await query<any[]>(
      `SELECT * 
       FROM "taxZone" 
       WHERE "isActive" = $1
       ORDER BY "isDefault" DESC, "name" ASC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset],
    );

    return (results || []).map(r => ({ ...r, id: r.taxZoneId })) as TaxZone[];
  }

  async findTaxZoneForAddress(country: string, state?: string, postalCode?: string, city?: string): Promise<TaxZone | null> {
    let sql = `
      SELECT * FROM "taxZone"
      WHERE "isActive" = true
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
      "isDefault" DESC
      LIMIT 1`;

    const result = await queryOne<any>(sql, params);
    if (!result) return null;
    return { ...result, id: result.taxZoneId } as TaxZone;
  }

  // Tax Category query methods
  async findTaxCategoryById(id: string): Promise<TaxCategory | null> {
    const result = await queryOne<any>(`SELECT * FROM "taxCategory" WHERE "taxCategoryId" = $1`, [id]);
    if (!result) return null;
    return { ...result, id: result.taxCategoryId } as TaxCategory;
  }

  async findTaxCategoryByCode(code: string): Promise<TaxCategory | null> {
    const result = await queryOne<any>(`SELECT * FROM "taxCategory" WHERE "code" = $1`, [code]);
    if (!result) return null;
    return { ...result, id: result.taxCategoryId } as TaxCategory;
  }

  async findAllTaxCategories(status: TaxCategory['isActive'] = true, limit: number = 50, offset: number = 0): Promise<TaxCategory[]> {
    const results = await query<any[]>(
      `SELECT * 
       FROM "taxCategory" 
       WHERE "isActive" = $1
       ORDER BY "sortOrder" ASC, "name" ASC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset],
    );

    return (results || []).map(r => ({ ...r, id: r.taxCategoryId })) as TaxCategory[];
  }

  async findDefaultTaxCategory(): Promise<TaxCategory | null> {
    const result = await queryOne<any>(
      `SELECT * 
       FROM "taxCategory" 
       WHERE "isDefault" = true AND "isActive" = true
       LIMIT 1`,
    );
    if (!result) return null;
    return { ...result, id: result.taxCategoryId } as TaxCategory;
  }

  // Customer Tax Exemption query methods
  async findCustomerTaxExemptions(customerId: string, status: TaxExemptionStatus = 'active'): Promise<CustomerTaxExemption[]> {
    const results = await query<any[]>(
      `SELECT * 
       FROM "customerTaxExemption" 
       WHERE "customerId" = $1 
       AND "status" = $2
       AND ("expiryDate" IS NULL OR "expiryDate" > CURRENT_TIMESTAMP)
       ORDER BY "taxCategoryId", "startDate" DESC`,
      [customerId, status],
    );

    return (results || []).map(r => ({ ...r, id: r.customerTaxExemptionId })) as CustomerTaxExemption[];
  }

  /**
   * Alias for findCustomerTaxExemptions to maintain backward compatibility
   */
  async findTaxExemptionsByCustomerId(customerId: string, status: TaxExemptionStatus = 'active'): Promise<any[]> {
    return this.findCustomerTaxExemptions(customerId, status);
  }

  async findCustomerExemptionsByCategory(
    customerId: string,
    taxCategoryId: string,
    status: TaxExemptionStatus = 'active',
  ): Promise<CustomerTaxExemption[]> {
    const results = await query<any[]>(
      `SELECT * 
       FROM "customerTaxExemption" 
       WHERE "customerId" = $1 
       AND "taxCategoryId" = $2
       AND "status" = $3
       AND ("expiryDate" IS NULL OR "expiryDate" > CURRENT_TIMESTAMP)
       ORDER BY "startDate" DESC`,
      [customerId, taxCategoryId, status],
    );

    return (results || []).map(r => ({ ...r, id: r.customerTaxExemptionId })) as CustomerTaxExemption[];
  }

  /**
   * Get tax rate for a specific address
   * This method determines the applicable tax rate based on location data
   */
  async getTaxRateForAddress(address: AddressInput): Promise<number> {
    // Find the appropriate tax zone for this address
    const taxZone = await this.findTaxZoneForAddress(address.country, address.region, address.postalCode, address.city);

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
      true, // Only active tax rates
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
  /**
   * Calculate tax for a single line item with a given product ID
   * Simplified version for backward compatibility
   */
  async calculateTaxForLineItem(
    productId: string,
    quantity: number,
    price: number,
    address: {
      country: string;
      region?: string;
      postalCode?: string;
    },
    customerId?: string,
  ): Promise<{
    taxAmount: number;
    rate: number;
    taxableAmount: number;
    total: number;
  }> {
    // Find the appropriate tax zone for this address
    const taxZone = await this.findTaxZoneForAddress(address.country, address.region, address.postalCode);

    // Get the tax rate for this address
    const taxRate = await this.getTaxRateForAddress({
      country: address.country,
      region: address.region,
      postalCode: address.postalCode,
    });

    // Calculate the tax amount
    const taxableAmount = quantity * price;
    const taxAmount = taxableAmount * (taxRate / 100);

    return {
      taxAmount,
      rate: taxRate,
      taxableAmount,
      total: taxableAmount + taxAmount,
    };
  }

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
    shippingAmount: number = 0,
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
          taxBreakdown: [],
        });
      } else {
        const itemTaxAmount = itemSubtotal * (taxRate / 100);
        const itemTaxBreakdown = [
          {
            rateId: 'default',
            rateName: 'Default Tax Rate',
            rateValue: taxRate,
            taxableAmount: itemSubtotal,
            taxAmount: itemTaxAmount,
            jurisdictionLevel: 'national',
            jurisdictionName: address.country || 'Unknown',
          },
        ];

        lineItemTaxes.push({
          lineItemId: item.productId, // Using productId as lineItem identifier
          productId: item.productId,
          taxAmount: itemTaxAmount,
          taxBreakdown: itemTaxBreakdown,
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
      taxBreakdown: [
        {
          rateId: 'default',
          rateName: 'Default Tax Rate',
          rateValue: taxRate,
          taxableAmount: subtotal + shippingAmount,
          taxAmount: totalTaxAmount,
          jurisdictionLevel: 'national',
          jurisdictionName: address.country || 'Unknown',
        },
      ],
      lineItemTaxes,
    };
  }

  /**
   * Calculate complex tax for items with shipping and billing addresses
   * Enhanced version with more detailed parameters
   */
  async calculateComplexTax(
    dbItems: Array<{
      product_id: string;
      tax_category_id?: string;
      quantity: number;
      price: number;
      taxable?: boolean;
    }>,
    dbShippingAddress: {
      country: string;
      region?: string;
      postal_code?: string;
      city?: string;
    },
    dbBillingAddress: {
      country: string;
      region?: string;
      postal_code?: string;
      city?: string;
    },
    subtotal: number,
    shippingAmount: number = 0,
    customerId?: string,
    merchantId?: string,
  ): Promise<TaxCalculationResult> {
    // Convert DB format back to TS format for internal processing
    const items = dbItems.map(item => ({
      productId: item.product_id,
      taxCategoryId: item.tax_category_id,
      quantity: item.quantity,
      unitPrice: item.price,
      taxable: item.taxable,
    }));

    const address: AddressInput = {
      country: dbShippingAddress.country,
      region: dbShippingAddress.region,
      postalCode: dbShippingAddress.postal_code,
      city: dbShippingAddress.city,
    };

    // Use the existing calculateTax method for the actual calculation
    return this.calculateTax(items, address, customerId, shippingAmount);
  }

  /**
   * Calculate tax for an entire basket by its ID
   * Legacy method for backward compatibility
   */
  async calculateTaxForBasket(
    basketId: string,
    dbAddress: {
      country: string;
      region?: string;
      postal_code?: string;
      city?: string;
    },
    customerId?: string,
  ): Promise<TaxCalculationResult> {
    // This would typically involve getting the basket from the database first
    // Since we don't have direct access to the basket repository here, we'll implement
    // a simplified version that returns a basic tax calculation

    // Convert DB format address to TS format for internal processing
    const address: AddressInput = {
      country: dbAddress.country,
      region: dbAddress.region,
      postalCode: dbAddress.postal_code,
      city: dbAddress.city,
    };

    // Get the tax rate for this address
    const taxRate = await this.getTaxRateForAddress(address);

    // Since we don't have the actual basket items, return a basic result
    // In a real implementation, you would fetch the basket items and calculate
    // taxes for each item
    return {
      taxAmount: 0, // This would be calculated based on basket items
      subtotal: 0, // This would be the basket subtotal
      total: 0, // This would be subtotal + tax + shipping
      taxBreakdown: [
        {
          rateId: 'default',
          rateName: 'Default Tax Rate',
          rateValue: taxRate,
          taxableAmount: 0, // This would be the taxable amount from the basket
          taxAmount: 0, // This would be calculated based on taxable amount and rate
          jurisdictionLevel: 'national',
          jurisdictionName: address.country || 'Unknown',
        },
      ],
      lineItemTaxes: [], // This would contain tax details for each line item
    };
  }
}

export default new TaxQueryRepo();
