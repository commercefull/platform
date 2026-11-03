/**
 * Order Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 *
 * Per-aggregate SQL lives in sibling modules (orderItemQueries,
 * orderAddressQueries, orderStatusHistoryQueries, orderWriteQueries); row
 * mapping lives in orderRowMappers / orderFromRowProjections.
 */

import { query, queryOne } from '../../../../libs/db';
import { OrderRepository as IOrderRepository, OrderFilters } from '../../domain/repositories/OrderRepository';
import { PaginationOptions, PaginatedResult } from 'libs/types/pagination';
import { Order } from '../../domain/entities/Order';
import { OrderItem } from '../../domain/entities/OrderItem';
import { OrderAddress } from '../../domain/entities/OrderAddress';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';
import { Order as DbOrder, OrderItem as DbOrderItem, OrderAddress as DbOrderAddress } from '../../../../libs/db/types';
import {
  getOrderItems as qGetOrderItems,
  findOrderItemById as qFindOrderItemById,
  addOrderItem as qAddOrderItem,
  updateOrderItem as qUpdateOrderItem,
  removeOrderItem as qRemoveOrderItem,
} from './orderItemQueries';
import {
  getOrderAddresses as qGetOrderAddresses,
  getShippingAddress as qGetShippingAddress,
  getBillingAddress as qGetBillingAddress,
  saveOrderAddress as qSaveOrderAddress,
} from './orderAddressQueries';
import {
  recordStatusChange as qRecordStatusChange,
  recordPaymentStatusChange as qRecordPaymentStatusChange,
  recordFulfillmentStatusChange as qRecordFulfillmentStatusChange,
  getStatusHistory as qGetStatusHistory,
  getPaymentStatusHistory as qGetPaymentStatusHistory,
  getFulfillmentStatusHistory as qGetFulfillmentStatusHistory,
} from './orderStatusHistoryQueries';
import { insertOrderRow, updateOrderRow } from './orderWriteQueries';
import { buildOrderWhereClause, mapToOrderAddress, mapToOrderItem } from './orderRowMappers';
import { mapOrderRow } from './orderFromRowProjections';

export class OrderRepo implements IOrderRepository {
  async findById(orderId: string): Promise<Order | null> {
    const row = await queryOne<DbOrder>('SELECT * FROM "order" WHERE "orderId" = $1 AND "deletedAt" IS NULL', [orderId]);
    if (!row) return null;

    const items = await this.getOrderItems(orderId);
    const shippingAddress = await this.getShippingAddress(orderId);
    const billingAddress = await this.getBillingAddress(orderId);

    return mapOrderRow(row, items, shippingAddress, billingAddress);
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const row = await queryOne<DbOrder>('SELECT * FROM "order" WHERE "orderNumber" = $1 AND "deletedAt" IS NULL', [orderNumber]);
    if (!row) return null;

    const items = await this.getOrderItems(row.orderId);
    const shippingAddress = await this.getShippingAddress(row.orderId);
    const billingAddress = await this.getBillingAddress(row.orderId);

    return mapOrderRow(row, items, shippingAddress, billingAddress);
  }

  async findByCustomerId(customerId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Order>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const rows = await query<DbOrder[]>(
      `SELECT * FROM "order" WHERE "customerId" = $1 AND "deletedAt" IS NULL
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()} LIMIT $2 OFFSET $3`,
      [customerId, limit, offset],
    );

    const total = await this.pagedTotal(
      rows?.length ?? 0,
      limit,
      offset,
      'SELECT COUNT(*) as count FROM "order" WHERE "customerId" = $1 AND "deletedAt" IS NULL',
      [customerId],
    );

    const orders = await this.hydrateOrders(rows || []);

    return { data: orders, total, limit, offset, hasMore: offset + orders.length < total, length: orders.length };
  }

  async findAll(filters?: OrderFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Order>> {
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = buildOrderWhereClause(filters);

    const rows = await query<DbOrder[]>(
      `SELECT * FROM "order" ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const total = await this.pagedTotal(rows?.length ?? 0, limit, offset, `SELECT COUNT(*) as count FROM "order" ${whereClause}`, params);

    const orders = await this.hydrateOrders(rows || []);

    return { data: orders, total, limit, offset, hasMore: offset + orders.length < total, length: orders.length };
  }

  // A short first page is already an exact total — skip the COUNT(*) scan.
  private async pagedTotal(rowCount: number, limit: number, offset: number, countSql: string, params: unknown[]): Promise<number> {
    if (offset === 0 && rowCount < limit) return rowCount;
    const result = await queryOne<{ count: string }>(countSql, params);
    return parseInt(result?.count || '0');
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

    const existing = await queryOne<{ orderId: string }>('SELECT "orderId" FROM "order" WHERE "orderId" = $1', [order.orderId]);

    if (existing) {
      await updateOrderRow(order, now);
    } else {
      await insertOrderRow(order, now);
    }

    await this.syncItems(order);
    if (order.shippingAddress) await this.saveOrderAddress(order.shippingAddress);
    if (order.billingAddress) await this.saveOrderAddress(order.billingAddress);

    return order;
  }

  async delete(orderId: string): Promise<void> {
    const now = new Date().toISOString();
    await query('UPDATE "order" SET "deletedAt" = $1, "updatedAt" = $1 WHERE "orderId" = $2', [now, orderId]);
  }

  async count(filters?: OrderFilters): Promise<number> {
    const { whereClause, params } = buildOrderWhereClause(filters);
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "order" ${whereClause}`, params);
    return parseInt(result?.count || '0');
  }

  async countByCustomer(customerId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "order" WHERE "customerId" = $1 AND "deletedAt" IS NULL',
      [customerId],
    );
    return parseInt(result?.count || '0');
  }

  async countByStatus(status: OrderStatus): Promise<number> {
    const result = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM "order" WHERE "status" = $1 AND "deletedAt" IS NULL', [
      status,
    ]);
    return parseInt(result?.count || '0');
  }

  // Order Items
  getOrderItems = (orderId: string) => qGetOrderItems(orderId);
  findOrderItemById = (orderItemId: string) => qFindOrderItemById(orderItemId);
  addOrderItem = (orderId: string, item: OrderItem) => qAddOrderItem(orderId, item);
  updateOrderItem = (item: OrderItem) => qUpdateOrderItem(item);
  removeOrderItem = (orderItemId: string) => qRemoveOrderItem(orderItemId);

  // Order Addresses
  getOrderAddresses = (orderId: string) => qGetOrderAddresses(orderId);
  saveOrderAddress = (address: OrderAddress) => qSaveOrderAddress(address);
  getShippingAddress = (orderId: string) => qGetShippingAddress(orderId);
  getBillingAddress = (orderId: string) => qGetBillingAddress(orderId);

  // Status History
  recordStatusChange = (orderId: string, status: OrderStatus, reason?: string, previousStatus?: string) =>
    qRecordStatusChange(orderId, status, reason, previousStatus);
  recordPaymentStatusChange = (orderId: string, status: PaymentStatus, transactionId?: string) =>
    qRecordPaymentStatusChange(orderId, status, transactionId);
  recordFulfillmentStatusChange = (orderId: string, status: FulfillmentStatus) => qRecordFulfillmentStatusChange(orderId, status);
  getStatusHistory = (orderId: string) => qGetStatusHistory(orderId);
  getPaymentStatusHistory = (orderId: string) => qGetPaymentStatusHistory(orderId);
  getFulfillmentStatusHistory = (orderId: string) => qGetFulfillmentStatusHistory(orderId);

  async getOrderStats(filters?: OrderFilters): Promise<{
    totalOrders: number;
    totalRevenueCents: number;
    averageOrderValueCents: number;
    ordersByStatus: Record<OrderStatus, number>;
  }> {
    const { whereClause, params } = buildOrderWhereClause(filters);

    const statsResult = await queryOne<{ totalOrders: string; totalRevenueCents: string; averageOrderValueCents: string }>(
      `SELECT COUNT(*) as "totalOrders", COALESCE(SUM("totalAmountCents"), 0) as "totalRevenueCents",
       COALESCE(AVG("totalAmountCents"), 0) as "averageOrderValueCents" FROM "order" ${whereClause}`,
      params,
    );

    const statusRows = await query<Array<{ status: string; count: string }>>(
      `SELECT "status", COUNT(*) as count FROM "order" ${whereClause} GROUP BY "status"`,
      params,
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
      totalRevenueCents: Number(statsResult?.totalRevenueCents || '0'),
      averageOrderValueCents: Number(statsResult?.averageOrderValueCents || '0'),
      ordersByStatus,
    };
  }

  private async syncItems(order: Order): Promise<void> {
    const existingItems = await query<Array<{ orderItemId: string }>>('SELECT "orderItemId" FROM "orderItem" WHERE "orderId" = $1', [
      order.orderId,
    ]);
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

  private async hydrateOrders(rows: DbOrder[]): Promise<Order[]> {
    if (!rows.length) return [];

    const orderIds = rows.map(row => row.orderId);
    const [itemRows, addressRows] = await Promise.all([
      query<DbOrderItem[]>('SELECT * FROM "orderItem" WHERE "orderId" = ANY($1) ORDER BY "createdAt" ASC', [orderIds]),
      query<DbOrderAddress[]>('SELECT * FROM "orderAddress" WHERE "orderId" = ANY($1)', [orderIds]),
    ]);

    const itemsByOrderId = new Map<string, OrderItem[]>();
    const shippingByOrderId = new Map<string, OrderAddress>();
    const billingByOrderId = new Map<string, OrderAddress>();
    const currencyByOrderId = new Map(rows.map(row => [row.orderId, row.currencyCode || 'USD']));

    for (const itemRow of itemRows || []) {
      const currency = currencyByOrderId.get(itemRow.orderId) || 'USD';
      const items = itemsByOrderId.get(itemRow.orderId) || [];
      items.push(mapToOrderItem(itemRow, currency));
      itemsByOrderId.set(itemRow.orderId, items);
    }

    for (const addressRow of addressRows || []) {
      const address = mapToOrderAddress(addressRow);
      if (addressRow.addressType === 'shipping') shippingByOrderId.set(addressRow.orderId, address);
      else if (addressRow.addressType === 'billing') billingByOrderId.set(addressRow.orderId, address);
    }

    return rows.map(row =>
      mapOrderRow(
        row,
        itemsByOrderId.get(row.orderId) || [],
        shippingByOrderId.get(row.orderId) || null,
        billingByOrderId.get(row.orderId) || null,
      ),
    );
  }
}

export default new OrderRepo();
