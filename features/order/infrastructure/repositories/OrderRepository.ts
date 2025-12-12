/**
 * Order Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { 
  OrderRepository as IOrderRepository, 
  OrderFilters, 
  PaginationOptions,
  PaginatedResult 
} from '../../domain/repositories/OrderRepository';
import { Order } from '../../domain/entities/Order';
import { OrderItem } from '../../domain/entities/OrderItem';
import { OrderAddress } from '../../domain/entities/OrderAddress';
import { Money } from '../../domain/valueObjects/Money';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';

export class OrderRepo implements IOrderRepository {

  async findById(orderId: string): Promise<Order | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "order" WHERE "orderId" = $1 AND "deletedAt" IS NULL',
      [orderId]
    );
    if (!row) return null;

    const items = await this.getOrderItems(orderId);
    const shippingAddress = await this.getShippingAddress(orderId);
    const billingAddress = await this.getBillingAddress(orderId);

    return this.mapToOrder(row, items, shippingAddress, billingAddress);
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "order" WHERE "orderNumber" = $1 AND "deletedAt" IS NULL',
      [orderNumber]
    );
    if (!row) return null;

    const items = await this.getOrderItems(row.orderId);
    const shippingAddress = await this.getShippingAddress(row.orderId);
    const billingAddress = await this.getBillingAddress(row.orderId);

    return this.mapToOrder(row, items, shippingAddress, billingAddress);
  }

  async findByCustomerId(
    customerId: string, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Order>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "order" WHERE "customerId" = $1 AND "deletedAt" IS NULL',
      [customerId]
    );
    const total = parseInt(countResult?.count || '0');

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "order" WHERE "customerId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()} LIMIT $2 OFFSET $3`,
      [customerId, limit, offset]
    );

    const orders: Order[] = [];
    for (const row of rows || []) {
      const items = await this.getOrderItems(row.orderId);
      const shippingAddress = await this.getShippingAddress(row.orderId);
      const billingAddress = await this.getBillingAddress(row.orderId);
      orders.push(this.mapToOrder(row, items, shippingAddress, billingAddress));
    }

    return { data: orders, total, limit, offset, hasMore: offset + orders.length < total };
  }

  async findAll(
    filters?: OrderFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Order>> {
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "order" ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "order" ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const orders: Order[] = [];
    for (const row of rows || []) {
      const items = await this.getOrderItems(row.orderId);
      const shippingAddress = await this.getShippingAddress(row.orderId);
      const billingAddress = await this.getBillingAddress(row.orderId);
      orders.push(this.mapToOrder(row, items, shippingAddress, billingAddress));
    }

    return { data: orders, total, limit, offset, hasMore: offset + orders.length < total };
  }

  async findByStatus(status: OrderStatus, pagination?: PaginationOptions): Promise<PaginatedResult<Order>> {
    return this.findAll({ status }, pagination);
  }

  async findByPaymentStatus(paymentStatus: PaymentStatus, pagination?: PaginationOptions): Promise<PaginatedResult<Order>> {
    return this.findAll({ paymentStatus }, pagination);
  }

  async findByFulfillmentStatus(fulfillmentStatus: FulfillmentStatus, pagination?: PaginationOptions): Promise<PaginatedResult<Order>> {
    return this.findAll({ fulfillmentStatus }, pagination);
  }

  async findByDateRange(startDate: Date, endDate: Date, pagination?: PaginationOptions): Promise<PaginatedResult<Order>> {
    return this.findAll({ startDate, endDate }, pagination);
  }

  async save(order: Order): Promise<Order> {
    const now = new Date().toISOString();
    
    const existing = await queryOne<Record<string, any>>(
      'SELECT "orderId" FROM "order" WHERE "orderId" = $1',
      [order.orderId]
    );

    if (existing) {
      await query(
        `UPDATE "order" SET
          "orderNumber" = $1, "customerId" = $2, "basketId" = $3, "status" = $4,
          "paymentStatus" = $5, "fulfillmentStatus" = $6, "currencyCode" = $7,
          "subtotal" = $8, "discountTotal" = $9, "taxTotal" = $10, "shippingTotal" = $11,
          "handlingFee" = $12, "totalAmount" = $13, "totalItems" = $14, "totalQuantity" = $15,
          "taxExempt" = $16, "completedAt" = $17, "cancelledAt" = $18, "returnedAt" = $19,
          "customerEmail" = $20, "customerPhone" = $21, "customerName" = $22,
          "customerNotes" = $23, "adminNotes" = $24, "estimatedDeliveryDate" = $25,
          "hasGiftWrapping" = $26, "giftMessage" = $27, "isGift" = $28,
          "isSubscriptionOrder" = $29, "parentOrderId" = $30, "tags" = $31,
          "metadata" = $32, "updatedAt" = $33
        WHERE "orderId" = $34`,
        [
          order.orderNumber, order.customerId || null, order.basketId || null,
          order.status, order.paymentStatus, order.fulfillmentStatus, order.currencyCode,
          order.subtotal.amount, order.discountTotal.amount, order.taxTotal.amount,
          order.shippingTotal.amount, order.handlingFee.amount, order.totalAmount.amount,
          order.totalItems, order.totalQuantity, order.taxExempt,
          order.completedAt?.toISOString() || null, order.cancelledAt?.toISOString() || null,
          order.returnedAt?.toISOString() || null, order.customerEmail,
          order.customerPhone || null, order.customerName || null,
          order.customerNotes || null, order.adminNotes || null,
          order.estimatedDeliveryDate?.toISOString() || null, order.hasGiftWrapping,
          order.giftMessage || null, order.isGift, order.isSubscriptionOrder,
          order.parentOrderId || null, order.tags.length > 0 ? JSON.stringify(order.tags) : null,
          order.metadata ? JSON.stringify(order.metadata) : null, now, order.orderId
        ]
      );
    } else {
      await query(
        `INSERT INTO "order" (
          "orderId", "orderNumber", "customerId", "basketId", "status", "paymentStatus",
          "fulfillmentStatus", "currencyCode", "subtotal", "discountTotal", "taxTotal",
          "shippingTotal", "handlingFee", "totalAmount", "totalItems", "totalQuantity",
          "taxExempt", "orderDate", "customerEmail", "customerPhone", "customerName",
          "customerNotes", "ipAddress", "userAgent", "referralSource",
          "hasGiftWrapping", "giftMessage", "isGift", "isSubscriptionOrder",
          "parentOrderId", "tags", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34
        )`,
        [
          order.orderId, order.orderNumber, order.customerId || null, order.basketId || null,
          order.status, order.paymentStatus, order.fulfillmentStatus, order.currencyCode,
          order.subtotal.amount, order.discountTotal.amount, order.taxTotal.amount,
          order.shippingTotal.amount, order.handlingFee.amount, order.totalAmount.amount,
          order.totalItems, order.totalQuantity, order.taxExempt, order.orderDate.toISOString(),
          order.customerEmail, order.customerPhone || null, order.customerName || null,
          order.customerNotes || null, order.ipAddress || null, order.userAgent || null,
          order.referralSource || null, order.hasGiftWrapping, order.giftMessage || null,
          order.isGift, order.isSubscriptionOrder, order.parentOrderId || null,
          order.tags.length > 0 ? JSON.stringify(order.tags) : null,
          order.metadata ? JSON.stringify(order.metadata) : null, now, now
        ]
      );
    }

    await this.syncItems(order);
    if (order.shippingAddress) await this.saveOrderAddress(order.shippingAddress);
    if (order.billingAddress) await this.saveOrderAddress(order.billingAddress);

    return order;
  }

  async delete(orderId: string): Promise<void> {
    const now = new Date().toISOString();
    await query(
      'UPDATE "order" SET "deletedAt" = $1, "updatedAt" = $1 WHERE "orderId" = $2',
      [now, orderId]
    );
  }

  async count(filters?: OrderFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "order" ${whereClause}`,
      params
    );
    return parseInt(result?.count || '0');
  }

  async countByCustomer(customerId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "order" WHERE "customerId" = $1 AND "deletedAt" IS NULL',
      [customerId]
    );
    return parseInt(result?.count || '0');
  }

  async countByStatus(status: OrderStatus): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "order" WHERE "status" = $1 AND "deletedAt" IS NULL',
      [status]
    );
    return parseInt(result?.count || '0');
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "orderItem" WHERE "orderId" = $1 ORDER BY "createdAt" ASC',
      [orderId]
    );
    const order = await queryOne<Record<string, any>>(
      'SELECT "currencyCode" FROM "order" WHERE "orderId" = $1',
      [orderId]
    );
    const currency = order?.currencyCode || 'USD';
    return (rows || []).map(row => this.mapToOrderItem(row, currency));
  }

  async addOrderItem(orderId: string, item: OrderItem): Promise<OrderItem> {
    const now = new Date().toISOString();
    await query(
      `INSERT INTO "orderItem" (
        "orderItemId", "orderId", "productId", "productVariantId", "sku", "name",
        "description", "quantity", "unitPrice", "unitCost", "discountedUnitPrice",
        "lineTotal", "discountTotal", "taxTotal", "taxRate", "taxExempt",
        "fulfillmentStatus", "options", "attributes", "giftWrapped", "giftMessage",
        "weight", "dimensions", "isDigital", "subscriptionInfo", "metadata",
        "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)`,
      [
        item.orderItemId, orderId, item.productId, item.productVariantId || null,
        item.sku, item.name, item.description || null, item.quantity,
        item.unitPrice.amount, item.unitCost?.amount || null,
        item.discountedUnitPrice?.amount || null, item.lineTotal.amount,
        item.discountTotal.amount, item.taxTotal.amount, item.taxRate || null,
        item.taxExempt, item.fulfillmentStatus,
        item.options ? JSON.stringify(item.options) : null,
        item.attributes ? JSON.stringify(item.attributes) : null,
        item.giftWrapped, item.giftMessage || null, item.weight || null,
        item.dimensions ? JSON.stringify(item.dimensions) : null, item.isDigital,
        item.subscriptionInfo ? JSON.stringify(item.subscriptionInfo) : null,
        item.metadata ? JSON.stringify(item.metadata) : null, now, now
      ]
    );
    return item;
  }

  async updateOrderItem(item: OrderItem): Promise<OrderItem> {
    const now = new Date().toISOString();
    await query(
      `UPDATE "orderItem" SET
        "quantity" = $1, "unitPrice" = $2, "discountedUnitPrice" = $3,
        "lineTotal" = $4, "discountTotal" = $5, "taxTotal" = $6,
        "fulfillmentStatus" = $7, "giftWrapped" = $8, "giftMessage" = $9,
        "updatedAt" = $10
      WHERE "orderItemId" = $11`,
      [
        item.quantity, item.unitPrice.amount, item.discountedUnitPrice?.amount || null,
        item.lineTotal.amount, item.discountTotal.amount, item.taxTotal.amount,
        item.fulfillmentStatus, item.giftWrapped, item.giftMessage || null,
        now, item.orderItemId
      ]
    );
    return item;
  }

  async removeOrderItem(orderItemId: string): Promise<void> {
    await query('DELETE FROM "orderItem" WHERE "orderItemId" = $1', [orderItemId]);
  }

  // Order Addresses
  async getOrderAddresses(orderId: string): Promise<OrderAddress[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "orderAddress" WHERE "orderId" = $1',
      [orderId]
    );
    return (rows || []).map(row => this.mapToOrderAddress(row));
  }

  async saveOrderAddress(address: OrderAddress): Promise<OrderAddress> {
    const now = new Date().toISOString();
    const existing = await queryOne<Record<string, any>>(
      'SELECT "orderAddressId" FROM "orderAddress" WHERE "orderAddressId" = $1',
      [address.orderAddressId]
    );

    if (existing) {
      await query(
        `UPDATE "orderAddress" SET
          "firstName" = $1, "lastName" = $2, "company" = $3, "address1" = $4,
          "address2" = $5, "city" = $6, "state" = $7, "postalCode" = $8,
          "country" = $9, "countryCode" = $10, "phone" = $11, "email" = $12,
          "isDefault" = $13, "metadata" = $14, "updatedAt" = $15
        WHERE "orderAddressId" = $16`,
        [
          address.firstName, address.lastName, address.company || null,
          address.address1, address.address2 || null, address.city, address.state,
          address.postalCode, address.country, address.countryCode,
          address.phone || null, address.email || null, address.isDefault,
          address.metadata ? JSON.stringify(address.metadata) : null, now,
          address.orderAddressId
        ]
      );
    } else {
      await query(
        `INSERT INTO "orderAddress" (
          "orderAddressId", "orderId", "addressType", "firstName", "lastName",
          "company", "address1", "address2", "city", "state", "postalCode",
          "country", "countryCode", "phone", "email", "isDefault", "metadata",
          "createdAt", "updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [
          address.orderAddressId, address.orderId, address.addressType,
          address.firstName, address.lastName, address.company || null,
          address.address1, address.address2 || null, address.city, address.state,
          address.postalCode, address.country, address.countryCode,
          address.phone || null, address.email || null, address.isDefault,
          address.metadata ? JSON.stringify(address.metadata) : null, now, now
        ]
      );
    }
    return address;
  }

  async getShippingAddress(orderId: string): Promise<OrderAddress | null> {
    const row = await queryOne<Record<string, any>>(
      `SELECT * FROM "orderAddress" WHERE "orderId" = $1 AND "addressType" = 'shipping'`,
      [orderId]
    );
    return row ? this.mapToOrderAddress(row) : null;
  }

  async getBillingAddress(orderId: string): Promise<OrderAddress | null> {
    const row = await queryOne<Record<string, any>>(
      `SELECT * FROM "orderAddress" WHERE "orderId" = $1 AND "addressType" = 'billing'`,
      [orderId]
    );
    return row ? this.mapToOrderAddress(row) : null;
  }

  // Status History
  async recordStatusChange(orderId: string, status: OrderStatus, reason?: string): Promise<void> {
    const now = new Date().toISOString();
    await query(
      `INSERT INTO "orderStatusHistory" ("orderStatusHistoryId", "orderId", "status", "reason", "createdAt")
       VALUES ($1, $2, $3, $4, $5)`,
      [generateUUID(), orderId, status, reason || null, now]
    );
  }

  async recordPaymentStatusChange(orderId: string, status: PaymentStatus, transactionId?: string): Promise<void> {
    const now = new Date().toISOString();
    await query(
      `INSERT INTO "orderPaymentHistory" ("orderPaymentHistoryId", "orderId", "paymentStatus", "transactionId", "createdAt")
       VALUES ($1, $2, $3, $4, $5)`,
      [generateUUID(), orderId, status, transactionId || null, now]
    );
  }

  async recordFulfillmentStatusChange(orderId: string, status: FulfillmentStatus): Promise<void> {
    const now = new Date().toISOString();
    await query(
      `INSERT INTO "orderFulfillmentHistory" ("orderFulfillmentHistoryId", "orderId", "fulfillmentStatus", "createdAt")
       VALUES ($1, $2, $3, $4)`,
      [generateUUID(), orderId, status, now]
    );
  }

  async getStatusHistory(orderId: string): Promise<Array<{ status: OrderStatus; reason?: string; createdAt: Date }>> {
    const rows = await query<Record<string, any>[]>(
      `SELECT "status", "reason", "createdAt" FROM "orderStatusHistory" 
       WHERE "orderId" = $1 ORDER BY "createdAt" DESC`,
      [orderId]
    );
    return (rows || []).map(row => ({
      status: row.status as OrderStatus,
      reason: row.reason,
      createdAt: new Date(row.createdAt)
    }));
  }

  async getOrderStats(filters?: OrderFilters): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
  }> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const statsResult = await queryOne<Record<string, any>>(
      `SELECT COUNT(*) as "totalOrders", COALESCE(SUM("totalAmount"), 0) as "totalRevenue",
       COALESCE(AVG("totalAmount"), 0) as "averageOrderValue" FROM "order" ${whereClause}`,
      params
    );

    const statusRows = await query<Record<string, any>[]>(
      `SELECT "status", COUNT(*) as count FROM "order" ${whereClause} GROUP BY "status"`,
      params
    );

    const ordersByStatus: Record<OrderStatus, number> = {} as Record<OrderStatus, number>;
    for (const status of Object.values(OrderStatus)) {
      ordersByStatus[status] = 0;
    }
    for (const row of statusRows || []) {
      ordersByStatus[row.status as OrderStatus] = parseInt(row.count);
    }

    return {
      totalOrders: parseInt(statsResult?.totalOrders || '0'),
      totalRevenue: parseFloat(statsResult?.totalRevenue || '0'),
      averageOrderValue: parseFloat(statsResult?.averageOrderValue || '0'),
      ordersByStatus
    };
  }

  private async syncItems(order: Order): Promise<void> {
    const existingItems = await query<Record<string, any>[]>(
      'SELECT "orderItemId" FROM "orderItem" WHERE "orderId" = $1',
      [order.orderId]
    );
    const existingIds = new Set((existingItems || []).map(i => i.orderItemId));
    const itemsToKeep = new Set<string>();

    for (const item of order.items) {
      if (existingIds.has(item.orderItemId)) {
        await this.updateOrderItem(item);
      } else {
        await this.addOrderItem(order.orderId, item);
      }
      itemsToKeep.add(item.orderItemId);
    }

    for (const id of existingIds) {
      if (!itemsToKeep.has(id)) {
        await this.removeOrderItem(id);
      }
    }
  }

  private buildWhereClause(filters?: OrderFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = ['"deletedAt" IS NULL'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.customerId) {
      conditions.push(`"customerId" = \$${paramIndex++}`);
      params.push(filters.customerId);
    }
    if (filters?.status) {
      conditions.push(`"status" = \$${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters?.paymentStatus) {
      conditions.push(`"paymentStatus" = \$${paramIndex++}`);
      params.push(filters.paymentStatus);
    }
    if (filters?.fulfillmentStatus) {
      conditions.push(`"fulfillmentStatus" = \$${paramIndex++}`);
      params.push(filters.fulfillmentStatus);
    }
    if (filters?.startDate) {
      conditions.push(`"createdAt" >= \$${paramIndex++}`);
      params.push(filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      conditions.push(`"createdAt" <= \$${paramIndex++}`);
      params.push(filters.endDate.toISOString());
    }
    if (filters?.minAmount !== undefined) {
      conditions.push(`"totalAmount" >= \$${paramIndex++}`);
      params.push(filters.minAmount);
    }
    if (filters?.maxAmount !== undefined) {
      conditions.push(`"totalAmount" <= \$${paramIndex++}`);
      params.push(filters.maxAmount);
    }
    if (filters?.search) {
      conditions.push(`("orderNumber" ILIKE \$${paramIndex} OR "customerEmail" ILIKE \$${paramIndex} OR "customerName" ILIKE \$${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }

  private mapToOrder(
    row: Record<string, any>,
    items: OrderItem[],
    shippingAddress: OrderAddress | null,
    billingAddress: OrderAddress | null
  ): Order {
    const currency = row.currencyCode || 'USD';
    
    return Order.reconstitute({
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      customerId: row.customerId || undefined,
      basketId: row.basketId || undefined,
      status: row.status as OrderStatus,
      paymentStatus: row.paymentStatus as PaymentStatus,
      fulfillmentStatus: row.fulfillmentStatus as FulfillmentStatus,
      currencyCode: currency,
      subtotal: Money.create(parseFloat(row.subtotal || 0), currency),
      discountTotal: Money.create(parseFloat(row.discountTotal || 0), currency),
      taxTotal: Money.create(parseFloat(row.taxTotal || 0), currency),
      shippingTotal: Money.create(parseFloat(row.shippingTotal || 0), currency),
      handlingFee: Money.create(parseFloat(row.handlingFee || 0), currency),
      totalAmount: Money.create(parseFloat(row.totalAmount || 0), currency),
      totalItems: parseInt(row.totalItems || 0),
      totalQuantity: parseInt(row.totalQuantity || 0),
      taxExempt: Boolean(row.taxExempt),
      orderDate: new Date(row.orderDate),
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
      cancelledAt: row.cancelledAt ? new Date(row.cancelledAt) : undefined,
      returnedAt: row.returnedAt ? new Date(row.returnedAt) : undefined,
      shippingAddress: shippingAddress || undefined,
      billingAddress: billingAddress || undefined,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone || undefined,
      customerName: row.customerName || undefined,
      customerNotes: row.customerNotes || undefined,
      adminNotes: row.adminNotes || undefined,
      ipAddress: row.ipAddress || undefined,
      userAgent: row.userAgent || undefined,
      referralSource: row.referralSource || undefined,
      estimatedDeliveryDate: row.estimatedDeliveryDate ? new Date(row.estimatedDeliveryDate) : undefined,
      hasGiftWrapping: Boolean(row.hasGiftWrapping),
      giftMessage: row.giftMessage || undefined,
      isGift: Boolean(row.isGift),
      isSubscriptionOrder: Boolean(row.isSubscriptionOrder),
      parentOrderId: row.parentOrderId || undefined,
      items,
      tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined
    });
  }

  private mapToOrderItem(row: Record<string, any>, currency: string): OrderItem {
    return OrderItem.reconstitute({
      orderItemId: row.orderItemId,
      orderId: row.orderId,
      productId: row.productId,
      productVariantId: row.productVariantId || undefined,
      sku: row.sku,
      name: row.name,
      description: row.description || undefined,
      quantity: parseInt(row.quantity),
      unitPrice: Money.create(parseFloat(row.unitPrice), currency),
      unitCost: row.unitCost ? Money.create(parseFloat(row.unitCost), currency) : undefined,
      discountedUnitPrice: row.discountedUnitPrice ? Money.create(parseFloat(row.discountedUnitPrice), currency) : undefined,
      lineTotal: Money.create(parseFloat(row.lineTotal || 0), currency),
      discountTotal: Money.create(parseFloat(row.discountTotal || 0), currency),
      taxTotal: Money.create(parseFloat(row.taxTotal || 0), currency),
      taxRate: row.taxRate ? parseFloat(row.taxRate) : undefined,
      taxExempt: Boolean(row.taxExempt),
      fulfillmentStatus: row.fulfillmentStatus as FulfillmentStatus,
      options: row.options ? (typeof row.options === 'string' ? JSON.parse(row.options) : row.options) : undefined,
      attributes: row.attributes ? (typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes) : undefined,
      giftWrapped: Boolean(row.giftWrapped),
      giftMessage: row.giftMessage || undefined,
      weight: row.weight ? parseFloat(row.weight) : undefined,
      dimensions: row.dimensions ? (typeof row.dimensions === 'string' ? JSON.parse(row.dimensions) : row.dimensions) : undefined,
      isDigital: Boolean(row.isDigital),
      subscriptionInfo: row.subscriptionInfo ? (typeof row.subscriptionInfo === 'string' ? JSON.parse(row.subscriptionInfo) : row.subscriptionInfo) : undefined,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }

  private mapToOrderAddress(row: Record<string, any>): OrderAddress {
    return OrderAddress.reconstitute({
      orderAddressId: row.orderAddressId,
      orderId: row.orderId,
      addressType: row.addressType,
      firstName: row.firstName,
      lastName: row.lastName,
      company: row.company || undefined,
      address1: row.address1,
      address2: row.address2 || undefined,
      city: row.city,
      state: row.state,
      postalCode: row.postalCode,
      country: row.country,
      countryCode: row.countryCode,
      phone: row.phone || undefined,
      email: row.email || undefined,
      isDefault: Boolean(row.isDefault),
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }
}

export default new OrderRepo();
