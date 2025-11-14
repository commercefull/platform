import { queryOne, query } from "../../../libs/db";
import { generateUUID } from "../../../libs/uuid";
import { CustomerPrice, CustomerPriceList, PricingRuleStatus } from "../domain/pricingRule";

// Define DB column to TS property mapping for price list
const priceListDbToTs: Record<string, string> = {
  id: 'id',
  name: 'name',
  description: 'description',
  customer_ids: 'customerIds',
  customer_group_ids: 'customerGroupIds',
  priority: 'priority',
  start_date: 'startDate',
  end_date: 'endDate',
  status: 'status',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  merchant_id: 'merchantId'
};

// Define DB column to TS property mapping for customer price
const customerPriceDbToTs: Record<string, string> = {
  id: 'id',
  price_list_id: 'priceListId',
  product_id: 'productId',
  variant_id: 'variantId',
  adjustment_type: 'adjustmentType',
  adjustment_value: 'adjustmentValue',
  created_at: 'createdAt',
  updated_at: 'updatedAt'
};

// Define TS property to DB column mapping for price list
const priceListTsToDb = Object.entries(priceListDbToTs).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

// Define TS property to DB column mapping for customer price
const customerPriceTsToDb = Object.entries(customerPriceDbToTs).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class CustomerPriceRepo {
  /**
   * Convert snake_case column name to camelCase property name for price lists
   */
  private priceListDbToTs(columnName: string): string {
    return priceListDbToTs[columnName] || columnName;
  }

  /**
   * Convert camelCase property name to snake_case column name for price lists
   */
  private priceListTsToDb(propertyName: string): string {
    return priceListTsToDb[propertyName] || propertyName;
  }

  /**
   * Convert snake_case column name to camelCase property name for customer prices
   */
  private customerPriceDbToTs(columnName: string): string {
    return customerPriceDbToTs[columnName] || columnName;
  }

  /**
   * Convert camelCase property name to snake_case column name for customer prices
   */
  private customerPriceTsToDb(propertyName: string): string {
    return customerPriceTsToDb[propertyName] || propertyName;
  }

  /**
   * Generate field mapping for SELECT statements for price lists
   */
  private generatePriceListSelectFields(fields: string[] = Object.keys(priceListDbToTs)): string {
    return fields.map(field => {
      return `"${field}" AS "${this.priceListDbToTs(field)}"`;
    }).join(', ');
  }

  /**
   * Generate field mapping for SELECT statements for customer prices
   */
  private generateCustomerPriceSelectFields(fields: string[] = Object.keys(customerPriceDbToTs)): string {
    return fields.map(field => {
      return `"${field}" AS "${this.customerPriceDbToTs(field)}"`;
    }).join(', ');
  }

  /**
   * Find a price list by ID
   */
  async findPriceListById(id: string): Promise<CustomerPriceList | null> {
    const selectFields = this.generatePriceListSelectFields();
    const sql = `SELECT ${selectFields} FROM "public"."customer_price_list" WHERE "id" = $1`;
    
    return await queryOne<CustomerPriceList>(sql, [id]);
  }

  /**
   * Find price lists by customer
   */
  async findPriceListsForCustomer(
    customerId: string,
    customerGroupIds?: string[]
  ): Promise<CustomerPriceList[]> {
    const selectFields = this.generatePriceListSelectFields();
    const now = new Date();
    
    let conditions = [
      `"status" = $1`,
      `("start_date" IS NULL OR "start_date" <= $2)`,
      `("end_date" IS NULL OR "end_date" >= $2)`,
    ];
    
    const params: any[] = [PricingRuleStatus.ACTIVE, now];
    
    // Customer ID condition
    params.push(customerId);
    conditions.push(`"customer_ids" @> ARRAY[$${params.length}]::uuid[]`);
    
    // Customer Group IDs condition (if provided)
    if (customerGroupIds && customerGroupIds.length > 0) {
      const placeholders = customerGroupIds.map((_, i) => `$${params.length + i + 1}`).join(', ');
      params.push(...customerGroupIds);
      conditions.push(`"customer_group_ids" && ARRAY[${placeholders}]::uuid[]`);
    }
    
    const whereClause = conditions.join(' AND ');
    
    const sql = `
      SELECT ${selectFields}
      FROM "public"."customer_price_list"
      WHERE ${whereClause}
      ORDER BY "priority" DESC, "createdAt" ASC
    `;
    
    return await query<CustomerPriceList[]>(sql, params) || [];
  }

  /**
   * Create a new price list
   */
  async createPriceList(priceList: Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerPriceList> {
    const now = new Date();
    const id = generateUUID();
    
    const dbFields: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [id, now, now];
    
    dbFields.push('id', 'created_at', 'updated_at');
    placeholders.push('$1', '$2', '$3');
    
    // Process each field from the input data
    let placeholderIndex = 4;
    
    for (const [key, value] of Object.entries(priceList)) {
      if (value === undefined) continue;
      
      const dbField = this.priceListTsToDb(key);
      dbFields.push(dbField);
      placeholders.push(`$${placeholderIndex}`);
      values.push(value);
      
      placeholderIndex++;
    }
    
    const fieldList = dbFields.map(f => `"${f}"`).join(', ');
    const placeholderList = placeholders.join(', ');
    
    const selectFields = this.generatePriceListSelectFields();
    
    const sql = `
      INSERT INTO "public"."customer_price_list" (${fieldList})
      VALUES (${placeholderList})
      RETURNING ${selectFields}
    `;
    
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
    
    const setStatements: string[] = [];
    const values: any[] = [id, now];
    
    setStatements.push(`"updatedAt" = $2`);
    
    // Process each field from the input data
    let placeholderIndex = 3;
    
    for (const [key, value] of Object.entries(priceList)) {
      if (value === undefined) continue;
      
      const dbField = this.priceListTsToDb(key);
      setStatements.push(`"${dbField}" = $${placeholderIndex}`);
      values.push(value);
      
      placeholderIndex++;
    }
    
    const setClause = setStatements.join(', ');
    const selectFields = this.generatePriceListSelectFields();
    
    const sql = `
      UPDATE "public"."customer_price_list"
      SET ${setClause}
      WHERE "id" = $1
      RETURNING ${selectFields}
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
    await query(`DELETE FROM "public"."customer_price" WHERE "price_list_id" = $1`, [id]);
    
    // Then delete the price list
    const sql = `DELETE FROM "public"."customer_price_list" WHERE "id" = $1`;
    const result = await query(sql, [id]);
    
    return result !== null;
  }

  /**
   * Find a specific customer price by ID
   */
  async findPriceById(id: string): Promise<CustomerPrice | null> {
    const selectFields = this.generateCustomerPriceSelectFields();
    const sql = `SELECT ${selectFields} FROM "public"."customer_price" WHERE "id" = $1`;
    
    return await queryOne<CustomerPrice>(sql, [id]);
  }

  /**
   * Find customer prices by price list ID
   */
  async findPricesByPriceListId(priceListId: string): Promise<CustomerPrice[]> {
    const selectFields = this.generateCustomerPriceSelectFields();
    const sql = `
      SELECT ${selectFields}
      FROM "public"."customer_price"
      WHERE "price_list_id" = $1
    `;
    
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
    const selectFields = this.generateCustomerPriceSelectFields();
    
    const conditions = [`"productId" = $1`];
    const params: any[] = [productId];
    
    if (variantId) {
      params.push(variantId);
      conditions.push(`("variant_id" = $${params.length} OR "variant_id" IS NULL)`);
    }
    
    if (customerPriceLists && customerPriceLists.length > 0) {
      const placeholders = customerPriceLists.map((_, i) => `$${params.length + i + 1}`).join(', ');
      params.push(...customerPriceLists);
      conditions.push(`"price_list_id" IN (${placeholders})`);
    }
    
    const whereClause = conditions.join(' AND ');
    
    const sql = `
      SELECT ${selectFields}
      FROM "public"."customer_price"
      WHERE ${whereClause}
    `;
    
    return await query<CustomerPrice[]>(sql, params) || [];
  }

  /**
   * Create a new customer price
   */
  async createPrice(customerPrice: Omit<CustomerPrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerPrice> {
    const now = new Date();
    const id = generateUUID();
    
    const dbFields: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [id, now, now];
    
    dbFields.push('id', 'created_at', 'updated_at');
    placeholders.push('$1', '$2', '$3');
    
    // Process each field from the input data
    let placeholderIndex = 4;
    
    for (const [key, value] of Object.entries(customerPrice)) {
      if (value === undefined) continue;
      
      const dbField = this.customerPriceTsToDb(key);
      dbFields.push(dbField);
      placeholders.push(`$${placeholderIndex}`);
      values.push(value);
      
      placeholderIndex++;
    }
    
    const fieldList = dbFields.map(f => `"${f}"`).join(', ');
    const placeholderList = placeholders.join(', ');
    
    const selectFields = this.generateCustomerPriceSelectFields();
    
    const sql = `
      INSERT INTO "public"."customer_price" (${fieldList})
      VALUES (${placeholderList})
      RETURNING ${selectFields}
    `;
    
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
    
    const setStatements: string[] = [];
    const values: any[] = [id, now];
    
    setStatements.push(`"updatedAt" = $2`);
    
    // Process each field from the input data
    let placeholderIndex = 3;
    
    for (const [key, value] of Object.entries(customerPrice)) {
      if (value === undefined) continue;
      
      const dbField = this.customerPriceTsToDb(key);
      setStatements.push(`"${dbField}" = $${placeholderIndex}`);
      values.push(value);
      
      placeholderIndex++;
    }
    
    const setClause = setStatements.join(', ');
    const selectFields = this.generateCustomerPriceSelectFields();
    
    const sql = `
      UPDATE "public"."customer_price"
      SET ${setClause}
      WHERE "id" = $1
      RETURNING ${selectFields}
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
    const sql = `DELETE FROM "public"."customer_price" WHERE "id" = $1`;
    const result = await query(sql, [id]);
    
    return result !== null;
  }

  /**
   * Delete all prices for a price list
   */
  async deletePricesForPriceList(priceListId: string): Promise<boolean> {
    const sql = `DELETE FROM "public"."customer_price" WHERE "price_list_id" = $1`;
    const result = await query(sql, [priceListId]);
    
    return result !== null;
  }
}

export default new CustomerPriceRepo();
