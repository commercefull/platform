import { unixTimestamp } from '../../../libs/date';
import { query, queryOne } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';

// Tax Types
export type TaxRate = {
  id: string;
  name: string;
  description?: string;
  rate: number; // Stored as decimal (e.g., 0.07 for 7%)
  country: string;
  region?: string; // State/province/region
  postalCode?: string; // For postal code based taxes
  status: 'active' | 'inactive';
  priority: number; // Higher priority tax rates are applied first
  productCategories?: string[]; // Categories this tax applies to
  createdAt: number;
  updatedAt: number;
};

export type TaxCategory = {
  id: string;
  name: string;
  description?: string;
  code: string; // For integration with external tax systems
  status: 'active' | 'inactive';
  createdAt: number;
  updatedAt: number;
};

export type TaxExemption = {
  id: string;
  customerId: string;
  certificateNumber?: string;
  certificateImage?: string;
  expiresAt?: number;
  status: 'active' | 'inactive';
  createdAt: number;
  updatedAt: number;
};

export type TaxCalculationResult = {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxBreakdown: Array<{
    taxRateId: string;
    taxRateName: string;
    rate: number;
    amount: number;
  }>;
};

export class TaxRepo {
  // Tax Rate methods
  async findTaxRateById(id: string): Promise<TaxRate | null> {
    return await queryOne<TaxRate>('SELECT * FROM "public"."tax_rate" WHERE "id" = $1', [id]);
  }

  async findAllTaxRates(
    status: TaxRate['status'] = 'active',
    country?: string,
    region?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TaxRate[]> {
    let sql = 'SELECT * FROM "public"."tax_rate" WHERE "status" = $1';
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

  async createTaxRate(taxRate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxRate> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const result = await queryOne<TaxRate>(
      `INSERT INTO "public"."tax_rate" (
        "id", "name", "description", "rate", "country", "region", "postalCode", 
        "status", "priority", "productCategories", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        id, 
        taxRate.name, 
        taxRate.description || null, 
        taxRate.rate, 
        taxRate.country, 
        taxRate.region || null, 
        taxRate.postalCode || null, 
        taxRate.status, 
        taxRate.priority, 
        taxRate.productCategories ? JSON.stringify(taxRate.productCategories) : null,
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
        if (key === 'productCategories' && Array.isArray(value)) {
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
    status: TaxCategory['status'] = 'active',
    limit: number = 50,
    offset: number = 0
  ): Promise<TaxCategory[]> {
    return await query<TaxCategory[]>(
      'SELECT * FROM "public"."tax_category" WHERE "status" = $1 ORDER BY "name" ASC LIMIT $2 OFFSET $3',
      [status, limit, offset]
    ) || [];
  }

  async createTaxCategory(category: Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxCategory> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const result = await queryOne<TaxCategory>(
      `INSERT INTO "public"."tax_category" (
        "id", "name", "description", "code", "status", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        id, 
        category.name, 
        category.description || null, 
        category.code, 
        category.status, 
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
        params.push(value);
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
  async findTaxExemptionById(id: string): Promise<TaxExemption | null> {
    return await queryOne<TaxExemption>('SELECT * FROM "public"."tax_exemption" WHERE "id" = $1', [id]);
  }

  async findTaxExemptionsByCustomerId(customerId: string): Promise<TaxExemption[]> {
    return await query<TaxExemption[]>(
      'SELECT * FROM "public"."tax_exemption" WHERE "customerId" = $1 ORDER BY "createdAt" DESC',
      [customerId]
    ) || [];
  }

  async createTaxExemption(exemption: Omit<TaxExemption, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxExemption> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const result = await queryOne<TaxExemption>(
      `INSERT INTO "public"."tax_exemption" (
        "id", "customerId", "certificateNumber", "certificateImage", "expiresAt", 
        "status", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        id, 
        exemption.customerId, 
        exemption.certificateNumber || null, 
        exemption.certificateImage || null, 
        exemption.expiresAt || null, 
        exemption.status, 
        now, 
        now
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create tax exemption');
    }
    
    return result;
  }

  async updateTaxExemption(id: string, exemption: Partial<Omit<TaxExemption, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>): Promise<TaxExemption> {
    const now = unixTimestamp();
    const sets: string[] = [];
    const params: any[] = [id];
    
    // Build dynamic SET clause
    Object.entries(exemption).forEach(([key, value]) => {
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
    
    const result = await queryOne<TaxExemption>(
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
    shippingAddress: {
      country: string;
      region?: string;
      postalCode?: string;
    },
    customerId?: string
  ): Promise<TaxCalculationResult> {
    const subtotal = price * quantity;
    
    // Check if customer has tax exemption
    if (customerId) {
      const exemptions = await this.findTaxExemptionsByCustomerId(customerId);
      const activeExemption = exemptions.find(e => 
        e.status === 'active' && 
        (!e.expiresAt || (Number(e.expiresAt) > parseInt(unixTimestamp())))
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
      WHERE "status" = 'active' 
      AND "country" = $1
    `;
    
    const queryParams: any[] = [shippingAddress.country];
    
    if (shippingAddress.region) {
      taxRateQuery += ` AND ("region" IS NULL OR "region" = $2)`;
      queryParams.push(shippingAddress.region);
    } else {
      taxRateQuery += ` AND "region" IS NULL`;
    }
    
    if (shippingAddress.postalCode) {
      taxRateQuery += ` AND ("postalCode" IS NULL OR "postalCode" = $${queryParams.length + 1})`;
      queryParams.push(shippingAddress.postalCode);
    } else {
      taxRateQuery += ` AND "postalCode" IS NULL`;
    }
    
    // Add category filtering if product has a tax category
    if (productTaxCategory && productTaxCategory.taxCategoryId) {
      taxRateQuery += ` AND ("productCategories" IS NULL OR "productCategories" @> $${queryParams.length + 1})`;
      queryParams.push(JSON.stringify([productTaxCategory.taxCategoryId]));
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
        taxRateId: taxRate.id,
        taxRateName: taxRate.name,
        rate: taxRate.rate,
        amount: taxAmount
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
    shippingAddress: {
      country: string;
      region?: string;
      postalCode?: string;
    },
    customerId?: string
  ): Promise<{
    subtotal: number;
    taxAmount: number;
    total: number;
    taxBreakdown: Array<{
      taxRateId: string;
      taxRateName: string;
      rate: number;
      amount: number;
    }>;
    lineItemTaxes: Array<{
      lineItemId: string;
      productId: string;
      taxAmount: number;
      taxBreakdown: Array<{
        taxRateId: string;
        taxRateName: string;
        rate: number;
        amount: number;
      }>;
    }>;
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
        lineItemTaxes: []
      };
    }
    
    let subtotal = 0;
    let totalTaxAmount = 0;
    const lineItemTaxes: Array<{
      lineItemId: string;
      productId: string;
      taxAmount: number;
      taxBreakdown: Array<{
        taxRateId: string;
        taxRateName: string;
        rate: number;
        amount: number;
      }>;
    }> = [];
    
    // Aggregate tax breakdown across all items
    const aggregatedTaxBreakdown: Map<string, {
      taxRateId: string;
      taxRateName: string;
      rate: number;
      amount: number;
    }> = new Map();
    
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
        const existing = aggregatedTaxBreakdown.get(tax.taxRateId);
        
        if (existing) {
          existing.amount += tax.amount;
        } else {
          aggregatedTaxBreakdown.set(tax.taxRateId, { ...tax });
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
      lineItemTaxes
    };
  }
}

export default new TaxRepo();
