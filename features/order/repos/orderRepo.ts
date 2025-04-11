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

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  price: number; // Unit price after discounts
  subtotal: number; // price * quantity
  discount_total: number;
  tax_total: number;
  total: number; // Final total for this line
  weight?: number;
  tax_rate?: number;
  tax_class?: string;
  options?: Record<string, any>; // Product options/attributes
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
};

export type Address = {
  first_name: string;
  last_name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email?: string;
};

export type Order = {
  id: string;
  order_number: string;
  customer_id?: string;
  basket_id?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  currency_code: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  shipping_total: number;
  handling_fee: number;
  total_amount: number;
  total_items: number;
  total_quantity: number;
  tax_exempt: boolean;
  order_date: Date;
  completed_at?: Date;
  cancelled_at?: Date;
  returned_at?: Date;
  shipping_address_id?: string;
  billing_address_id?: string;
  shipping_address: Address | Record<string, any>;
  billing_address?: Address | Record<string, any>;
  customer_email: string;
  customer_phone?: string;
  customer_name?: string;
  customer_notes?: string;
  admin_notes?: string;
  ip_address?: string;
  user_agent?: string;
  referral_source?: string;
  estimated_delivery_date?: Date;
  has_gift_wrapping: boolean;
  gift_message?: string;
  is_gift: boolean;
  is_subscription_order: boolean;
  parent_order_id?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
};

export type OrderCreateProps = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
export type OrderUpdateProps = Partial<Omit<Order, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'order_number'>>;

export class OrderRepo {
  /**
   * Find an order by its ID
   */
  async findById(id: string): Promise<Order | null> {
    return await queryOne<Order>(
      'SELECT * FROM "public"."order" WHERE "id" = $1 AND "deleted_at" IS NULL',
      [id]
    );
  }

  /**
   * Find an order by its order number
   */
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return await queryOne<Order>(
      'SELECT * FROM "public"."order" WHERE "order_number" = $1 AND "deleted_at" IS NULL',
      [orderNumber]
    );
  }

  /**
   * Find orders for a specific customer
   */
  async findByCustomer(customerId: string, limit: number = 100, offset: number = 0): Promise<Order[]> {
    return await query<Order[]>(
      'SELECT * FROM "public"."order" WHERE "customer_id" = $1 AND "deleted_at" IS NULL ORDER BY "created_at" DESC LIMIT $2 OFFSET $3',
      [customerId, limit, offset]
    ) || [];
  }

  /**
   * Find all orders with pagination
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<Order[]> {
    return await query<Order[]>(
      'SELECT * FROM "public"."order" WHERE "deleted_at" IS NULL ORDER BY "created_at" DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    ) || [];
  }

  /**
   * Find orders by their status
   */
  async findByStatus(status: OrderStatus, limit: number = 100, offset: number = 0): Promise<Order[]> {
    return await query<Order[]>(
      'SELECT * FROM "public"."order" WHERE "status" = $1 AND "deleted_at" IS NULL ORDER BY "created_at" DESC LIMIT $2 OFFSET $3',
      [status, limit, offset]
    ) || [];
  }

  /**
   * Find orders by payment status
   */
  async findByPaymentStatus(paymentStatus: PaymentStatus, limit: number = 100, offset: number = 0): Promise<Order[]> {
    return await query<Order[]>(
      'SELECT * FROM "public"."order" WHERE "payment_status" = $1 AND "deleted_at" IS NULL ORDER BY "created_at" DESC LIMIT $2 OFFSET $3',
      [paymentStatus, limit, offset]
    ) || [];
  }

  /**
   * Find orders by fulfillment status
   */
  async findByFulfillmentStatus(fulfillmentStatus: FulfillmentStatus, limit: number = 100, offset: number = 0): Promise<Order[]> {
    return await query<Order[]>(
      'SELECT * FROM "public"."order" WHERE "fulfillment_status" = $1 AND "deleted_at" IS NULL ORDER BY "created_at" DESC LIMIT $2 OFFSET $3',
      [fulfillmentStatus, limit, offset]
    ) || [];
  }

  /**
   * Find orders created during a specific date range
   */
  async findByDateRange(startDate: Date, endDate: Date, limit: number = 100, offset: number = 0): Promise<Order[]> {
    return await query<Order[]>(
      'SELECT * FROM "public"."order" WHERE "order_date" BETWEEN $1 AND $2 AND "deleted_at" IS NULL ORDER BY "created_at" DESC LIMIT $3 OFFSET $4',
      [startDate, endDate, limit, offset]
    ) || [];
  }

  /**
   * Count total orders
   */
  async count(): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "public"."order" WHERE "deleted_at" IS NULL'
    );
    return result ? parseInt(result.count) : 0;
  }

  /**
   * Count orders for a specific customer
   */
  async countByCustomer(customerId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "public"."order" WHERE "customer_id" = $1 AND "deleted_at" IS NULL',
      [customerId]
    );
    return result ? parseInt(result.count) : 0;
  }

  /**
   * Count orders with a specific status
   */
  async countByStatus(status: OrderStatus): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "public"."order" WHERE "status" = $1 AND "deleted_at" IS NULL',
      [status]
    );
    return result ? parseInt(result.count) : 0;
  }

  /**
   * Get items for a specific order
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await query<OrderItem[]>(
      'SELECT * FROM "public"."order_item" WHERE "order_id" = $1 AND "deleted_at" IS NULL ORDER BY "id"',
      [orderId]
    ) || [];
  }

  /**
   * Create a new order
   */
  async create(orderData: OrderCreateProps): Promise<Order> {
    const now = new Date();
    
    // Extract fields for the query
    const fields: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Process each property in orderData
    for (const [key, value] of Object.entries(orderData)) {
      if (value !== undefined) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        fields.push(`"${snakeKey}"`);
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
    
    // Execute the query
    const result = await queryOne<Order>(sql, values);
    
    if (!result) {
      throw new Error('Failed to create order');
    }
    
    return result;
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
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        updateParts.push(`"${snakeKey}" = $${paramIndex}`);
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
    return await queryOne<Order>(sql, values);
  }

  /**
   * Update the status of an order
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const now = new Date();
    
    // Update the order status
    const result = await queryOne<Order>(
      `UPDATE "public"."order"
       SET "status" = $1, "updated_at" = $2
       WHERE "id" = $3 AND "deleted_at" IS NULL
       RETURNING *`,
      [status, now, id]
    );
    
    if (!result) {
      return null;
    }
    
    // Record the status change in the history table
    await query(
      `INSERT INTO "public"."order_status_history" 
       ("order_id", "status", "created_at")
       VALUES ($1, $2, $3)`,
      [id, status, now]
    );
    
    return result;
  }

  /**
   * Update the payment status of an order
   */
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order | null> {
    const now = new Date();
    
    return await queryOne<Order>(
      `UPDATE "public"."order"
       SET "payment_status" = $1, "updated_at" = $2
       WHERE "id" = $3 AND "deleted_at" IS NULL
       RETURNING *`,
      [paymentStatus, now, id]
    );
  }

  /**
   * Update the fulfillment status of an order
   */
  async updateFulfillmentStatus(id: string, fulfillmentStatus: FulfillmentStatus): Promise<Order | null> {
    const now = new Date();
    
    return await queryOne<Order>(
      `UPDATE "public"."order"
       SET "fulfillment_status" = $1, "updated_at" = $2
       WHERE "id" = $3 AND "deleted_at" IS NULL
       RETURNING *`,
      [fulfillmentStatus, now, id]
    );
  }

  /**
   * Soft delete an order
   */
  async delete(id: string): Promise<boolean> {
    const now = new Date();
    
    const result = await queryOne<{ id: string }>(
      `UPDATE "public"."order"
       SET "deleted_at" = $1, "updated_at" = $1
       WHERE "id" = $2 AND "deleted_at" IS NULL
       RETURNING "id"`,
      [now, id]
    );
    
    return !!result;
  }

  /**
   * Calculate order totals
   */
  async calculateTotals(id: string): Promise<Order | null> {
    // 1. Get all order items
    const items = await this.getOrderItems(id);
    
    if (!items || items.length === 0) {
      return null;
    }
    
    // 2. Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    
    // 3. Get tax and discount totals
    const tax_total = items.reduce((sum, item) => sum + item.tax_total, 0);
    const discount_total = items.reduce((sum, item) => sum + item.discount_total, 0);
    
    // 4. Get shipping total from order_shipping
    const shippingResult = await queryOne<{ total: number }>(
      `SELECT SUM("amount") as total 
       FROM "public"."order_shipping" 
       WHERE "order_id" = $1 AND "deleted_at" IS NULL`,
      [id]
    );
    const shipping_total = shippingResult?.total || 0;
    
    // 5. Calculate total amount
    const total_amount = subtotal - discount_total + tax_total + shipping_total;
    
    // 6. Update the order with the calculated totals
    return await this.update(id, {
      subtotal,
      discount_total,
      tax_total,
      shipping_total,
      total_amount
    });
  }
}

export default new OrderRepo();
