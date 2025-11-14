import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';
import { generateUUID } from '../../../libs/uuid';

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'sent' | 'confirmed' | 'partial' | 'completed' | 'cancelled';
export type PurchaseOrderType = 'standard' | 'restock' | 'backOrder' | 'special' | 'emergency';
export type PurchaseOrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type PurchaseOrderItemStatus = 'pending' | 'partial' | 'received' | 'cancelled' | 'backOrdered';

export interface PurchaseOrder {
  purchaseOrderId: string;
  createdAt: string;
  updatedAt: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  status: PurchaseOrderStatus;
  orderType: PurchaseOrderType;
  priority: PurchaseOrderPriority;
  orderDate: string;
  expectedDeliveryDate?: string;
  deliveryDate?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  carrierName?: string;
  paymentTerms?: string;
  currency: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  notes?: string;
  supplierNotes?: string;
  attachments?: Record<string, any>;
  approvedAt?: string;
  sentAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface PurchaseOrderItem {
  purchaseOrderItemId: string;
  createdAt: string;
  updatedAt: string;
  purchaseOrderId: string;
  supplierProductId?: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  supplierSku?: string;
  name: string;
  description?: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  tax: number;
  discount: number;
  total: number;
  status: PurchaseOrderItemStatus;
  expectedDeliveryDate?: string;
  receivedAt?: string;
  notes?: string;
}

export type PurchaseOrderCreateParams = Omit<PurchaseOrder, 'purchaseOrderId' | 'createdAt' | 'updatedAt' | 'poNumber' | 'approvedAt' | 'sentAt' | 'confirmedAt' | 'completedAt' | 'cancelledAt'>;
export type PurchaseOrderUpdateParams = Partial<Pick<PurchaseOrder, 
  'status' | 'expectedDeliveryDate' | 'deliveryDate' | 'shippingMethod' | 'trackingNumber' | 
  'carrierName' | 'paymentTerms' | 'subtotal' | 'tax' | 'shipping' | 'discount' | 'total' | 'notes' | 'supplierNotes' | 'attachments'
>>;

export type PurchaseOrderItemCreateParams = Omit<PurchaseOrderItem, 'purchaseOrderItemId' | 'createdAt' | 'updatedAt' | 'receivedAt'>;
export type PurchaseOrderItemUpdateParams = Partial<Pick<PurchaseOrderItem, 
  'quantity' | 'receivedQuantity' | 'unitCost' | 'tax' | 'discount' | 'total' | 'status' | 'expectedDeliveryDate' | 'notes'
>>;

export class PurchaseOrderRepo {
  /**
   * Generate unique PO number
   */
  private async generatePONumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PO-${timestamp}-${random}`;
  }

  /**
   * Find purchase order by ID
   */
  async findById(purchaseOrderId: string): Promise<PurchaseOrder | null> {
    return await queryOne<PurchaseOrder>(
      `SELECT * FROM "public"."purchaseOrder" WHERE "purchaseOrderId" = $1`,
      [purchaseOrderId]
    );
  }

  /**
   * Find purchase order by PO number
   */
  async findByPONumber(poNumber: string): Promise<PurchaseOrder | null> {
    return await queryOne<PurchaseOrder>(
      `SELECT * FROM "public"."purchaseOrder" WHERE "poNumber" = $1`,
      [poNumber]
    );
  }

  /**
   * Find purchase orders by supplier
   */
  async findBySupplierId(supplierId: string, limit: number = 50, offset: number = 0): Promise<PurchaseOrder[]> {
    const results = await query<PurchaseOrder[]>(
      `SELECT * FROM "public"."purchaseOrder" 
       WHERE "supplierId" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [supplierId, limit, offset]
    );
    return results || [];
  }

  /**
   * Find purchase orders by warehouse
   */
  async findByWarehouseId(warehouseId: string, limit: number = 50, offset: number = 0): Promise<PurchaseOrder[]> {
    const results = await query<PurchaseOrder[]>(
      `SELECT * FROM "public"."purchaseOrder" 
       WHERE "warehouseId" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [warehouseId, limit, offset]
    );
    return results || [];
  }

  /**
   * Find purchase orders by status
   */
  async findByStatus(status: PurchaseOrderStatus, limit: number = 50, offset: number = 0): Promise<PurchaseOrder[]> {
    const results = await query<PurchaseOrder[]>(
      `SELECT * FROM "public"."purchaseOrder" 
       WHERE "status" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    return results || [];
  }

  /**
   * Find overdue purchase orders
   */
  async findOverdue(): Promise<PurchaseOrder[]> {
    const now = unixTimestamp();
    const results = await query<PurchaseOrder[]>(
      `SELECT * FROM "public"."purchaseOrder" 
       WHERE "status" NOT IN ('completed', 'cancelled') 
       AND "expectedDeliveryDate" IS NOT NULL 
       AND "expectedDeliveryDate" < $1
       ORDER BY "expectedDeliveryDate" ASC`,
      [now]
    );
    return results || [];
  }

  /**
   * Create purchase order
   */
  async create(params: PurchaseOrderCreateParams): Promise<PurchaseOrder> {
    const now = unixTimestamp();
    const poNumber = await this.generatePONumber();

    const result = await queryOne<PurchaseOrder>(
      `INSERT INTO "public"."purchaseOrder" (
        "poNumber", "supplierId", "warehouseId", "status", "orderType", "priority",
        "orderDate", "expectedDeliveryDate", "deliveryDate", "shippingMethod",
        "trackingNumber", "carrierName", "paymentTerms", "currency",
        "subtotal", "tax", "shipping", "discount", "total",
        "notes", "supplierNotes", "attachments",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      )
      RETURNING *`,
      [
        poNumber,
        params.supplierId,
        params.warehouseId,
        params.status || 'draft',
        params.orderType || 'standard',
        params.priority || 'normal',
        params.orderDate || now,
        params.expectedDeliveryDate || null,
        params.deliveryDate || null,
        params.shippingMethod || null,
        params.trackingNumber || null,
        params.carrierName || null,
        params.paymentTerms || null,
        params.currency || 'USD',
        params.subtotal || 0,
        params.tax || 0,
        params.shipping || 0,
        params.discount || 0,
        params.total || 0,
        params.notes || null,
        params.supplierNotes || null,
        params.attachments ? JSON.stringify(params.attachments) : null,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create purchase order');
    }

    return result;
  }

  /**
   * Update purchase order
   */
  async update(purchaseOrderId: string, params: PurchaseOrderUpdateParams): Promise<PurchaseOrder | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'attachments' && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(purchaseOrderId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(purchaseOrderId);

    const result = await queryOne<PurchaseOrder>(
      `UPDATE "public"."purchaseOrder" 
       SET ${updateFields.join(', ')}
       WHERE "purchaseOrderId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Update status with timestamp
   */
  async updateStatus(purchaseOrderId: string, status: PurchaseOrderStatus): Promise<PurchaseOrder | null> {
    const updates: any = { status };
    const now = unixTimestamp();

    // Set appropriate timestamp based on status
    switch (status) {
      case 'approved':
        updates.approvedAt = now;
        break;
      case 'sent':
        updates.sentAt = now;
        break;
      case 'confirmed':
        updates.confirmedAt = now;
        break;
      case 'completed':
        updates.completedAt = now;
        break;
      case 'cancelled':
        updates.cancelledAt = now;
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
    values.push(purchaseOrderId);

    const result = await queryOne<PurchaseOrder>(
      `UPDATE "public"."purchaseOrder" 
       SET ${updateFields.join(', ')}
       WHERE "purchaseOrderId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Approve purchase order
   */
  async approve(purchaseOrderId: string): Promise<PurchaseOrder | null> {
    return this.updateStatus(purchaseOrderId, 'approved');
  }

  /**
   * Send purchase order to supplier
   */
  async send(purchaseOrderId: string): Promise<PurchaseOrder | null> {
    return this.updateStatus(purchaseOrderId, 'sent');
  }

  /**
   * Confirm purchase order
   */
  async confirm(purchaseOrderId: string): Promise<PurchaseOrder | null> {
    return this.updateStatus(purchaseOrderId, 'confirmed');
  }

  /**
   * Complete purchase order
   */
  async complete(purchaseOrderId: string): Promise<PurchaseOrder | null> {
    return this.updateStatus(purchaseOrderId, 'completed');
  }

  /**
   * Cancel purchase order
   */
  async cancel(purchaseOrderId: string): Promise<PurchaseOrder | null> {
    return this.updateStatus(purchaseOrderId, 'cancelled');
  }

  /**
   * Delete purchase order
   */
  async delete(purchaseOrderId: string): Promise<boolean> {
    const result = await queryOne<{ purchaseOrderId: string }>(
      `DELETE FROM "public"."purchaseOrder" WHERE "purchaseOrderId" = $1 RETURNING "purchaseOrderId"`,
      [purchaseOrderId]
    );

    return !!result;
  }

  // ============= Purchase Order Items =============

  /**
   * Find item by ID
   */
  async findItemById(purchaseOrderItemId: string): Promise<PurchaseOrderItem | null> {
    return await queryOne<PurchaseOrderItem>(
      `SELECT * FROM "public"."purchaseOrderItem" WHERE "purchaseOrderItemId" = $1`,
      [purchaseOrderItemId]
    );
  }

  /**
   * Find all items for purchase order
   */
  async findItemsByOrderId(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
    const results = await query<PurchaseOrderItem[]>(
      `SELECT * FROM "public"."purchaseOrderItem" 
       WHERE "purchaseOrderId" = $1 
       ORDER BY "createdAt" ASC`,
      [purchaseOrderId]
    );
    return results || [];
  }

  /**
   * Create purchase order item
   */
  async createItem(params: PurchaseOrderItemCreateParams): Promise<PurchaseOrderItem> {
    const now = unixTimestamp();

    const result = await queryOne<PurchaseOrderItem>(
      `INSERT INTO "public"."purchaseOrderItem" (
        "purchaseOrderId", "supplierProductId", "productId", "productVariantId",
        "sku", "supplierSku", "name", "description",
        "quantity", "receivedQuantity", "unitCost", "tax", "discount", "total",
        "status", "expectedDeliveryDate", "notes",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      RETURNING *`,
      [
        params.purchaseOrderId,
        params.supplierProductId || null,
        params.productId,
        params.productVariantId || null,
        params.sku,
        params.supplierSku || null,
        params.name,
        params.description || null,
        params.quantity,
        params.receivedQuantity || 0,
        params.unitCost,
        params.tax || 0,
        params.discount || 0,
        params.total,
        params.status || 'pending',
        params.expectedDeliveryDate || null,
        params.notes || null,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create purchase order item');
    }

    return result;
  }

  /**
   * Update purchase order item
   */
  async updateItem(purchaseOrderItemId: string, params: PurchaseOrderItemUpdateParams): Promise<PurchaseOrderItem | null> {
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
      return this.findItemById(purchaseOrderItemId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(purchaseOrderItemId);

    const result = await queryOne<PurchaseOrderItem>(
      `UPDATE "public"."purchaseOrderItem" 
       SET ${updateFields.join(', ')}
       WHERE "purchaseOrderItemId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Receive purchase order item
   */
  async receiveItem(purchaseOrderItemId: string, quantityReceived: number): Promise<PurchaseOrderItem | null> {
    const item = await this.findItemById(purchaseOrderItemId);
    
    if (!item) {
      throw new Error(`Purchase order item ${purchaseOrderItemId} not found`);
    }

    const newReceivedQuantity = item.receivedQuantity + quantityReceived;
    let newStatus: PurchaseOrderItemStatus = 'pending';

    if (newReceivedQuantity >= item.quantity) {
      newStatus = 'received';
    } else if (newReceivedQuantity > 0) {
      newStatus = 'partial';
    }

    return this.updateItem(purchaseOrderItemId, {
      receivedQuantity: newReceivedQuantity,
      status: newStatus,
      ...(newStatus === 'received' ? { receivedAt: unixTimestamp() as any } : {})
    });
  }

  /**
   * Delete purchase order item
   */
  async deleteItem(purchaseOrderItemId: string): Promise<boolean> {
    const result = await queryOne<{ purchaseOrderItemId: string }>(
      `DELETE FROM "public"."purchaseOrderItem" WHERE "purchaseOrderItemId" = $1 RETURNING "purchaseOrderItemId"`,
      [purchaseOrderItemId]
    );

    return !!result;
  }

  /**
   * Get purchase order statistics
   */
  async getStatistics(): Promise<{
    total: number;
    draft: number;
    pending: number;
    approved: number;
    sent: number;
    completed: number;
    cancelled: number;
    overdue: number;
  }> {
    const results = await query<{ status: PurchaseOrderStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count FROM "public"."purchaseOrder" GROUP BY "status"`,
      []
    );

    const stats: Record<string, number> = {
      total: 0,
      draft: 0,
      pending: 0,
      approved: 0,
      sent: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0
    };

    if (results) {
      results.forEach(row => {
        stats[row.status] = parseInt(row.count, 10);
        stats.total += parseInt(row.count, 10);
      });
    }

    const overdue = await this.findOverdue();
    stats.overdue = overdue.length;

    return stats as any;
  }
}

export default new PurchaseOrderRepo();
