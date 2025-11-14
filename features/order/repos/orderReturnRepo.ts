import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';
import { generateUUID } from '../../../libs/uuid';

export type OrderReturnStatus = 'requested' | 'approved' | 'denied' | 'inTransit' | 'received' | 'inspected' | 'completed' | 'cancelled';
export type OrderReturnType = 'refund' | 'exchange' | 'storeCredit' | 'repair';
export type ReturnCarrier = 'ups' | 'fedex' | 'dhl' | 'usps' | 'custom';

export interface OrderReturn {
  orderReturnId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  returnNumber: string;
  customerId?: string;
  status: OrderReturnStatus;
  returnType: OrderReturnType;
  requestedAt: string;
  approvedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  rmaNumber?: string;
  paymentRefundId?: string;
  returnShippingPaid: boolean;
  returnShippingAmount?: number;
  returnShippingLabel?: string;
  returnCarrier: ReturnCarrier;
  returnTrackingNumber?: string;
  returnTrackingUrl?: string;
  returnReason?: string;
  returnInstructions?: string;
  customerNotes?: string;
  adminNotes?: string;
  requiresInspection: boolean;
  inspectionPassedItems?: Record<string, any>;
  inspectionFailedItems?: Record<string, any>;
}

export type OrderReturnCreateParams = Omit<OrderReturn, 
  'orderReturnId' | 'createdAt' | 'updatedAt' | 'returnNumber' | 'requestedAt' | 'approvedAt' | 'receivedAt' | 'completedAt'
>;

export type OrderReturnUpdateParams = Partial<Pick<OrderReturn,
  'status' | 'rmaNumber' | 'paymentRefundId' | 'returnShippingPaid' | 'returnShippingAmount' | 'returnShippingLabel' |
  'returnTrackingNumber' | 'returnTrackingUrl' | 'customerNotes' | 'adminNotes' | 'inspectionPassedItems' | 'inspectionFailedItems'
>>;

export class OrderReturnRepo {
  /**
   * Generate unique return number
   */
  private async generateReturnNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RET-${timestamp}-${random}`;
  }

  /**
   * Find return by ID
   */
  async findById(orderReturnId: string): Promise<OrderReturn | null> {
    return await queryOne<OrderReturn>(
      `SELECT * FROM "public"."orderReturn" WHERE "orderReturnId" = $1`,
      [orderReturnId]
    );
  }

  /**
   * Find return by return number
   */
  async findByReturnNumber(returnNumber: string): Promise<OrderReturn | null> {
    return await queryOne<OrderReturn>(
      `SELECT * FROM "public"."orderReturn" WHERE "returnNumber" = $1`,
      [returnNumber]
    );
  }

  /**
   * Find returns by order ID
   */
  async findByOrderId(orderId: string): Promise<OrderReturn[]> {
    const results = await query<OrderReturn[]>(
      `SELECT * FROM "public"."orderReturn" 
       WHERE "orderId" = $1 
       ORDER BY "createdAt" DESC`,
      [orderId]
    );
    return results || [];
  }

  /**
   * Find returns by customer ID
   */
  async findByCustomerId(customerId: string, limit: number = 50, offset: number = 0): Promise<OrderReturn[]> {
    const results = await query<OrderReturn[]>(
      `SELECT * FROM "public"."orderReturn" 
       WHERE "customerId" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset]
    );
    return results || [];
  }

  /**
   * Find returns by status
   */
  async findByStatus(status: OrderReturnStatus, limit: number = 50, offset: number = 0): Promise<OrderReturn[]> {
    const results = await query<OrderReturn[]>(
      `SELECT * FROM "public"."orderReturn" 
       WHERE "status" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    return results || [];
  }

  /**
   * Find pending returns (requested status)
   */
  async findPending(limit: number = 50): Promise<OrderReturn[]> {
    const results = await query<OrderReturn[]>(
      `SELECT * FROM "public"."orderReturn" 
       WHERE "status" = 'requested' 
       ORDER BY "requestedAt" ASC 
       LIMIT $1`,
      [limit]
    );
    return results || [];
  }

  /**
   * Find returns in transit
   */
  async findInTransit(limit: number = 50): Promise<OrderReturn[]> {
    const results = await query<OrderReturn[]>(
      `SELECT * FROM "public"."orderReturn" 
       WHERE "status" = 'inTransit' 
       ORDER BY "approvedAt" ASC 
       LIMIT $1`,
      [limit]
    );
    return results || [];
  }

  /**
   * Find returns needing inspection
   */
  async findNeedingInspection(limit: number = 50): Promise<OrderReturn[]> {
    const results = await query<OrderReturn[]>(
      `SELECT * FROM "public"."orderReturn" 
       WHERE "status" = 'received' AND "requiresInspection" = true 
       ORDER BY "receivedAt" ASC 
       LIMIT $1`,
      [limit]
    );
    return results || [];
  }

  /**
   * Create order return
   */
  async create(params: OrderReturnCreateParams): Promise<OrderReturn> {
    const now = unixTimestamp();
    const returnNumber = await this.generateReturnNumber();

    const result = await queryOne<OrderReturn>(
      `INSERT INTO "public"."orderReturn" (
        "orderId", "returnNumber", "customerId", "status", "returnType", "requestedAt",
        "rmaNumber", "paymentRefundId", "returnShippingPaid", "returnShippingAmount",
        "returnShippingLabel", "returnCarrier", "returnTrackingNumber", "returnTrackingUrl",
        "returnReason", "returnInstructions", "customerNotes", "adminNotes",
        "requiresInspection", "inspectionPassedItems", "inspectionFailedItems",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      )
      RETURNING *`,
      [
        params.orderId,
        returnNumber,
        params.customerId || null,
        params.status || 'requested',
        params.returnType,
        now,
        params.rmaNumber || null,
        params.paymentRefundId || null,
        params.returnShippingPaid || false,
        params.returnShippingAmount || null,
        params.returnShippingLabel || null,
        params.returnCarrier || 'usps',
        params.returnTrackingNumber || null,
        params.returnTrackingUrl || null,
        params.returnReason || null,
        params.returnInstructions || null,
        params.customerNotes || null,
        params.adminNotes || null,
        params.requiresInspection !== undefined ? params.requiresInspection : true,
        params.inspectionPassedItems ? JSON.stringify(params.inspectionPassedItems) : null,
        params.inspectionFailedItems ? JSON.stringify(params.inspectionFailedItems) : null,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create order return');
    }

    return result;
  }

  /**
   * Update order return
   */
  async update(orderReturnId: string, params: OrderReturnUpdateParams): Promise<OrderReturn | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        const jsonFields = ['inspectionPassedItems', 'inspectionFailedItems'];
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(orderReturnId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(orderReturnId);

    const result = await queryOne<OrderReturn>(
      `UPDATE "public"."orderReturn" 
       SET ${updateFields.join(', ')}
       WHERE "orderReturnId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Update status with auto-timestamps
   */
  async updateStatus(orderReturnId: string, status: OrderReturnStatus): Promise<OrderReturn | null> {
    const updates: any = { status };
    const now = unixTimestamp();

    // Set appropriate timestamp based on status
    switch (status) {
      case 'approved':
        updates.approvedAt = now;
        break;
      case 'received':
        updates.receivedAt = now;
        break;
      case 'completed':
        updates.completedAt = now;
        break;
    }

    // Build update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      updateFields.push(`"${key}" = $${paramIndex++}`);
      values.push(value);
    });

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(orderReturnId);

    const result = await queryOne<OrderReturn>(
      `UPDATE "public"."orderReturn" 
       SET ${updateFields.join(', ')}
       WHERE "orderReturnId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Approve return
   */
  async approve(orderReturnId: string, rmaNumber?: string): Promise<OrderReturn | null> {
    const updates: any = { status: 'approved' };
    if (rmaNumber) updates.rmaNumber = rmaNumber;
    
    return this.updateStatus(orderReturnId, 'approved');
  }

  /**
   * Deny return
   */
  async deny(orderReturnId: string, adminNotes?: string): Promise<OrderReturn | null> {
    const updates: any = { status: 'denied' };
    if (adminNotes) updates.adminNotes = adminNotes;
    
    return this.update(orderReturnId, updates);
  }

  /**
   * Mark as in transit
   */
  async markInTransit(orderReturnId: string, trackingNumber?: string, trackingUrl?: string): Promise<OrderReturn | null> {
    const updates: any = { status: 'inTransit' };
    if (trackingNumber) updates.returnTrackingNumber = trackingNumber;
    if (trackingUrl) updates.returnTrackingUrl = trackingUrl;
    
    return this.update(orderReturnId, updates);
  }

  /**
   * Mark as received
   */
  async markReceived(orderReturnId: string): Promise<OrderReturn | null> {
    return this.updateStatus(orderReturnId, 'received');
  }

  /**
   * Complete inspection
   */
  async completeInspection(
    orderReturnId: string,
    passedItems?: Record<string, any>,
    failedItems?: Record<string, any>
  ): Promise<OrderReturn | null> {
    return this.update(orderReturnId, {
      status: 'inspected',
      inspectionPassedItems: passedItems,
      inspectionFailedItems: failedItems
    });
  }

  /**
   * Complete return
   */
  async complete(orderReturnId: string): Promise<OrderReturn | null> {
    return this.updateStatus(orderReturnId, 'completed');
  }

  /**
   * Cancel return
   */
  async cancel(orderReturnId: string, reason?: string): Promise<OrderReturn | null> {
    const updates: any = { status: 'cancelled' };
    if (reason) updates.adminNotes = reason;
    
    return this.update(orderReturnId, updates);
  }

  /**
   * Add tracking information
   */
  async addTracking(
    orderReturnId: string,
    trackingNumber: string,
    trackingUrl?: string,
    carrier?: ReturnCarrier
  ): Promise<OrderReturn | null> {
    const updates: any = {
      returnTrackingNumber: trackingNumber,
      returnTrackingUrl: trackingUrl
    };
    if (carrier) updates.returnCarrier = carrier;
    
    return this.update(orderReturnId, updates);
  }

  /**
   * Link payment refund
   */
  async linkPaymentRefund(orderReturnId: string, paymentRefundId: string): Promise<OrderReturn | null> {
    return this.update(orderReturnId, { paymentRefundId });
  }

  /**
   * Delete return
   */
  async delete(orderReturnId: string): Promise<boolean> {
    const result = await queryOne<{ orderReturnId: string }>(
      `DELETE FROM "public"."orderReturn" WHERE "orderReturnId" = $1 RETURNING "orderReturnId"`,
      [orderReturnId]
    );

    return !!result;
  }

  /**
   * Count returns by status
   */
  async countByStatus(status: OrderReturnStatus): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "public"."orderReturn" WHERE "status" = $1`,
      [status]
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Count returns by customer
   */
  async countByCustomerId(customerId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "public"."orderReturn" WHERE "customerId" = $1`,
      [customerId]
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get return statistics
   */
  async getStatistics(): Promise<{
    total: number;
    requested: number;
    approved: number;
    denied: number;
    inTransit: number;
    received: number;
    inspected: number;
    completed: number;
    cancelled: number;
  }> {
    const results = await query<{ status: OrderReturnStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count FROM "public"."orderReturn" GROUP BY "status"`,
      []
    );

    const stats: Record<string, number> = {
      total: 0,
      requested: 0,
      approved: 0,
      denied: 0,
      inTransit: 0,
      received: 0,
      inspected: 0,
      completed: 0,
      cancelled: 0
    };

    if (results) {
      results.forEach(row => {
        stats[row.status] = parseInt(row.count, 10);
        stats.total += parseInt(row.count, 10);
      });
    }

    return stats as any;
  }

  /**
   * Get return statistics by type
   */
  async getStatisticsByType(): Promise<Record<OrderReturnType, number>> {
    const results = await query<{ returnType: OrderReturnType; count: string }[]>(
      `SELECT "returnType", COUNT(*) as count FROM "public"."orderReturn" GROUP BY "returnType"`,
      []
    );

    const stats: Record<string, number> = {
      refund: 0,
      exchange: 0,
      storeCredit: 0,
      repair: 0
    };

    if (results) {
      results.forEach(row => {
        stats[row.returnType] = parseInt(row.count, 10);
      });
    }

    return stats as Record<OrderReturnType, number>;
  }
}

export default new OrderReturnRepo();
