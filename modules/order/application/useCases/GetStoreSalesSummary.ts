import { query, queryOne } from '../../../../libs/db';

export interface StoreSalesSummaryInput {
  storeId?: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface StoreSalesSummaryOutput {
  storeId: string;
  storeName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
  ordersByStatus: Record<string, number>;
  ordersByDate: Array<{ date: string; orders: number; revenue: number }>;
}

export class GetStoreSalesSummaryUseCase {
  async execute(input: StoreSalesSummaryInput): Promise<StoreSalesSummaryOutput[]> {
    const params: any[] = [input.dateFrom.toISOString(), input.dateTo.toISOString()];
    let storeFilter = '';

    if (input.storeId) {
      params.push(input.storeId);
      storeFilter = ` AND o."storeId" = $${params.length}`;
    }

    const storeRows = await query<Record<string, any>[]>(
      `SELECT o."storeId", COALESCE(s.name, 'Unknown Store') as "storeName",
              COUNT(*) as "totalOrders",
              COALESCE(SUM(o."totalAmount"), 0) as "totalRevenue",
              COALESCE(AVG(o."totalAmount"), 0) as "averageOrderValue"
       FROM "order" o
       LEFT JOIN store s ON s."storeId" = o."storeId"
       WHERE o."deletedAt" IS NULL
         AND o."createdAt" >= $1
         AND o."createdAt" <= $2${storeFilter}
       GROUP BY o."storeId", s.name
       ORDER BY "totalRevenue" DESC`,
      params,
    );

    const results: StoreSalesSummaryOutput[] = [];

    for (const storeRow of storeRows || []) {
      const storeId = storeRow.storeId;
      if (!storeId) {
        continue;
      }

      const statusRows = await query<Record<string, any>[]>(
        `SELECT "status", COUNT(*) as count
         FROM "order"
         WHERE "deletedAt" IS NULL
           AND "storeId" = $1
           AND "createdAt" >= $2
           AND "createdAt" <= $3
         GROUP BY "status"`,
        [storeId, input.dateFrom.toISOString(), input.dateTo.toISOString()],
      );

      const topProducts = await query<Record<string, any>[]>(
        `SELECT oi."productId", MAX(oi.name) as name,
                SUM(oi.quantity) as quantity,
                COALESCE(SUM(oi."lineTotal"), 0) as revenue
         FROM "orderItem" oi
         INNER JOIN "order" o ON o."orderId" = oi."orderId"
         WHERE o."deletedAt" IS NULL
           AND o."storeId" = $1
           AND o."createdAt" >= $2
           AND o."createdAt" <= $3
         GROUP BY oi."productId"
         ORDER BY revenue DESC, quantity DESC
         LIMIT 5`,
        [storeId, input.dateFrom.toISOString(), input.dateTo.toISOString()],
      );

      const ordersByDate = await query<Record<string, any>[]>(
        `SELECT DATE("createdAt")::text as date,
                COUNT(*) as orders,
                COALESCE(SUM("totalAmount"), 0) as revenue
         FROM "order"
         WHERE "deletedAt" IS NULL
           AND "storeId" = $1
           AND "createdAt" >= $2
           AND "createdAt" <= $3
         GROUP BY DATE("createdAt")
         ORDER BY DATE("createdAt") ASC`,
        [storeId, input.dateFrom.toISOString(), input.dateTo.toISOString()],
      );

      const ordersByStatus = Object.fromEntries((statusRows || []).map(row => [row.status, parseInt(row.count || '0', 10)]));

      results.push({
        storeId,
        storeName: storeRow.storeName,
        totalOrders: parseInt(storeRow.totalOrders || '0', 10),
        totalRevenue: parseFloat(storeRow.totalRevenue || '0'),
        averageOrderValue: parseFloat(storeRow.averageOrderValue || '0'),
        topProducts: (topProducts || []).map(row => ({
          productId: row.productId,
          name: row.name,
          quantity: parseInt(row.quantity || '0', 10),
          revenue: parseFloat(row.revenue || '0'),
        })),
        ordersByStatus,
        ordersByDate: (ordersByDate || []).map(row => ({
          date: row.date,
          orders: parseInt(row.orders || '0', 10),
          revenue: parseFloat(row.revenue || '0'),
        })),
      });
    }

    return results;
  }
}
