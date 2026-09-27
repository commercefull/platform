/**
 * Order line export repository — read-only projection for cross-module
 * consumers (recommendation co-purchase counting). The Order domain entity
 * does not carry organizationId, so this exposes a raw scoped row.
 */

import { query } from '../../../../libs/db';
import type { OrderLineExportRepository as OrderLineExportPort, OrderLineRef } from '../../domain/repositories/OrderLineExportRepository';

export class OrderLineExportRepository implements OrderLineExportPort {
  async getLineRefs(orderId: string): Promise<OrderLineRef[]> {
    const rows = await query<OrderLineRef[]>(
      `SELECT oi."orderId", oi."productId", o."organizationId", o."storeId"
       FROM "orderItem" oi
       JOIN "order" o ON o."orderId" = oi."orderId"
       WHERE oi."orderId" = $1 AND oi."productId" IS NOT NULL`,
      [orderId],
    );
    return rows || [];
  }

  async listPaidOrderIdsSince(
    since: Date,
    cursor: string | null,
    limit: number,
  ): Promise<{ orderIds: string[]; nextCursor: string | null }> {
    const rows = await query<Array<{ orderId: string }>>(
      `SELECT "orderId" FROM "order"
       WHERE "paymentStatus" = 'paid' AND "deletedAt" IS NULL
         AND "createdAt" >= $1
         AND ($2::uuid IS NULL OR "orderId" > $2)
       ORDER BY "orderId" ASC
       LIMIT $3`,
      [since.toISOString(), cursor, limit],
    );
    const list = rows || [];
    return {
      orderIds: list.map(r => r.orderId),
      nextCursor: list.length === limit ? list[list.length - 1].orderId : null,
    };
  }
}

export default new OrderLineExportRepository();
