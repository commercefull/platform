/**
 * Supplier Purchase Order Repository
 * Manages purchase orders to suppliers
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';
import { generateUUID } from '../../../libs/uuid';

// ============================================================================
// Table Constants
// ============================================================================

const TABLES = {
  PURCHASE_ORDER: Table.SupplierPurchaseOrder,
  PURCHASE_ORDER_ITEM: Table.SupplierPurchaseOrderItem
};

// ============================================================================
// Types
// ============================================================================

export type SupplierPurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'sent' | 'confirmed' | 'partial' | 'completed' | 'cancelled';
export type SupplierPurchaseOrderType = 'standard' | 'restock' | 'backOrder' | 'special' | 'emergency';
export type SupplierPurchaseOrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupplierPurchaseOrderItemStatus = 'pending' | 'partial' | 'received' | 'cancelled' | 'backOrdered';

export interface SupplierPurchaseOrder {
  supplierPurchaseOrderId: string;
  createdAt: string;
  updatedAt: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  status: SupplierPurchaseOrderStatus;
  orderType: SupplierPurchaseOrderType;
  priority: SupplierPurchaseOrderPriority;
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

export interface SupplierPurchaseOrderItem {
  supplierPurchaseOrderItemId: string;
  createdAt: string;
  updatedAt: string;
  supplierPurchaseOrderId: string;
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
  status: SupplierPurchaseOrderItemStatus;
  expectedDeliveryDate?: string;
  receivedAt?: string;
  notes?: string;
}

export type SupplierPurchaseOrderCreateParams = Omit<SupplierPurchaseOrder, 'supplierPurchaseOrderId' | 'createdAt' | 'updatedAt' | 'poNumber' | 'approvedAt' | 'sentAt' | 'confirmedAt' | 'completedAt' | 'cancelledAt'>;
export type SupplierPurchaseOrderUpdateParams = Partial<Pick<SupplierPurchaseOrder, 
  'status' | 'expectedDeliveryDate' | 'deliveryDate' | 'shippingMethod' | 'trackingNumber' | 
  'carrierName' | 'paymentTerms' | 'subtotal' | 'tax' | 'shipping' | 'discount' | 'total' | 'notes' | 'supplierNotes' | 'attachments'
>>;

export type SupplierPurchaseOrderItemCreateParams = Omit<SupplierPurchaseOrderItem, 'supplierPurchaseOrderItemId' | 'createdAt' | 'updatedAt' | 'receivedAt'>;
export type SupplierPurchaseOrderItemUpdateParams = Partial<Pick<SupplierPurchaseOrderItem, 
  'quantity' | 'receivedQuantity' | 'unitCost' | 'tax' | 'discount' | 'total' | 'status' | 'expectedDeliveryDate' | 'notes'
>>;

export class SupplierPurchaseOrderRepo {
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
  async findById(supplierPurchaseOrderId: string): Promise<SupplierPurchaseOrder | null> {
    return await queryOne<SupplierPurchaseOrder>(
      `SELECT * FROM "public"."supplierPurchaseOrder" WHERE "supplierPurchaseOrderId" = $1`,
      [supplierPurchaseOrderId]
    );
  }

  /**
   * Find purchase order by PO number
   */
  async findByPONumber(poNumber: string): Promise<SupplierPurchaseOrder | null> {
    return await queryOne<SupplierPurchaseOrder>(
      `SELECT * FROM "public"."supplierPurchaseOrder" WHERE "poNumber" = $1`,
      [poNumber]
    );
  }

  /**
   * Find purchase orders by supplier
   */
  async findBySupplierId(supplierId: string, limit: number = 50, offset: number = 0): Promise<SupplierPurchaseOrder[]> {
    const results = await query<SupplierPurchaseOrder[]>(
      `SELECT * FROM "public"."supplierPurchaseOrder" 
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
  async findByWarehouseId(warehouseId: string, limit: number = 50, offset: number = 0): Promise<SupplierPurchaseOrder[]> {
    const results = await query<SupplierPurchaseOrder[]>(
      `SELECT * FROM "public"."supplierPurchaseOrder" 
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
  async findByStatus(status: SupplierPurchaseOrderStatus, limit: number = 50, offset: number = 0): Promise<SupplierPurchaseOrder[]> {
    const results = await query<SupplierPurchaseOrder[]>(
      `SELECT * FROM "public"."supplierPurchaseOrder" 
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
  async findOverdue(): Promise<SupplierPurchaseOrder[]> {
    const now = unixTimestamp();
    const results = await query<SupplierPurchaseOrder[]>(
      `SELECT * FROM "public"."supplierPurchaseOrder" 
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
  async create(params: SupplierPurchaseOrderCreateParams): Promise<SupplierPurchaseOrder> {
    const now = unixTimestamp();
    const poNumber = await this.generatePONumber();

    const result = await queryOne<SupplierPurchaseOrder>(
      `INSERT INTO "public"."supplierPurchaseOrder" (
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
  async update(supplierPurchaseOrderId: string, params: SupplierPurchaseOrderUpdateParams): Promise<SupplierPurchaseOrder | null> {
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
      return this.findById(supplierPurchaseOrderId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(supplierPurchaseOrderId);

    const result = await queryOne<SupplierPurchaseOrder>(
      `UPDATE "public"."supplierPurchaseOrder" 
       SET ${updateFields.join(', ')}
       WHERE "supplierPurchaseOrderId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Update status with timestamp
   */
  async updateStatus(supplierPurchaseOrderId: string, status: SupplierPurchaseOrderStatus): Promise<SupplierPurchaseOrder | null> {
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
    values.push(supplierPurchaseOrderId);

    const result = await queryOne<SupplierPurchaseOrder>(
      `UPDATE "public"."supplierPurchaseOrder" 
       SET ${updateFields.join(', ')}
       WHERE "supplierPurchaseOrderId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Approve purchase order
   */
  async approve(supplierPurchaseOrderId: string): Promise<SupplierPurchaseOrder | null> {
    return this.updateStatus(supplierPurchaseOrderId, 'approved');
  }

  /**
   * Send purchase order to supplier
   */
  async send(supplierPurchaseOrderId: string): Promise<SupplierPurchaseOrder | null> {
    return this.updateStatus(supplierPurchaseOrderId, 'sent');
  }

  /**
   * Confirm purchase order
   */
  async confirm(supplierPurchaseOrderId: string): Promise<SupplierPurchaseOrder | null> {
    return this.updateStatus(supplierPurchaseOrderId, 'confirmed');
  }

  /**
   * Complete purchase order
   */
  async complete(supplierPurchaseOrderId: string): Promise<SupplierPurchaseOrder | null> {
    return this.updateStatus(supplierPurchaseOrderId, 'completed');
  }

  /**
   * Cancel purchase order
   */
  async cancel(supplierPurchaseOrderId: string): Promise<SupplierPurchaseOrder | null> {
    return this.updateStatus(supplierPurchaseOrderId, 'cancelled');
  }

  /**
   * Delete purchase order
   */
  async delete(supplierPurchaseOrderId: string): Promise<boolean> {
    const result = await queryOne<{ supplierPurchaseOrderId: string }>(
      `DELETE FROM "public"."supplierPurchaseOrder" WHERE "supplierPurchaseOrderId" = $1 RETURNING "supplierPurchaseOrderId"`,
      [supplierPurchaseOrderId]
    );

    return !!result;
  }

  // ============= Purchase Order Items =============

  /**
   * Find item by ID
   */
  async findItemById(supplierPurchaseOrderItemId: string): Promise<SupplierPurchaseOrderItem | null> {
    return await queryOne<SupplierPurchaseOrderItem>(
      `SELECT * FROM "public"."supplierPurchaseOrderItem" WHERE "supplierPurchaseOrderItemId" = $1`,
      [supplierPurchaseOrderItemId]
    );
  }

  /**
   * Find all items for purchase order
   */
  async findItemsByOrderId(supplierPurchaseOrderId: string): Promise<SupplierPurchaseOrderItem[]> {
    const results = await query<SupplierPurchaseOrderItem[]>(
      `SELECT * FROM "public"."supplierPurchaseOrderItem" 
       WHERE "supplierPurchaseOrderId" = $1 
       ORDER BY "createdAt" ASC`,
      [supplierPurchaseOrderId]
    );
    return results || [];
  }

  /**
   * Create purchase order item
   */
  async createItem(params: SupplierPurchaseOrderItemCreateParams): Promise<SupplierPurchaseOrderItem> {
    const now = unixTimestamp();

    const result = await queryOne<SupplierPurchaseOrderItem>(
      `INSERT INTO "public"."supplierPurchaseOrderItem" (
        "supplierPurchaseOrderId", "supplierProductId", "productId", "productVariantId",
        "sku", "supplierSku", "name", "description",
        "quantity", "receivedQuantity", "unitCost", "tax", "discount", "total",
        "status", "expectedDeliveryDate", "notes",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      RETURNING *`,
      [
        params.supplierPurchaseOrderId,
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
  async updateItem(supplierPurchaseOrderItemId: string, params: SupplierPurchaseOrderItemUpdateParams): Promise<SupplierPurchaseOrderItem | null> {
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
      return this.findItemById(supplierPurchaseOrderItemId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(supplierPurchaseOrderItemId);

    const result = await queryOne<SupplierPurchaseOrderItem>(
      `UPDATE "public"."supplierPurchaseOrderItem" 
       SET ${updateFields.join(', ')}
       WHERE "supplierPurchaseOrderItemId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Receive purchase order item
   */
  async receiveItem(supplierPurchaseOrderItemId: string, quantityReceived: number): Promise<SupplierPurchaseOrderItem | null> {
    const item = await this.findItemById(supplierPurchaseOrderItemId);
    
    if (!item) {
      throw new Error(`Purchase order item ${supplierPurchaseOrderItemId} not found`);
    }

    const newReceivedQuantity = item.receivedQuantity + quantityReceived;
    let newStatus: SupplierPurchaseOrderItemStatus = 'pending';

    if (newReceivedQuantity >= item.quantity) {
      newStatus = 'received';
    } else if (newReceivedQuantity > 0) {
      newStatus = 'partial';
    }

    return this.updateItem(supplierPurchaseOrderItemId, {
      receivedQuantity: newReceivedQuantity,
      status: newStatus,
      ...(newStatus === 'received' ? { receivedAt: unixTimestamp() as any } : {})
    });
  }

  /**
   * Delete purchase order item
   */
  async deleteItem(supplierPurchaseOrderItemId: string): Promise<boolean> {
    const result = await queryOne<{ supplierPurchaseOrderItemId: string }>(
      `DELETE FROM "public"."supplierPurchaseOrderItem" WHERE "supplierPurchaseOrderItemId" = $1 RETURNING "supplierPurchaseOrderItemId"`,
      [supplierPurchaseOrderItemId]
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
    const results = await query<{ status: SupplierPurchaseOrderStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count FROM "public"."supplierPurchaseOrder" GROUP BY "status"`,
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

export default new SupplierPurchaseOrderRepo();
