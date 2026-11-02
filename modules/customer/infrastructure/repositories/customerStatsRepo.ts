import { query, queryOne } from '../../../../libs/db';
import type { Customer as DbCustomer } from '../../../../libs/db/types';

export type Customer = DbCustomer;

/** Aggregate/statistical customer queries. */
export class CustomerStatsRepo {
  async getCustomerStats(
    customerId: string,
  ): Promise<{ orderCount: number; totalSpent: number; averageOrderValue: number; lastOrderDate: Date | null }> {
    const stats = await queryOne<{ orderCount: string; totalSpent: string; averageOrderValue: string; lastOrderDate: Date | null }>(
      `SELECT COUNT(*) as "orderCount", COALESCE(SUM("totalAmountCents"), 0) as "totalSpent", COALESCE(AVG("totalAmountCents"), 0) as "averageOrderValue", MAX("createdAt") as "lastOrderDate"
       FROM "order" WHERE "customerId" = $1`,
      [customerId],
    );

    return {
      orderCount: parseInt(stats?.orderCount || '0'),
      totalSpent: parseFloat(stats?.totalSpent || '0'),
      averageOrderValue: parseFloat(stats?.averageOrderValue || '0'),
      lastOrderDate: stats?.lastOrderDate || null,
    };
  }

  async getNewCustomersCount(days: number = 30): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "customer" WHERE "createdAt" >= NOW() - $1 * INTERVAL '1 day'`,
      [days],
    );
    return parseInt(result?.count || '0');
  }

  async getTopCustomers(limit: number = 10): Promise<(Customer & { totalSpent: number; orderCount: number })[]> {
    const customers = await query<(Customer & { totalSpent: number; orderCount: number })[]>(
      `SELECT c.*, COALESCE(SUM(o."totalAmountCents"), 0) as "totalSpent", COUNT(o."orderId") as "orderCount"
       FROM "customer" c LEFT JOIN "order" o ON c."customerId" = o."customerId"
       GROUP BY c."customerId" ORDER BY "totalSpent" DESC LIMIT $1`,
      [limit],
    );
    return customers || [];
  }
}
