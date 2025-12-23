import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';
import { generateUUID } from '../../../libs/uuid';

export type FulfillmentType = 'shipping' | 'pickup' | 'digital' | 'service';
export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed' | 'cancelled';

export interface OrderFulfillment {
  orderFulfillmentId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  fulfillmentNumber: string;
  type: FulfillmentType;
  status: FulfillmentStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  carrierCode?: string;
  carrierName?: string;
  shippingMethod?: string;
  shippingAddressId?: string;
  weight?: number;
  weightUnit?: string;
  dimensions?: Record<string, any>;
  packageCount?: number;
  shippedAt?: string;
  deliveredAt?: string;
  estimatedDeliveryDate?: string;
  notes?: string;
  fulfilledBy?: string;
}

export type OrderFulfillmentCreateParams = Omit<OrderFulfillment, 'orderFulfillmentId' | 'createdAt' | 'updatedAt' | 'fulfillmentNumber'>;
export type OrderFulfillmentUpdateParams = Partial<
  Pick<
    OrderFulfillment,
    | 'status'
    | 'trackingNumber'
    | 'trackingUrl'
    | 'carrierCode'
    | 'carrierName'
    | 'shippingMethod'
    | 'shippedAt'
    | 'deliveredAt'
    | 'estimatedDeliveryDate'
    | 'notes'
  >
>;

export class OrderFulfillmentRepo {
  /**
   * Generate unique fulfillment number
   */
  private async generateFulfillmentNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `FUL-${timestamp}-${random}`;
  }

  /**
   * Find fulfillment by ID
   */
  async findById(orderFulfillmentId: string): Promise<OrderFulfillment | null> {
    return await queryOne<OrderFulfillment>(`SELECT * FROM "public"."orderFulfillment" WHERE "orderFulfillmentId" = $1`, [
      orderFulfillmentId,
    ]);
  }

  /**
   * Find fulfillment by number
   */
  async findByFulfillmentNumber(fulfillmentNumber: string): Promise<OrderFulfillment | null> {
    return await queryOne<OrderFulfillment>(`SELECT * FROM "public"."orderFulfillment" WHERE "fulfillmentNumber" = $1`, [
      fulfillmentNumber,
    ]);
  }

  /**
   * Find all fulfillments for an order
   */
  async findByOrderId(orderId: string): Promise<OrderFulfillment[]> {
    const results = await query<OrderFulfillment[]>(
      `SELECT * FROM "public"."orderFulfillment" WHERE "orderId" = $1 ORDER BY "createdAt" DESC`,
      [orderId],
    );
    return results || [];
  }

  /**
   * Find fulfillments by status
   */
  async findByStatus(status: FulfillmentStatus, limit: number = 50, offset: number = 0): Promise<OrderFulfillment[]> {
    const results = await query<OrderFulfillment[]>(
      `SELECT * FROM "public"."orderFulfillment" 
       WHERE "status" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [status, limit, offset],
    );
    return results || [];
  }

  /**
   * Find fulfillments by tracking number
   */
  async findByTrackingNumber(trackingNumber: string): Promise<OrderFulfillment[]> {
    const results = await query<OrderFulfillment[]>(`SELECT * FROM "public"."orderFulfillment" WHERE "trackingNumber" = $1`, [
      trackingNumber,
    ]);
    return results || [];
  }

  /**
   * Find fulfillments by carrier
   */
  async findByCarrier(carrierCode: string, limit: number = 50, offset: number = 0): Promise<OrderFulfillment[]> {
    const results = await query<OrderFulfillment[]>(
      `SELECT * FROM "public"."orderFulfillment" 
       WHERE "carrierCode" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [carrierCode, limit, offset],
    );
    return results || [];
  }

  /**
   * Create order fulfillment
   */
  async create(params: OrderFulfillmentCreateParams): Promise<OrderFulfillment> {
    const now = unixTimestamp();
    const fulfillmentNumber = await this.generateFulfillmentNumber();

    const result = await queryOne<OrderFulfillment>(
      `INSERT INTO "public"."orderFulfillment" (
        "orderId", "fulfillmentNumber", "type", "status",
        "trackingNumber", "trackingUrl", "carrierCode", "carrierName",
        "shippingMethod", "shippingAddressId", "weight", "weightUnit",
        "dimensions", "packageCount", "shippedAt", "deliveredAt",
        "estimatedDeliveryDate", "notes", "fulfilledBy",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      RETURNING *`,
      [
        params.orderId,
        fulfillmentNumber,
        params.type,
        params.status,
        params.trackingNumber || null,
        params.trackingUrl || null,
        params.carrierCode || null,
        params.carrierName || null,
        params.shippingMethod || null,
        params.shippingAddressId || null,
        params.weight || null,
        params.weightUnit || 'kg',
        params.dimensions ? JSON.stringify(params.dimensions) : null,
        params.packageCount || 1,
        params.shippedAt || null,
        params.deliveredAt || null,
        params.estimatedDeliveryDate || null,
        params.notes || null,
        params.fulfilledBy || null,
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create order fulfillment');
    }

    return result;
  }

  /**
   * Update order fulfillment
   */
  async update(orderFulfillmentId: string, params: OrderFulfillmentUpdateParams): Promise<OrderFulfillment | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(orderFulfillmentId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(orderFulfillmentId);

    const result = await queryOne<OrderFulfillment>(
      `UPDATE "public"."orderFulfillment" 
       SET ${updateFields.join(', ')}
       WHERE "orderFulfillmentId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result;
  }

  /**
   * Update fulfillment status
   */
  async updateStatus(orderFulfillmentId: string, status: FulfillmentStatus): Promise<OrderFulfillment | null> {
    const updates: Record<string, any> = { status };

    // Auto-set timestamps based on status
    if (status === 'shipped') {
      updates.shippedAt = unixTimestamp();
    } else if (status === 'delivered') {
      updates.deliveredAt = unixTimestamp();
    }

    return this.update(orderFulfillmentId, updates);
  }

  /**
   * Add tracking information
   */
  async addTracking(
    orderFulfillmentId: string,
    trackingNumber: string,
    carrierCode?: string,
    carrierName?: string,
    trackingUrl?: string,
  ): Promise<OrderFulfillment | null> {
    return this.update(orderFulfillmentId, {
      trackingNumber,
      carrierCode,
      carrierName,
      trackingUrl,
    });
  }

  /**
   * Mark as shipped
   */
  async markAsShipped(orderFulfillmentId: string, shippedAt?: string): Promise<OrderFulfillment | null> {
    return this.update(orderFulfillmentId, {
      status: 'shipped',
      shippedAt: shippedAt || unixTimestamp(),
    });
  }

  /**
   * Mark as delivered
   */
  async markAsDelivered(orderFulfillmentId: string, deliveredAt?: string): Promise<OrderFulfillment | null> {
    return this.update(orderFulfillmentId, {
      status: 'delivered',
      deliveredAt: deliveredAt || unixTimestamp(),
    });
  }

  /**
   * Cancel fulfillment
   */
  async cancel(orderFulfillmentId: string, notes?: string): Promise<OrderFulfillment | null> {
    return this.update(orderFulfillmentId, {
      status: 'cancelled',
      notes,
    });
  }

  /**
   * Delete fulfillment
   */
  async delete(orderFulfillmentId: string): Promise<boolean> {
    const result = await queryOne<{ orderFulfillmentId: string }>(
      `DELETE FROM "public"."orderFulfillment" WHERE "orderFulfillmentId" = $1 RETURNING "orderFulfillmentId"`,
      [orderFulfillmentId],
    );

    return !!result;
  }

  /**
   * Count fulfillments by order
   */
  async countByOrderId(orderId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "public"."orderFulfillment" WHERE "orderId" = $1`, [
      orderId,
    ]);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get fulfillment statistics by status
   */
  async getStatusStatistics(): Promise<Record<FulfillmentStatus, number>> {
    const results = await query<{ status: FulfillmentStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count 
       FROM "public"."orderFulfillment" 
       GROUP BY "status"`,
      [],
    );

    const stats: Record<string, number> = {};
    if (results) {
      results.forEach(row => {
        stats[row.status] = parseInt(row.count, 10);
      });
    }

    return stats as Record<FulfillmentStatus, number>;
  }

  /**
   * Find overdue fulfillments (estimated delivery date passed, not delivered)
   */
  async findOverdue(): Promise<OrderFulfillment[]> {
    const now = unixTimestamp();
    const results = await query<OrderFulfillment[]>(
      `SELECT * FROM "public"."orderFulfillment" 
       WHERE "status" NOT IN ('delivered', 'cancelled') 
       AND "estimatedDeliveryDate" IS NOT NULL 
       AND "estimatedDeliveryDate" < $1
       ORDER BY "estimatedDeliveryDate" ASC`,
      [now],
    );
    return results || [];
  }

  /**
   * Find fulfillments shipped today
   */
  async findShippedToday(): Promise<OrderFulfillment[]> {
    const results = await query<OrderFulfillment[]>(
      `SELECT * FROM "public"."orderFulfillment" 
       WHERE "status" = 'shipped' 
       AND DATE("shippedAt") = CURRENT_DATE
       ORDER BY "shippedAt" DESC`,
      [],
    );
    return results || [];
  }
}

export default new OrderFulfillmentRepo();
