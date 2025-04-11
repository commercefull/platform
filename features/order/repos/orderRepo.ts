import { queryOne, query } from "../../../libs/db";

// Use the same order status enum as defined in the database
export type OrderStatus = 'pending' | 'processing' | 'on_hold' | 'completed' | 'shipped' | 
                         'delivered' | 'cancelled' | 'refunded' | 'failed' | 
                         'payment_pending' | 'payment_failed' | 'backordered';

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'partially_paid' | 
                           'partially_refunded' | 'refunded' | 'failed' | 
                           'voided' | 'requires_action';

export type FulfillmentStatus = 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 
                               'shipped' | 'delivered' | 'cancelled' | 'returned' | 
                               'pending_pickup' | 'picked_up';

// Define mapping between database columns and TypeScript properties
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  order_number: 'orderNumber',
  customer_id: 'customerId',
  basket_id: 'basketId',
  status: 'status',
  payment_status: 'paymentStatus',
  fulfillment_status: 'fulfillmentStatus',
  currency_code: 'currencyCode',
  subtotal: 'subtotal',
  discount_total: 'discountTotal',
  tax_total: 'taxTotal',
  shipping_total: 'shippingTotal',
  handling_fee: 'handlingFee',
  total_amount: 'totalAmount',
  total_items: 'totalItems',
  total_quantity: 'totalQuantity',
  tax_exempt: 'taxExempt',
  order_date: 'orderDate',
  completed_at: 'completedAt',
  cancelled_at: 'cancelledAt',
  returned_at: 'returnedAt',
  shipping_address_id: 'shippingAddressId',
  billing_address_id: 'billingAddressId',
  shipping_address: 'shippingAddress',
  billing_address: 'billingAddress',
  customer_email: 'customerEmail',
  customer_phone: 'customerPhone',
  customer_name: 'customerName',
  customer_notes: 'customerNotes',
  admin_notes: 'adminNotes',
  ip_address: 'ipAddress',
  user_agent: 'userAgent',
  referral_source: 'referralSource',
  estimated_delivery_date: 'estimatedDeliveryDate',
  has_gift_wrapping: 'hasGiftWrapping',
  gift_message: 'giftMessage',
  is_gift: 'isGift',
  is_subscription_order: 'isSubscriptionOrder',
  parent_order_id: 'parentOrderId',
  tags: 'tags',
  metadata: 'metadata',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  deleted_at: 'deletedAt'
};

// Define mapping between TypeScript properties and database columns
const tsToDdMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

// Order item mapping
const orderItemDbToTsMapping: Record<string, string> = {
  id: 'id',
  order_id: 'orderId',
  product_id: 'productId',
  variant_id: 'variantId',
  sku: 'sku',
  name: 'name',
  description: 'description',
  quantity: 'quantity',
  unit_price: 'unitPrice',
  price: 'price',
  subtotal: 'subtotal',
  discount_total: 'discountTotal',
  tax_total: 'taxTotal',
  total: 'total',
  weight: 'weight',
  tax_rate: 'taxRate',
  tax_class: 'taxClass',
  options: 'options',
  metadata: 'metadata',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  deleted_at: 'deletedAt'
};

// Address mapping
const addressDbToTsMapping: Record<string, string> = {
  first_name: 'firstName',
  last_name: 'lastName',
  company: 'company',
  address1: 'address1',
  address2: 'address2',
  city: 'city',
  state: 'state',
  postal_code: 'postalCode',
  country: 'country',
  phone: 'phone',
  email: 'email'
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  price: number; // Unit price after discounts
  subtotal: number; // price * quantity
  discountTotal: number;
  taxTotal: number;
  total: number; // Final total for this line
  weight?: number;
  taxRate?: number;
  taxClass?: string;
  options?: Record<string, any>; // Product options/attributes
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type Address = {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId?: string;
  basketId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  currencyCode: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  handlingFee: number;
  totalAmount: number;
  totalItems: number;
  totalQuantity: number;
  taxExempt: boolean;
  orderDate: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  returnedAt?: Date;
  shippingAddressId?: string;
  billingAddressId?: string;
  shippingAddress: Address | Record<string, any>;
  billingAddress?: Address | Record<string, any>;
  customerEmail: string;
  customerPhone?: string;
  customerName?: string;
  customerNotes?: string;
  adminNotes?: string;
  ipAddress?: string;
  userAgent?: string;
  referralSource?: string;
  estimatedDeliveryDate?: Date;
  hasGiftWrapping: boolean;
  giftMessage?: string;
  isGift: boolean;
  isSubscriptionOrder: boolean;
  parentOrderId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type OrderCreateProps = Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type OrderUpdateProps = Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export class OrderRepo {
  /**
   * Convert TypeScript property name to database column name
   */
  private tsToDb(propertyName: string): string {
    return tsToDdMapping[propertyName] || propertyName;
  }

  /**
   * Convert database column name to TypeScript property name
   */
  private dbToTs(columnName: string): string {
    return dbToTsMapping[columnName] || columnName;
  }

  /**
   * Generate field mapping for SELECT statements
   */
  private generateSelectFields(fields: string[] = Object.keys(dbToTsMapping)): string {
    return fields.map(field => {
      const dbField = field;
      const tsField = this.dbToTs(field);
      return `"${dbField}" AS "${tsField}"`;
    }).join(', ');
  }

  /**
   * Map database result to TypeScript interface
   */
  private mapDbToTs(dbResult: any): any {
    const result: any = {};
    for (const [dbCol, value] of Object.entries(dbResult)) {
      // Use the mapping to get TypeScript property name
      const tsProp = this.dbToTs(dbCol);
      result[tsProp] = value;
    }
    return result;
  }

  /**
   * Find an order by its ID
   */
  async findById(id: string): Promise<Order | null> {
    const selectFields = this.generateSelectFields();

    const sql = `SELECT ${selectFields}
                FROM "public"."order"
                WHERE "id" = $1 AND "deleted_at" IS NULL`;
    
    return await queryOne<Order>(sql, [id]);
  }

  /**
   * Find an order by its order number
   */
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const selectFields = this.generateSelectFields();

    const sql = `SELECT ${selectFields}
                FROM "public"."order"
                WHERE "order_number" = $1 AND "deleted_at" IS NULL`;
    
    return await queryOne<Order>(sql, [orderNumber]);
  }

  /**
   * Find orders for a specific customer
   */
  async findByCustomer(customerId: string, limit: number = 100, offset: number = 0): Promise<Order[]> {
    const selectFields = this.generateSelectFields();

    const sql = `SELECT ${selectFields}
                FROM "public"."order"
                WHERE "customer_id" = $1 AND "deleted_at" IS NULL
                ORDER BY "created_at" DESC
                LIMIT $2 OFFSET $3`;
    
    return (await query<Order[]>(sql, [customerId, limit, offset])) || [];
  }

  /**
   * Find all orders with pagination
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<Order[]> {
    const selectFields = this.generateSelectFields();

    const sql = `SELECT ${selectFields}
                FROM "public"."order"
                WHERE "deleted_at" IS NULL
                ORDER BY "created_at" DESC
                LIMIT $1 OFFSET $2`;
    
    return (await query<Order[]>(sql, [limit, offset])) || [];
  }

  /**
   * Find orders by their status
   */
  async findByStatus(status: OrderStatus, limit: number = 100, offset: number = 0): Promise<Order[]> {
    const selectFields = this.generateSelectFields();

    const sql = `SELECT ${selectFields}
                FROM "public"."order"
                WHERE "status" = $1 AND "deleted_at" IS NULL
                ORDER BY "created_at" DESC
                LIMIT $2 OFFSET $3`;
    
    return (await query<Order[]>(sql, [status, limit, offset])) || [];
  }

  /**
   * Find orders by payment status
   */
  async findByPaymentStatus(paymentStatus: PaymentStatus, limit: number = 100, offset: number = 0): Promise<Order[]> {
    const selectFields = this.generateSelectFields();

    const sql = `SELECT ${selectFields}
                FROM "public"."order"
                WHERE "payment_status" = $1 AND "deleted_at" IS NULL
                ORDER BY "created_at" DESC
                LIMIT $2 OFFSET $3`;
    
    return (await query<Order[]>(sql, [paymentStatus, limit, offset])) || [];
  }

  /**
   * Find orders by fulfillment status
   */
  async findByFulfillmentStatus(fulfillmentStatus: FulfillmentStatus, limit: number = 100, offset: number = 0): Promise<Order[]> {
    const selectFields = this.generateSelectFields();

    const sql = `SELECT ${selectFields}
                FROM "public"."order"
                WHERE "fulfillment_status" = $1 AND "deleted_at" IS NULL
                ORDER BY "created_at" DESC
                LIMIT $2 OFFSET $3`;
    
    return (await query<Order[]>(sql, [fulfillmentStatus, limit, offset])) || [];
  }

  /**
   * Find orders created during a specific date range
   */
  async findByDateRange(startDate: Date, endDate: Date, limit: number = 100, offset: number = 0): Promise<Order[]> {
    const selectFields = this.generateSelectFields();

    const sql = `SELECT ${selectFields}
                FROM "public"."order"
                WHERE "created_at" >= $1 AND "created_at" <= $2 AND "deleted_at" IS NULL
                ORDER BY "created_at" DESC
                LIMIT $3 OFFSET $4`;
    
    return (await query<Order[]>(sql, [startDate, endDate, limit, offset])) || [];
  }

  /**
   * Count total orders
   */
  async count(): Promise<number> {
    const result = await queryOne<{count: string}>(`
      SELECT COUNT(*) as count FROM "public"."order" WHERE "deleted_at" IS NULL
    `);
    
    return result ? parseInt(result.count) : 0;
  }

  /**
   * Count orders for a specific customer
   */
  async countByCustomer(customerId: string): Promise<number> {
    const result = await queryOne<{count: string}>(`
      SELECT COUNT(*) as count 
      FROM "public"."order" 
      WHERE "customer_id" = $1 AND "deleted_at" IS NULL
    `, [customerId]);
    
    return result ? parseInt(result.count) : 0;
  }

  /**
   * Count orders with a specific status
   */
  async countByStatus(status: OrderStatus): Promise<number> {
    const result = await queryOne<{count: string}>(`
      SELECT COUNT(*) as count 
      FROM "public"."order" 
      WHERE "status" = $1 AND "deleted_at" IS NULL
    `, [status]);
    
    return result ? parseInt(result.count) : 0;
  }

  /**
   * Get items for a specific order
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const selectFields = Object.keys(orderItemDbToTsMapping).map(field => {
      const tsField = orderItemDbToTsMapping[field];
      return `"${field}" AS "${tsField}"`;
    }).join(', ');

    const sql = `SELECT ${selectFields}
                FROM "public"."order_item"
                WHERE "order_id" = $1 AND "deleted_at" IS NULL
                ORDER BY "id"`;
    
    return (await query<OrderItem[]>(sql, [orderId])) || [];
  }

  /**
   * Create a new order
   */
  async create(orderData: OrderCreateProps): Promise<Order> {
    const now = new Date();
    
    // Extract fields and values for the query
    const fields: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Process each property in orderData
    for (const [key, value] of Object.entries(orderData)) {
      if (value !== undefined) {
        // Convert camelCase to snake_case
        const dbField = this.tsToDb(key);
        fields.push(`"${dbField}"`);
        placeholders.push(`$${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    // Add created_at and updated_at
    fields.push('"created_at"', '"updated_at"');
    placeholders.push(`$${paramIndex}`, `$${paramIndex + 1}`);
    values.push(now, now);
    
    // Create the SQL query
    const sql = `
      INSERT INTO "public"."order" (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    // Execute the query and map the result
    const dbResult = await queryOne(sql, values);
    
    if (!dbResult) {
      throw new Error('Failed to create order');
    }
    
    return this.mapDbToTs(dbResult);
  }

  /**
   * Update an existing order
   */
  async update(id: string, orderData: OrderUpdateProps): Promise<Order | null> {
    // Check if order exists
    const existingOrder = await this.findById(id);
    if (!existingOrder) {
      return null;
    }
    
    const now = new Date();
    
    // Extract fields for the update query
    const updateParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Process each property in orderData
    for (const [key, value] of Object.entries(orderData)) {
      if (value !== undefined) {
        // Convert camelCase to snake_case using the mapping
        const dbField = this.tsToDb(key);
        updateParts.push(`"${dbField}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    // Add updated_at
    updateParts.push(`"updated_at" = $${paramIndex}`);
    values.push(now);
    paramIndex++;
    
    // Add id for the WHERE clause
    values.push(id);
    
    // Create the SQL query
    const sql = `
      UPDATE "public"."order"
      SET ${updateParts.join(', ')}
      WHERE "id" = $${paramIndex - 1} AND "deleted_at" IS NULL
      RETURNING *
    `;
    
    // Execute the query
    const dbResult = await queryOne(sql, values);
    
    if (!dbResult) {
      return null;
    }
    
    return this.mapDbToTs(dbResult);
  }

  /**
   * Update the status of an order
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const now = new Date();
    
    // Update the order status
    const dbResult = await queryOne(
      `UPDATE "public"."order"
       SET "status" = $1, "updated_at" = $2
       WHERE "id" = $3 AND "deleted_at" IS NULL
       RETURNING *`,
      [status, now, id]
    );
    
    if (!dbResult) {
      return null;
    }
    
    // Record the status change in the history table
    await query(
      `INSERT INTO "public"."order_status_history" 
       ("order_id", "status", "created_at")
       VALUES ($1, $2, $3)`,
      [id, status, now]
    );
    
    return this.mapDbToTs(dbResult);
  }

  /**
   * Update the payment status of an order
   */
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order | null> {
    const now = new Date();
    
    // Update the payment status
    const dbResult = await queryOne(
      `UPDATE "public"."order"
       SET "payment_status" = $1, "updated_at" = $2
       WHERE "id" = $3 AND "deleted_at" IS NULL
       RETURNING *`,
      [paymentStatus, now, id]
    );
    
    if (!dbResult) {
      return null;
    }
    
    // Record the payment status change in the history table
    await query(
      `INSERT INTO "public"."order_payment_history" 
       ("order_id", "payment_status", "created_at")
       VALUES ($1, $2, $3)`,
      [id, paymentStatus, now]
    );
    
    return this.mapDbToTs(dbResult);
  }

  /**
   * Update the fulfillment status of an order
   */
  async updateFulfillmentStatus(id: string, fulfillmentStatus: FulfillmentStatus): Promise<Order | null> {
    const now = new Date();
    
    // Update the fulfillment status
    const dbResult = await queryOne(
      `UPDATE "public"."order"
       SET "fulfillment_status" = $1, "updated_at" = $2
       WHERE "id" = $3 AND "deleted_at" IS NULL
       RETURNING *`,
      [fulfillmentStatus, now, id]
    );
    
    if (!dbResult) {
      return null;
    }
    
    // Record the fulfillment status change in the history table
    await query(
      `INSERT INTO "public"."order_fulfillment_history" 
       ("order_id", "fulfillment_status", "created_at")
       VALUES ($1, $2, $3)`,
      [id, fulfillmentStatus, now]
    );
    
    return this.mapDbToTs(dbResult);
  }

  /**
   * Soft delete an order
   */
  async delete(id: string): Promise<boolean> {
    const now = new Date();
    
    const result = await query(
      `UPDATE "public"."order"
       SET "deleted_at" = $1, "updated_at" = $1
       WHERE "id" = $2 AND "deleted_at" IS NULL`,
      [now, id]
    );
    
    return !!result;
  }

  /**
   * Calculate order totals
   */
  async calculateTotals(id: string): Promise<Order | null> {
    // Get order items
    const items = await this.getOrderItems(id);
    
    if (!items || items.length === 0) {
      return this.findById(id);
    }
    
    // Calculate totals
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let totalItems = items.length;
    let totalQuantity = 0;
    
    for (const item of items) {
      subtotal += item.subtotal;
      discountTotal += item.discountTotal;
      taxTotal += item.taxTotal;
      totalQuantity += item.quantity;
    }
    
    // Get current order to get shipping and handling fee
    const order = await this.findById(id);
    
    if (!order) {
      return null;
    }
    
    // Calculate final total
    const totalAmount = subtotal - discountTotal + taxTotal + order.shippingTotal + order.handlingFee;
    
    // Update the order
    return this.update(id, {
      subtotal,
      discountTotal,
      taxTotal,
      totalAmount,
      totalItems,
      totalQuantity
    });
  }
}

export default new OrderRepo();
