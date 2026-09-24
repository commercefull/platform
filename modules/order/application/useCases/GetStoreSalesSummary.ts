import { query } from '../../../../libs/db';

export interface StoreSalesSummaryInput {
  storeId?: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface StoreSalesSummaryOutput {
  storeId: string;
  storeName: string;
  totalOrders: number;
  totalRevenueCents: number;
  averageOrderValueCents: number;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenueCents: number }>;
  ordersByStatus: Record<string, number>;
  ordersByDate: Array<{ date: string; orders: number; revenueCents: number }>;
}

interface StoreAggRow {
  storeId: string;
  storeName: string;
  totalOrders: string;
  totalRevenueCents: string;
  averageOrderValueCents: string;
}

interface StatusRow {
  status: string;
  count: string;
}

interface TopProductRow {
  productId: string;
  name: string;
  quantity: string;
  revenueCents: string;
}

interface OrdersByDateRow {
  date: string;
  orders: string;
  revenueCents: string;
}

export class GetStoreSalesSummaryUseCase {
  async execute(input: StoreSalesSummaryInput): Promise<StoreSalesSummaryOutput[]> {
    const params: unknown[] = [input.dateFrom.toISOString(), input.dateTo.toISOString()];
    let storeFilter = '';

    if (input.storeId) {
      params.push(input.storeId);
      storeFilter = ` AND o."storeId" = $${params.length}`;
    }

    const storeRows = await query<StoreAggRow[]>(
      `SELECT o."storeId", COALESCE(s.name, 'Unknown Store') as "storeName",
              COUNT(*) as "totalOrders",
              COALESCE(SUM(o."totalAmountCents"), 0) as "totalRevenueCents",
              COALESCE(AVG(o."totalAmountCents"), 0) as "averageOrderValueCents"
       FROM "order" o
       LEFT JOIN store s ON s."storeId" = o."storeId"
       WHERE o."deletedAt" IS NULL
         AND o."createdAt" >= $1
         AND o."createdAt" <= $2${storeFilter}
       GROUP BY o."storeId", s.name
       ORDER BY "totalRevenueCents" DESC`,
      params,
    );

    const results: StoreSalesSummaryOutput[] = [];

    for (const storeRow of storeRows || []) {
      const storeId = storeRow.storeId;
      if (!storeId) {
        continue;
      }

      const statusRows = await query<StatusRow[]>(
        `SELECT "status", COUNT(*) as count
         FROM "order"
         WHERE "deletedAt" IS NULL
           AND "storeId" = $1
           AND "createdAt" >= $2
           AND "createdAt" <= $3
         GROUP BY "status"`,
        [storeId, input.dateFrom.toISOString(), input.dateTo.toISOString()],
      );

      const topProducts = await query<TopProductRow[]>(
        `SELECT oi."productId", MAX(oi.name) as name,
                SUM(oi.quantity) as quantity,
                COALESCE(SUM(oi."lineTotalCents"), 0) as "revenueCents"
         FROM "orderItem" oi
         INNER JOIN "order" o ON o."orderId" = oi."orderId"
         WHERE o."deletedAt" IS NULL
           AND o."storeId" = $1
           AND o."createdAt" >= $2
           AND o."createdAt" <= $3
         GROUP BY oi."productId"
         ORDER BY "revenueCents" DESC, quantity DESC
         LIMIT 5`,
        [storeId, input.dateFrom.toISOString(), input.dateTo.toISOString()],
      );

      const ordersByDate = await query<OrdersByDateRow[]>(
        `SELECT DATE("createdAt")::text as date,
                COUNT(*) as orders,
                COALESCE(SUM("totalAmountCents"), 0) as "revenueCents"
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
        totalRevenueCents: Number(storeRow.totalRevenueCents || 0),
        averageOrderValueCents: Number(storeRow.averageOrderValueCents || 0),
        topProducts: (topProducts || []).map(row => ({
          productId: row.productId,
          name: row.name,
          quantity: parseInt(row.quantity || '0', 10),
          revenueCents: Number(row.revenueCents || 0),
        })),
        ordersByStatus,
        ordersByDate: (ordersByDate || []).map(row => ({
          date: row.date,
          orders: parseInt(row.orders || '0', 10),
          revenueCents: Number(row.revenueCents || 0),
        })),
      });
    }

    return results;
  }
}
