import { query, queryOne } from '../../../../libs/db';

import type { OrderReturnRepository } from '../../domain/repositories/OrderReturnRepository';
import type { OrderReturn as DbOrderReturn, Order as DbOrder, OrderItem as DbOrderItem } from '../../../../libs/db/types';

type OrderReturnWithOrderNumberRow = DbOrderReturn & { orderNumber: string };
type OrderItemWithProductRow = DbOrderItem & { productName: string | null; sku: string | null };

/**
 * Storefront return reads (orderReturn joined to order) plus the order-side
 * helpers the storefront return flow needs. Writes on orderReturn are owned
 * by the returns module via the StorefrontReturnWriter ACL adapter.
 */
class OrderReturnRepo implements OrderReturnRepository {
  async findByCustomerIdWithOrderNumber(customerId: string): Promise<unknown[]> {
    const results = await query<OrderReturnWithOrderNumberRow[]>(
      `SELECT r.*, o."orderNumber"
       FROM "orderReturn" r
       JOIN "order" o ON r."orderId" = o."orderId"
       WHERE o."customerId" = $1
       ORDER BY r."createdAt" DESC`,
      [customerId],
    );
    return results || [];
  }

  async findByIdWithOrderNumber(orderReturnId: string, customerId: string): Promise<unknown | null> {
    return await queryOne<OrderReturnWithOrderNumberRow>(
      `SELECT r.*, o."orderNumber"
       FROM "orderReturn" r
       JOIN "order" o ON r."orderId" = o."orderId"
       WHERE r."orderReturnId" = $1 AND o."customerId" = $2`,
      [orderReturnId, customerId],
    );
  }

  async findOrderForCustomer(orderId: string, customerId: string): Promise<unknown | null> {
    return await queryOne<DbOrder>(`SELECT * FROM "order" WHERE "orderId" = $1 AND "customerId" = $2 AND "deletedAt" IS NULL`, [
      orderId,
      customerId,
    ]);
  }

  async findOrderItemsWithProduct(orderId: string): Promise<unknown[]> {
    const results = await query<OrderItemWithProductRow[]>(
      `SELECT oi.*, p."name" as "productName", p."sku"
       FROM "orderItem" oi
       JOIN "product" p ON oi."productId" = p."productId"
       WHERE oi."orderId" = $1`,
      [orderId],
    );
    return results || [];
  }
}

export default new OrderReturnRepo();
