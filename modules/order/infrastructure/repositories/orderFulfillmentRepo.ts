import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import { FailedToCreateOrderFulfillmentError, FailedToCreateOrderFulfillmentPackageError } from '../../domain/errors/OrderErrors';

export interface OrderFulfillmentPackage {
  orderFulfillmentPackageId: string;
  createdAt: string;
  updatedAt: string;
  orderFulfillmentId: string;
  packageNumber: string;
  trackingNumber?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  packageType?: string;
  shippingLabelUrl?: string;
  commercialInvoiceUrl?: string;
  customsInfo?: Record<string, unknown>;
}

export type OrderFulfillmentPackageCreateParams = Omit<OrderFulfillmentPackage, 'orderFulfillmentPackageId' | 'createdAt' | 'updatedAt'>;
export type OrderFulfillmentPackageTrackingParams = Partial<
  Pick<OrderFulfillmentPackage, 'trackingNumber' | 'shippingLabelUrl' | 'commercialInvoiceUrl'>
>;

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
  dimensions?: Record<string, unknown>;
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
    return await queryOne<OrderFulfillment>(`SELECT * FROM "orderFulfillment" WHERE "orderFulfillmentId" = $1`, [orderFulfillmentId]);
  }

  /**
   * Find fulfillment by number
   */
  async findByFulfillmentNumber(fulfillmentNumber: string): Promise<OrderFulfillment | null> {
    return await queryOne<OrderFulfillment>(`SELECT * FROM "orderFulfillment" WHERE "fulfillmentNumber" = $1`, [fulfillmentNumber]);
  }

  /**
   * Find all fulfillments for an order
   */
  async findByOrderId(orderId: string): Promise<OrderFulfillment[]> {
    const results = await query<OrderFulfillment[]>(`SELECT * FROM "orderFulfillment" WHERE "orderId" = $1 ORDER BY "createdAt" DESC`, [
      orderId,
    ]);
    return results || [];
  }

  /**
   * Find fulfillments by status
   */
  async findByStatus(status: FulfillmentStatus, limit: number = 50, offset: number = 0): Promise<OrderFulfillment[]> {
    const results = await query<OrderFulfillment[]>(
      `SELECT * FROM "orderFulfillment" 
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
    const results = await query<OrderFulfillment[]>(`SELECT * FROM "orderFulfillment" WHERE "trackingNumber" = $1`, [trackingNumber]);
    return results || [];
  }

  /**
   * Find fulfillments by carrier
   */
  async findByCarrier(carrierCode: string, limit: number = 50, offset: number = 0): Promise<OrderFulfillment[]> {
    const results = await query<OrderFulfillment[]>(
      `SELECT * FROM "orderFulfillment" 
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
      `INSERT INTO "orderFulfillment" (
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
      throw new FailedToCreateOrderFulfillmentError();
    }

    return result;
  }

  /**
   * Update order fulfillment
   */
  async update(orderFulfillmentId: string, params: OrderFulfillmentUpdateParams): Promise<OrderFulfillment | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
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
      `UPDATE "orderFulfillment" 
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
    const updates: Record<string, unknown> = { status };

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
      `DELETE FROM "orderFulfillment" WHERE "orderFulfillmentId" = $1 RETURNING "orderFulfillmentId"`,
      [orderFulfillmentId],
    );

    return !!result;
  }

  /**
   * Count fulfillments by order
   */
  async countByOrderId(orderId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "orderFulfillment" WHERE "orderId" = $1`, [orderId]);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get fulfillment statistics by status
   */
  async getStatusStatistics(): Promise<Record<FulfillmentStatus, number>> {
    const results = await query<{ status: FulfillmentStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count 
       FROM "orderFulfillment" 
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
      `SELECT * FROM "orderFulfillment" 
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
      `SELECT * FROM "orderFulfillment" 
       WHERE "status" = 'shipped' 
       AND DATE("shippedAt") = CURRENT_DATE
       ORDER BY "shippedAt" DESC`,
      [],
    );
    return results || [];
  }

  // ==========================================================================
  // Fulfillment Package Methods
  // ==========================================================================

  async findPackagesByOrder(orderId: string): Promise<OrderFulfillmentPackage[]> {
    const results = await query<OrderFulfillmentPackage[]>(
      `SELECT p.* FROM "orderFulfillmentPackage" p
       JOIN "orderFulfillment" f ON f."orderFulfillmentId" = p."orderFulfillmentId"
       WHERE f."orderId" = $1
       ORDER BY p."createdAt" ASC`,
      [orderId],
    );
    return results || [];
  }

  async findPackagesByFulfillment(orderFulfillmentId: string): Promise<OrderFulfillmentPackage[]> {
    const results = await query<OrderFulfillmentPackage[]>(
      `SELECT * FROM "orderFulfillmentPackage" WHERE "orderFulfillmentId" = $1 ORDER BY "createdAt" ASC`,
      [orderFulfillmentId],
    );
    return results || [];
  }

  async findByOrder(orderId: string): Promise<OrderFulfillmentPackage[]> {
    return this.findPackagesByOrder(orderId);
  }

  async findByFulfillment(orderFulfillmentId: string): Promise<OrderFulfillmentPackage[]> {
    return this.findPackagesByFulfillment(orderFulfillmentId);
  }

  async createPackage(params: OrderFulfillmentPackageCreateParams): Promise<OrderFulfillmentPackage> {
    const now = unixTimestamp();
    const result = await queryOne<OrderFulfillmentPackage>(
      `INSERT INTO "orderFulfillmentPackage" (
        "orderFulfillmentId", "packageNumber", "trackingNumber", "weight", "dimensions",
        "packageType", "shippingLabelUrl", "commercialInvoiceUrl", "customsInfo",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        params.orderFulfillmentId,
        params.packageNumber,
        params.trackingNumber || null,
        params.weight || null,
        params.dimensions ? JSON.stringify(params.dimensions) : null,
        params.packageType || null,
        params.shippingLabelUrl || null,
        params.commercialInvoiceUrl || null,
        params.customsInfo ? JSON.stringify(params.customsInfo) : null,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateOrderFulfillmentPackageError();
    return result;
  }

  async updateTracking(
    orderFulfillmentPackageId: string,
    params: OrderFulfillmentPackageTrackingParams,
  ): Promise<OrderFulfillmentPackage | null> {
    return this.updatePackageTracking(orderFulfillmentPackageId, params);
  }

  async updatePackageTracking(
    orderFulfillmentPackageId: string,
    params: OrderFulfillmentPackageTrackingParams,
  ): Promise<OrderFulfillmentPackage | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        fields.push(`"${key}" = $${i++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return queryOne<OrderFulfillmentPackage>(`SELECT * FROM "orderFulfillmentPackage" WHERE "orderFulfillmentPackageId" = $1`, [
        orderFulfillmentPackageId,
      ]);
    }

    fields.push(`"updatedAt" = $${i++}`);
    values.push(unixTimestamp());
    values.push(orderFulfillmentPackageId);

    return queryOne<OrderFulfillmentPackage>(
      `UPDATE "orderFulfillmentPackage" SET ${fields.join(', ')} WHERE "orderFulfillmentPackageId" = $${i} RETURNING *`,
      values,
    );
  }
}

export default new OrderFulfillmentRepo();
