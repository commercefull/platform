import { queryOne, query } from "../../../libs/db";
import { generateUUID } from "../../../libs/uuid";
import { Table } from "../../../libs/db/types";
import { CustomerPrice, CustomerPriceList, PricingRuleStatus } from "../domain/pricingRule";

/**
 * Customer Price Repository
 * 
 * Uses camelCase for table and column names as per platform convention.
 * Tables: priceList, customerPriceList, customerPrice (from db/types.ts)
 */
export class CustomerPriceRepo {
  private readonly priceListTable = Table.PriceList;
  private readonly customerPriceListTable = Table.CustomerPriceList;
  private readonly customerPriceTable = Table.CustomerPrice;

  /**
   * Find a price list by ID
   */
  async findPriceListById(id: string): Promise<CustomerPriceList | null> {
    const sql = `SELECT * FROM "${this.priceListTable}" WHERE "priceListId" = $1`;
    return await queryOne<CustomerPriceList>(sql, [id]);
  }

  /**
   * Find price lists by customer
   */
  async findPriceListsForCustomer(
    customerId: string,
    customerGroupIds?: string[]
  ): Promise<CustomerPriceList[]> {
    const now = new Date();
    
    let conditions = [
      `"isActive" = true`,
      `("startDate" IS NULL OR "startDate" <= $1)`,
      `("endDate" IS NULL OR "endDate" >= $1)`,
    ];
    
    const params: any[] = [now];
    
    // Customer ID condition
    params.push(customerId);
    conditions.push(`"customerIds" @> ARRAY[$${params.length}]::uuid[]`);
    
    // Customer Group IDs condition (if provided)
    if (customerGroupIds && customerGroupIds.length > 0) {
      const placeholders = customerGroupIds.map((_, i) => `$${params.length + i + 1}`).join(', ');
      params.push(...customerGroupIds);
      conditions.push(`"customerGroupIds" && ARRAY[${placeholders}]::uuid[]`);
    }
    
    const sql = `
      SELECT * FROM "${this.customerPriceListTable}"
      WHERE ${conditions.join(' AND ')}
      ORDER BY "priority" DESC, "createdAt" ASC
    `;
    
    return await query<CustomerPriceList[]>(sql, params) || [];
  }

  /**
   * Create a new price list
   */
  async createPriceList(priceList: Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerPriceList> {
    const now = new Date();
    
    const sql = `
      INSERT INTO "${this.priceListTable}" (
        "name", "description", "priority", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      priceList.name,
      priceList.description || null,
      priceList.priority || 0,
      true,
      now,
      now
    ];
    
    const result = await queryOne<CustomerPriceList>(sql, values);
    
    if (!result) {
      throw new Error('Failed to create price list');
    }
    
    return result;
  }

  /**
   * Update a price list
   */
  async updatePriceList(id: string, priceList: Partial<Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CustomerPriceList> {
    const now = new Date();
    
    const setStatements: string[] = ['"updatedAt" = $2'];
    const values: any[] = [id, now];
    let paramIndex = 3;
    
    for (const [key, value] of Object.entries(priceList)) {
      if (value === undefined) continue;
      setStatements.push(`"${key}" = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    const sql = `
      UPDATE "${this.priceListTable}"
      SET ${setStatements.join(', ')}
      WHERE "priceListId" = $1
      RETURNING *
    `;
    
    const result = await queryOne<CustomerPriceList>(sql, values);
    
    if (!result) {
      throw new Error('Price list not found or update failed');
    }
    
    return result;
  }

  /**
   * Delete a price list
   */
  async deletePriceList(id: string): Promise<boolean> {
    // First, delete all associated customer prices
    await query(`DELETE FROM "${this.customerPriceTable}" WHERE "priceListId" = $1`, [id]);
    
    // Then delete the price list
    const sql = `DELETE FROM "${this.priceListTable}" WHERE "priceListId" = $1`;
    const result = await query(sql, [id]);
    
    return result !== null;
  }

  /**
   * Find a specific customer price by ID
   */
  async findPriceById(id: string): Promise<CustomerPrice | null> {
    const sql = `SELECT * FROM "${this.customerPriceTable}" WHERE "customerPriceId" = $1`;
    return await queryOne<CustomerPrice>(sql, [id]);
  }

  /**
   * Find customer prices by price list ID
   */
  async findPricesByPriceListId(priceListId: string): Promise<CustomerPrice[]> {
    const sql = `SELECT * FROM "${this.customerPriceTable}" WHERE "priceListId" = $1`;
    return await query<CustomerPrice[]>(sql, [priceListId]) || [];
  }

  /**
   * Find customer prices by product ID
   */
  async findPricesForProduct(
    productId: string,
    variantId?: string,
    customerPriceLists?: string[]
  ): Promise<CustomerPrice[]> {
    const conditions = [`"productId" = $1`];
    const params: any[] = [productId];
    
    if (variantId) {
      params.push(variantId);
      conditions.push(`("productVariantId" = $${params.length} OR "productVariantId" IS NULL)`);
    }
    
    if (customerPriceLists && customerPriceLists.length > 0) {
      const placeholders = customerPriceLists.map((_, i) => `$${params.length + i + 1}`).join(', ');
      params.push(...customerPriceLists);
      conditions.push(`"priceListId" IN (${placeholders})`);
    }
    
    const sql = `
      SELECT * FROM "${this.customerPriceTable}"
      WHERE ${conditions.join(' AND ')}
    `;
    
    return await query<CustomerPrice[]>(sql, params) || [];
  }

  /**
   * Create a new customer price
   */
  async createPrice(customerPrice: Omit<CustomerPrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerPrice> {
    const now = new Date();
    
    const sql = `
      INSERT INTO "${this.customerPriceTable}" (
        "priceListId", "productId", "productVariantId", "adjustmentType", "adjustmentValue"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      customerPrice.priceListId,
      customerPrice.productId,
      customerPrice.variantId || (customerPrice as any).productVariantId || null,
      customerPrice.adjustmentType,
      customerPrice.adjustmentValue
    ];
    
    const result = await queryOne<CustomerPrice>(sql, values);
    
    if (!result) {
      throw new Error('Failed to create customer price');
    }
    
    return result;
  }

  /**
   * Update a customer price
   */
  async updatePrice(id: string, customerPrice: Partial<Omit<CustomerPrice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CustomerPrice> {
    const now = new Date();
    
    const setStatements: string[] = ['"updatedAt" = $2'];
    const values: any[] = [id, now];
    let paramIndex = 3;
    
    for (const [key, value] of Object.entries(customerPrice)) {
      if (value === undefined) continue;
      setStatements.push(`"${key}" = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    const sql = `
      UPDATE "${this.customerPriceTable}"
      SET ${setStatements.join(', ')}
      WHERE "customerPriceId" = $1
      RETURNING *
    `;
    
    const result = await queryOne<CustomerPrice>(sql, values);
    
    if (!result) {
      throw new Error('Customer price not found or update failed');
    }
    
    return result;
  }

  /**
   * Delete a customer price
   */
  async deletePrice(id: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.customerPriceTable}" WHERE "customerPriceId" = $1`;
    const result = await query(sql, [id]);
    return result !== null;
  }

  /**
   * Delete all prices for a price list
   */
  async deletePricesForPriceList(priceListId: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.customerPriceTable}" WHERE "priceListId" = $1`;
    const result = await query(sql, [priceListId]);
    return result !== null;
  }
}

export default new CustomerPriceRepo();
