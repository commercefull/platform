import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type FulfillmentStatus = 
  | 'unfulfilled' 
  | 'partiallyFulfilled' 
  | 'fulfilled' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'returned' 
  | 'pendingPickup' 
  | 'pickedUp';

export interface OrderItem {
  orderItemId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  productId?: string;
  productVariantId?: string;
  basketItemId?: string;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discountedUnitPrice: number;
  lineTotal: number;
  discountTotal: number;
  taxTotal: number;
  taxRate?: number;
  taxExempt: boolean;
  options?: Record<string, any>;
  attributes?: Record<string, any>;
  fulfillmentStatus: FulfillmentStatus;
  giftWrapped: boolean;
  giftMessage?: string;
  weight?: number;
  dimensions?: Record<string, any>;
  isDigital: boolean;
  downloadLink?: string;
  downloadExpiryDate?: string;
  downloadLimit?: number;
  subscriptionInfo?: Record<string, any>;
}

export type OrderItemCreateParams = Omit<OrderItem, 'orderItemId' | 'createdAt' | 'updatedAt'>;
export type OrderItemUpdateParams = Partial<Pick<OrderItem, 
  'quantity' | 'unitPrice' | 'discountedUnitPrice' | 'lineTotal' | 'discountTotal' | 'taxTotal' | 
  'fulfillmentStatus' | 'options' | 'attributes' | 'giftWrapped' | 'giftMessage'
>>;

export class OrderItemRepo {
  /**
   * Find order item by ID
   */
  async findById(orderItemId: string): Promise<OrderItem | null> {
    return await queryOne<OrderItem>(
      `SELECT * FROM "public"."orderItem" WHERE "orderItemId" = $1`,
      [orderItemId]
    );
  }

  /**
   * Find all items in an order
   */
  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    const results = await query<OrderItem[]>(
      `SELECT * FROM "public"."orderItem" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`,
      [orderId]
    );
    return results || [];
  }

  /**
   * Find items by fulfillment status
   */
  async findByFulfillmentStatus(orderId: string, status: FulfillmentStatus): Promise<OrderItem[]> {
    const results = await query<OrderItem[]>(
      `SELECT * FROM "public"."orderItem" 
       WHERE "orderId" = $1 AND "fulfillmentStatus" = $2 
       ORDER BY "createdAt" ASC`,
      [orderId, status]
    );
    return results || [];
  }

  /**
   * Find digital items
   */
  async findDigitalItems(orderId: string): Promise<OrderItem[]> {
    const results = await query<OrderItem[]>(
      `SELECT * FROM "public"."orderItem" 
       WHERE "orderId" = $1 AND "isDigital" = true 
       ORDER BY "createdAt" ASC`,
      [orderId]
    );
    return results || [];
  }

  /**
   * Create order item
   */
  async create(params: OrderItemCreateParams): Promise<OrderItem> {
    const now = unixTimestamp();

    const result = await queryOne<OrderItem>(
      `INSERT INTO "public"."orderItem" (
        "orderId", "productId", "productVariantId", "basketItemId", 
        "sku", "name", "description", "quantity", 
        "unitPrice", "unitCost", "discountedUnitPrice", "lineTotal", 
        "discountTotal", "taxTotal", "taxRate", "taxExempt",
        "options", "attributes", "fulfillmentStatus", 
        "giftWrapped", "giftMessage", "weight", "dimensions",
        "isDigital", "downloadLink", "downloadExpiryDate", "downloadLimit", "subscriptionInfo",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      )
      RETURNING *`,
      [
        params.orderId,
        params.productId || null,
        params.productVariantId || null,
        params.basketItemId || null,
        params.sku,
        params.name,
        params.description || null,
        params.quantity,
        params.unitPrice,
        params.unitCost || null,
        params.discountedUnitPrice,
        params.lineTotal,
        params.discountTotal,
        params.taxTotal,
        params.taxRate || null,
        params.taxExempt,
        params.options ? JSON.stringify(params.options) : null,
        params.attributes ? JSON.stringify(params.attributes) : null,
        params.fulfillmentStatus,
        params.giftWrapped,
        params.giftMessage || null,
        params.weight || null,
        params.dimensions ? JSON.stringify(params.dimensions) : null,
        params.isDigital,
        params.downloadLink || null,
        params.downloadExpiryDate || null,
        params.downloadLimit || null,
        params.subscriptionInfo ? JSON.stringify(params.subscriptionInfo) : null,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create order item');
    }

    return result;
  }

  /**
   * Bulk create order items
   */
  async createMany(items: OrderItemCreateParams[]): Promise<OrderItem[]> {
    const createdItems: OrderItem[] = [];
    
    for (const item of items) {
      const created = await this.create(item);
      createdItems.push(created);
    }
    
    return createdItems;
  }

  /**
   * Update order item
   */
  async update(orderItemId: string, params: OrderItemUpdateParams): Promise<OrderItem | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        const jsonFields = ['options', 'attributes'];
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(orderItemId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(orderItemId);

    const result = await queryOne<OrderItem>(
      `UPDATE "public"."orderItem" 
       SET ${updateFields.join(', ')}
       WHERE "orderItemId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Update fulfillment status
   */
  async updateFulfillmentStatus(orderItemId: string, status: FulfillmentStatus): Promise<OrderItem | null> {
    const result = await queryOne<OrderItem>(
      `UPDATE "public"."orderItem" 
       SET "fulfillmentStatus" = $1, "updatedAt" = $2
       WHERE "orderItemId" = $3
       RETURNING *`,
      [status, unixTimestamp(), orderItemId]
    );

    return result;
  }

  /**
   * Bulk update fulfillment status
   */
  async bulkUpdateFulfillmentStatus(orderItemIds: string[], status: FulfillmentStatus): Promise<number> {
    const placeholders = orderItemIds.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await queryOne<{ count: string }>(
      `UPDATE "public"."orderItem" 
       SET "fulfillmentStatus" = $${orderItemIds.length + 1}, "updatedAt" = $${orderItemIds.length + 2}
       WHERE "orderItemId" IN (${placeholders})
       RETURNING COUNT(*) as count`,
      [...orderItemIds, status, unixTimestamp()]
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Delete order item
   */
  async delete(orderItemId: string): Promise<boolean> {
    const result = await queryOne<{ orderItemId: string }>(
      `DELETE FROM "public"."orderItem" WHERE "orderItemId" = $1 RETURNING "orderItemId"`,
      [orderItemId]
    );

    return !!result;
  }

  /**
   * Count items by order
   */
  async countByOrderId(orderId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "public"."orderItem" WHERE "orderId" = $1`,
      [orderId]
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Calculate order totals from items
   */
  async calculateOrderTotals(orderId: string): Promise<{
    itemsCount: number;
    subTotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
  }> {
    const result = await queryOne<{
      itemsCount: string;
      subTotal: string;
      discountTotal: string;
      taxTotal: string;
      grandTotal: string;
    }>(
      `SELECT 
        COUNT(*) as "itemsCount",
        COALESCE(SUM("lineTotal"), 0) as "subTotal",
        COALESCE(SUM("discountTotal"), 0) as "discountTotal",
        COALESCE(SUM("taxTotal"), 0) as "taxTotal",
        COALESCE(SUM("lineTotal" - "discountTotal" + "taxTotal"), 0) as "grandTotal"
       FROM "public"."orderItem" 
       WHERE "orderId" = $1`,
      [orderId]
    );

    return {
      itemsCount: result ? parseInt(result.itemsCount, 10) : 0,
      subTotal: result ? parseFloat(result.subTotal) : 0,
      discountTotal: result ? parseFloat(result.discountTotal) : 0,
      taxTotal: result ? parseFloat(result.taxTotal) : 0,
      grandTotal: result ? parseFloat(result.grandTotal) : 0
    };
  }

  /**
   * Get fulfillment summary for order
   */
  async getFulfillmentSummary(orderId: string): Promise<Record<FulfillmentStatus, number>> {
    const results = await query<{ fulfillmentStatus: FulfillmentStatus; count: string }[]>(
      `SELECT "fulfillmentStatus", COUNT(*) as count 
       FROM "public"."orderItem" 
       WHERE "orderId" = $1 
       GROUP BY "fulfillmentStatus"`,
      [orderId]
    );

    const summary: Record<string, number> = {};
    if (results) {
      results.forEach(row => {
        summary[row.fulfillmentStatus] = parseInt(row.count, 10);
      });
    }

    return summary as Record<FulfillmentStatus, number>;
  }
}

export default new OrderItemRepo();
