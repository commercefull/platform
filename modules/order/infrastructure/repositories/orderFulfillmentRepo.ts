import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import { FailedToCreateOrderFulfillmentError, FailedToCreateOrderFulfillmentPackageError } from '../../domain/errors/OrderErrors';
import type { OrderFulfillment as DbOrderFulfillment, OrderFulfillmentPackage as DbOrderFulfillmentPackage } from '../../../../libs/db/types';

import type {
  FulfillmentType,
  FulfillmentStatus,
  OrderFulfillment,
  OrderFulfillmentCreateParams,
  OrderFulfillmentUpdateParams,
} from '../../domain/repositories/OrderFulfillmentRepository';
import type {
  OrderFulfillmentPackage,
  OrderFulfillmentPackageCreateParams,
  OrderFulfillmentPackageTrackingParams,
} from '../../domain/repositories/OrderFulfillmentPackageRepository';
export type {
  FulfillmentType,
  FulfillmentStatus,
  OrderFulfillment,
  OrderFulfillmentCreateParams,
  OrderFulfillmentUpdateParams,
} from '../../domain/repositories/OrderFulfillmentRepository';
export type {
  OrderFulfillmentPackage,
  OrderFulfillmentPackageCreateParams,
  OrderFulfillmentPackageTrackingParams,
} from '../../domain/repositories/OrderFulfillmentPackageRepository';

const toDate = (d: Date | string | null | undefined): Date | undefined =>
  d == null ? undefined : d instanceof Date ? d : new Date(d);
const toDateReq = (d: Date | string): Date => (d instanceof Date ? d : new Date(d));

function mapToFulfillment(row: DbOrderFulfillment): OrderFulfillment {
  return {
    ...row,
    type: row.type as FulfillmentType,
    status: row.status as FulfillmentStatus,
    trackingNumber: row.trackingNumber ?? undefined,
    trackingUrl: row.trackingUrl ?? undefined,
    carrierCode: row.carrierCode ?? undefined,
    carrierName: row.carrierName ?? undefined,
    shippingMethod: row.shippingMethod ?? undefined,
    shippingAddressId: row.shippingAddressId ?? undefined,
    weight: row.weight != null ? Number(row.weight) : undefined,
    weightUnit: row.weightUnit ?? undefined,
    dimensions: (row.dimensions as Record<string, unknown> | null) ?? undefined,
    packageCount: row.packageCount ?? undefined,
    shippedAt: toDate(row.shippedAt),
    deliveredAt: toDate(row.deliveredAt),
    estimatedDeliveryDate: toDate(row.estimatedDeliveryDate),
    notes: row.notes ?? undefined,
    fulfilledBy: row.fulfilledBy ?? undefined,
    createdAt: toDateReq(row.createdAt),
    updatedAt: toDateReq(row.updatedAt),
  };
}

function mapToPackage(row: DbOrderFulfillmentPackage): OrderFulfillmentPackage {
  return {
    ...row,
    trackingNumber: row.trackingNumber ?? undefined,
    weight: row.weight != null ? Number(row.weight) : undefined,
    dimensions: (row.dimensions as Record<string, unknown> | null) ?? undefined,
    packageType: row.packageType ?? undefined,
    shippingLabelUrl: row.shippingLabelUrl ?? undefined,
    commercialInvoiceUrl: row.commercialInvoiceUrl ?? undefined,
    customsInfo: (row.customsInfo as Record<string, unknown> | null) ?? undefined,
    createdAt: toDateReq(row.createdAt),
    updatedAt: toDateReq(row.updatedAt),
  };
}

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
    const row = await queryOne<DbOrderFulfillment>(`SELECT * FROM "orderFulfillment" WHERE "orderFulfillmentId" = $1`, [orderFulfillmentId]);
    return row ? mapToFulfillment(row) : null;
  }

  /**
   * Find fulfillment by number
   */
  async findByFulfillmentNumber(fulfillmentNumber: string): Promise<OrderFulfillment | null> {
    const row = await queryOne<DbOrderFulfillment>(`SELECT * FROM "orderFulfillment" WHERE "fulfillmentNumber" = $1`, [fulfillmentNumber]);
    return row ? mapToFulfillment(row) : null;
  }

  /**
   * Find all fulfillments for an order
   */
  async findByOrderId(orderId: string): Promise<OrderFulfillment[]> {
    const results = await query<DbOrderFulfillment[]>(`SELECT * FROM "orderFulfillment" WHERE "orderId" = $1 ORDER BY "createdAt" DESC`, [
      orderId,
    ]);
    return (results || []).map(mapToFulfillment);
  }

  /**
   * Find fulfillments by status
   */
  async findByStatus(status: FulfillmentStatus, limit: number = 50, offset: number = 0): Promise<OrderFulfillment[]> {
    const results = await query<DbOrderFulfillment[]>(
      `SELECT * FROM "orderFulfillment" 
       WHERE "status" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [status, limit, offset],
    );
    return (results || []).map(mapToFulfillment);
  }

  /**
   * Find fulfillments by tracking number
   */
  async findByTrackingNumber(trackingNumber: string): Promise<OrderFulfillment[]> {
    const results = await query<DbOrderFulfillment[]>(`SELECT * FROM "orderFulfillment" WHERE "trackingNumber" = $1`, [trackingNumber]);
    return (results || []).map(mapToFulfillment);
  }

  /**
   * Find fulfillments by carrier
   */
  async findByCarrier(carrierCode: string, limit: number = 50, offset: number = 0): Promise<OrderFulfillment[]> {
    const results = await query<DbOrderFulfillment[]>(
      `SELECT * FROM "orderFulfillment" 
       WHERE "carrierCode" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [carrierCode, limit, offset],
    );
    return (results || []).map(mapToFulfillment);
  }

  /**
   * Create order fulfillment
   */
  async create(params: OrderFulfillmentCreateParams): Promise<OrderFulfillment> {
    const now = unixTimestamp();
    const fulfillmentNumber = await this.generateFulfillmentNumber();

    const result = await queryOne<DbOrderFulfillment>(
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

    return mapToFulfillment(result);
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

    const result = await queryOne<DbOrderFulfillment>(
      `UPDATE "orderFulfillment" 
       SET ${updateFields.join(', ')}
       WHERE "orderFulfillmentId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result ? mapToFulfillment(result) : null;
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
  async markAsShipped(orderFulfillmentId: string, shippedAt?: Date): Promise<OrderFulfillment | null> {
    return this.update(orderFulfillmentId, {
      status: 'shipped',
      shippedAt: shippedAt ?? new Date(),
    });
  }

  /**
   * Mark as delivered
   */
  async markAsDelivered(orderFulfillmentId: string, deliveredAt?: Date): Promise<OrderFulfillment | null> {
    return this.update(orderFulfillmentId, {
      status: 'delivered',
      deliveredAt: deliveredAt ?? new Date(),
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
    const results = await query<DbOrderFulfillment[]>(
      `SELECT * FROM "orderFulfillment" 
       WHERE "status" NOT IN ('delivered', 'cancelled') 
       AND "estimatedDeliveryDate" IS NOT NULL 
       AND "estimatedDeliveryDate" < $1
       ORDER BY "estimatedDeliveryDate" ASC`,
      [now],
    );
    return (results || []).map(mapToFulfillment);
  }

  /**
   * Find fulfillments shipped today
   */
  async findShippedToday(): Promise<OrderFulfillment[]> {
    const results = await query<DbOrderFulfillment[]>(
      `SELECT * FROM "orderFulfillment" 
       WHERE "status" = 'shipped' 
       AND DATE("shippedAt") = CURRENT_DATE
       ORDER BY "shippedAt" DESC`,
      [],
    );
    return (results || []).map(mapToFulfillment);
  }

  // ==========================================================================
  // Fulfillment Package Methods
  // ==========================================================================

  async findPackagesByOrder(orderId: string): Promise<OrderFulfillmentPackage[]> {
    const results = await query<DbOrderFulfillmentPackage[]>(
      `SELECT p.* FROM "orderFulfillmentPackage" p
       JOIN "orderFulfillment" f ON f."orderFulfillmentId" = p."orderFulfillmentId"
       WHERE f."orderId" = $1
       ORDER BY p."createdAt" ASC`,
      [orderId],
    );
    return (results || []).map(mapToPackage);
  }

  async findPackagesByFulfillment(orderFulfillmentId: string): Promise<OrderFulfillmentPackage[]> {
    const results = await query<DbOrderFulfillmentPackage[]>(
      `SELECT * FROM "orderFulfillmentPackage" WHERE "orderFulfillmentId" = $1 ORDER BY "createdAt" ASC`,
      [orderFulfillmentId],
    );
    return (results || []).map(mapToPackage);
  }

  async findByOrder(orderId: string): Promise<OrderFulfillmentPackage[]> {
    return this.findPackagesByOrder(orderId);
  }

  async findByFulfillment(orderFulfillmentId: string): Promise<OrderFulfillmentPackage[]> {
    return this.findPackagesByFulfillment(orderFulfillmentId);
  }

  async createPackage(params: OrderFulfillmentPackageCreateParams): Promise<OrderFulfillmentPackage> {
    const now = unixTimestamp();
    const result = await queryOne<DbOrderFulfillmentPackage>(
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
    return mapToPackage(result);
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
      const row = await queryOne<DbOrderFulfillmentPackage>(`SELECT * FROM "orderFulfillmentPackage" WHERE "orderFulfillmentPackageId" = $1`, [
        orderFulfillmentPackageId,
      ]);
      return row ? mapToPackage(row) : null;
    }

    fields.push(`"updatedAt" = $${i++}`);
    values.push(unixTimestamp());
    values.push(orderFulfillmentPackageId);

    const row = await queryOne<DbOrderFulfillmentPackage>(
      `UPDATE "orderFulfillmentPackage" SET ${fields.join(', ')} WHERE "orderFulfillmentPackageId" = $${i} RETURNING *`,
      values,
    );
    return row ? mapToPackage(row) : null;
  }
}

export default new OrderFulfillmentRepo();
