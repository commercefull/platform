import { queryOne, query } from "../../../libs/db";

// Import types from generated DB types - single source of truth
import { 
  Order as DbOrder,
  OrderItem as DbOrderItem 
} from '../../../libs/db/types';

// Re-export DB types
export type Order = DbOrder;
export type OrderItem = DbOrderItem;

// Status types based on database enum values
export type OrderStatus = 'pending' | 'processing' | 'onHold' | 'completed' | 'shipped' | 
                         'delivered' | 'cancelled' | 'refunded' | 'failed' | 
                         'paymentPending' | 'paymentFailed' | 'backordered';

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'partiallyPaid' | 
                           'partiallyRefunded' | 'refunded' | 'failed' | 
                           'voided' | 'requiresAction';

export type FulfillmentStatus = 'unfulfilled' | 'partiallyFulfilled' | 'fulfilled' | 
                               'partiallyShipped' | 'shipped' | 'delivered' | 'restocked' |
                               'failed' | 'canceled' | 'cancelled' | 'pendingPickup' | 
                               'pickedUp' | 'returned';

// Derived types for create/update operations
export type OrderCreateParams = Partial<Omit<Order, 'orderId' | 'createdAt' | 'updatedAt'>> & {
  orderNumber: string;
  customerEmail: string;
};

export type OrderUpdateParams = Partial<Omit<Order, 'orderId' | 'createdAt' | 'updatedAt'>>;

export class OrderRepo {
  // ============================================================================
  // Order CRUD Operations
  // ============================================================================

  async findById(orderId: string): Promise<Order | null> {
    return await queryOne<Order>(
      'SELECT * FROM "order" WHERE "orderId" = $1',
      [orderId]
    );
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return await queryOne<Order>(
      'SELECT * FROM "order" WHERE "orderNumber" = $1',
      [orderNumber]
    );
  }

  async findByCustomer(customerId: string, limit: number = 100, offset: number = 0): Promise<Order[]> {
    const results = await query<Order[]>(
      'SELECT * FROM "order" WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3',
      [customerId, limit, offset]
    );
    return results || [];
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<Order[]> {
    const results = await query<Order[]>(
      'SELECT * FROM "order" ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return results || [];
  }

  async findByStatus(status: OrderStatus, limit: number = 100, offset: number = 0): Promise<Order[]> {
    const results = await query<Order[]>(
      'SELECT * FROM "order" WHERE status = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3',
      [status, limit, offset]
    );
    return results || [];
  }

  async findByPaymentStatus(paymentStatus: PaymentStatus, limit: number = 100, offset: number = 0): Promise<Order[]> {
    const results = await query<Order[]>(
      'SELECT * FROM "order" WHERE "paymentStatus" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3',
      [paymentStatus, limit, offset]
    );
    return results || [];
  }

  async findByFulfillmentStatus(fulfillmentStatus: FulfillmentStatus, limit: number = 100, offset: number = 0): Promise<Order[]> {
    const results = await query<Order[]>(
      'SELECT * FROM "order" WHERE "fulfillmentStatus" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3',
      [fulfillmentStatus, limit, offset]
    );
    return results || [];
  }

  async findByDateRange(startDate: Date, endDate: Date, limit: number = 100, offset: number = 0): Promise<Order[]> {
    const results = await query<Order[]>(
      'SELECT * FROM "order" WHERE "createdAt" >= $1 AND "createdAt" <= $2 ORDER BY "createdAt" DESC LIMIT $3 OFFSET $4',
      [startDate, endDate, limit, offset]
    );
    return results || [];
  }

  // ============================================================================
  // Count Operations
  // ============================================================================

  async count(): Promise<number> {
    const result = await queryOne<{count: string}>('SELECT COUNT(*) as count FROM "order"');
    return result ? parseInt(result.count) : 0;
  }

  async countByCustomer(customerId: string): Promise<number> {
    const result = await queryOne<{count: string}>(
      'SELECT COUNT(*) as count FROM "order" WHERE "customerId" = $1',
      [customerId]
    );
    return result ? parseInt(result.count) : 0;
  }

  async countByStatus(status: OrderStatus): Promise<number> {
    const result = await queryOne<{count: string}>(
      'SELECT COUNT(*) as count FROM "order" WHERE status = $1',
      [status]
    );
    return result ? parseInt(result.count) : 0;
  }

  // ============================================================================
  // Order Items
  // ============================================================================

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const results = await query<OrderItem[]>(
      'SELECT * FROM "orderItem" WHERE "orderId" = $1 ORDER BY "orderItemId"',
      [orderId]
    );
    return results || [];
  }

  // ============================================================================
  // Create / Update / Delete
  // ============================================================================

  async create(params: OrderCreateParams): Promise<Order> {
    const now = new Date();

    const sql = `
      INSERT INTO "order" (
        "orderNumber", "customerId", "basketId", status, "paymentStatus", "fulfillmentStatus",
        "currencyCode", subtotal, "discountTotal", "taxTotal", "shippingTotal", "handlingFee",
        "totalAmount", "totalItems", "totalQuantity", "taxExempt", "orderDate",
        "shippingAddress", "billingAddress", "customerEmail", "customerPhone", "customerName",
        "customerNotes", "hasGiftWrapping", "isGift", "isSubscriptionOrder", metadata,
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      ) RETURNING *
    `;

    const result = await queryOne<Order>(sql, [
      params.orderNumber,
      params.customerId || null,
      params.basketId || null,
      params.status || 'pending',
      params.paymentStatus || 'pending',
      params.fulfillmentStatus || 'unfulfilled',
      params.currencyCode || 'USD',
      params.subtotal || 0,
      params.discountTotal || 0,
      params.taxTotal || 0,
      params.shippingTotal || 0,
      params.handlingFee || 0,
      params.totalAmount || 0,
      params.totalItems || 0,
      params.totalQuantity || 0,
      params.taxExempt || false,
      params.orderDate || now,
      params.shippingAddress ? JSON.stringify(params.shippingAddress) : null,
      params.billingAddress ? JSON.stringify(params.billingAddress) : null,
      params.customerEmail,
      params.customerPhone || null,
      params.customerName || null,
      params.customerNotes || null,
      params.hasGiftWrapping || false,
      params.isGift || false,
      params.isSubscriptionOrder || false,
      params.metadata ? JSON.stringify(params.metadata) : null,
      now,
      now
    ]);

    if (!result) {
      throw new Error('Failed to create order');
    }

    return result;
  }

  async update(orderId: string, params: OrderUpdateParams): Promise<Order | null> {
    const now = new Date();
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const jsonFields = ['shippingAddress', 'billingAddress', 'metadata'];

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return this.findById(orderId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    values.push(orderId);

    const sql = `UPDATE "order" SET ${updateFields.join(', ')} WHERE "orderId" = $${paramIndex} RETURNING *`;
    const result = await queryOne<Order>(sql, values);

    return result;
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const now = new Date();
    
    const result = await queryOne<Order>(
      'UPDATE "order" SET status = $1, "updatedAt" = $2 WHERE "orderId" = $3 RETURNING *',
      [status, now, orderId]
    );

    if (result) {
      // Record status change in history
      await query(
        'INSERT INTO "orderStatusHistory" ("orderId", status, "createdAt") VALUES ($1, $2, $3)',
        [orderId, status, now]
      );
    }

    return result;
  }

  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<Order | null> {
    const now = new Date();
    
    return await queryOne<Order>(
      'UPDATE "order" SET "paymentStatus" = $1, "updatedAt" = $2 WHERE "orderId" = $3 RETURNING *',
      [paymentStatus, now, orderId]
    );
  }

  async updateFulfillmentStatus(orderId: string, fulfillmentStatus: FulfillmentStatus): Promise<Order | null> {
    const now = new Date();
    
    return await queryOne<Order>(
      'UPDATE "order" SET "fulfillmentStatus" = $1, "updatedAt" = $2 WHERE "orderId" = $3 RETURNING *',
      [fulfillmentStatus, now, orderId]
    );
  }

  async delete(orderId: string): Promise<boolean> {
    const result = await queryOne<{ orderId: string }>(
      'DELETE FROM "order" WHERE "orderId" = $1 RETURNING "orderId"',
      [orderId]
    );
    return !!result;
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  async getStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
  }> {
    const total = await this.count();
    const pending = await this.countByStatus('pending');
    const processing = await this.countByStatus('processing');
    const completed = await this.countByStatus('completed');
    const cancelled = await this.countByStatus('cancelled');

    return {
      totalOrders: total,
      pendingOrders: pending,
      processingOrders: processing,
      completedOrders: completed,
      cancelledOrders: cancelled
    };
  }
}

export default new OrderRepo();
