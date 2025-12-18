import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type TransactionType = 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus' | 'refund';

export interface CustomerLoyaltyTransaction {
  customerLoyaltyTransactionId: string;
  createdAt: string;
  customerId: string;
  type: TransactionType;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  orderId?: string;
  description?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
}

export type CustomerLoyaltyTransactionCreateParams = Omit<CustomerLoyaltyTransaction, 'customerLoyaltyTransactionId' | 'createdAt'>;

export class CustomerLoyaltyTransactionRepo {
  async findById(id: string): Promise<CustomerLoyaltyTransaction | null> {
    return await queryOne<CustomerLoyaltyTransaction>(
      `SELECT * FROM "customerLoyaltyTransaction" WHERE "customerLoyaltyTransactionId" = $1`,
      [id]
    );
  }

  async findByCustomerId(customerId: string, limit = 100, offset = 0): Promise<CustomerLoyaltyTransaction[]> {
    return (await query<CustomerLoyaltyTransaction[]>(
      `SELECT * FROM "customerLoyaltyTransaction" WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
      [customerId, limit, offset]
    )) || [];
  }

  async findByType(customerId: string, type: TransactionType): Promise<CustomerLoyaltyTransaction[]> {
    return (await query<CustomerLoyaltyTransaction[]>(
      `SELECT * FROM "customerLoyaltyTransaction" WHERE "customerId" = $1 AND "type" = $2 ORDER BY "createdAt" DESC`,
      [customerId, type]
    )) || [];
  }

  async findByOrderId(orderId: string): Promise<CustomerLoyaltyTransaction[]> {
    return (await query<CustomerLoyaltyTransaction[]>(
      `SELECT * FROM "customerLoyaltyTransaction" WHERE "orderId" = $1 ORDER BY "createdAt" DESC`,
      [orderId]
    )) || [];
  }

  async findExpiring(customerId: string, days = 30): Promise<CustomerLoyaltyTransaction[]> {
    const now = unixTimestamp();
    const futureDate = parseInt(now) + (days * 24 * 60 * 60);
    return (await query<CustomerLoyaltyTransaction[]>(
      `SELECT * FROM "customerLoyaltyTransaction" WHERE "customerId" = $1 AND "type" = 'earn' AND "expiresAt" IS NOT NULL AND "expiresAt" BETWEEN $2 AND $3`,
      [customerId, now, futureDate.toString()]
    )) || [];
  }

  async create(params: CustomerLoyaltyTransactionCreateParams): Promise<CustomerLoyaltyTransaction> {
    const now = unixTimestamp();

    const result = await queryOne<CustomerLoyaltyTransaction>(
      `INSERT INTO "customerLoyaltyTransaction" (
        "customerId", "type", "points", "balanceBefore", "balanceAfter", "orderId", "description", "expiresAt", "metadata", "createdBy", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        params.customerId, params.type, params.points, params.balanceBefore, params.balanceAfter,
        params.orderId || null, params.description || null, params.expiresAt || null,
        params.metadata ? JSON.stringify(params.metadata) : null, params.createdBy || null, now
      ]
    );

    if (!result) throw new Error('Failed to create loyalty transaction');
    return result;
  }

  async getCurrentBalance(customerId: string): Promise<number> {
    const result = await queryOne<{ balanceAfter: string }>(
      `SELECT "balanceAfter" FROM "customerLoyaltyTransaction" WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [customerId]
    );
    return result ? parseFloat(result.balanceAfter) : 0;
  }

  async getTotalEarned(customerId: string): Promise<number> {
    const result = await queryOne<{ total: string }>(
      `SELECT SUM("points") as total FROM "customerLoyaltyTransaction" WHERE "customerId" = $1 AND "type" IN ('earn', 'bonus')`,
      [customerId]
    );
    return result && result.total ? parseFloat(result.total) : 0;
  }

  async getTotalRedeemed(customerId: string): Promise<number> {
    const result = await queryOne<{ total: string }>(
      `SELECT SUM(ABS("points")) as total FROM "customerLoyaltyTransaction" WHERE "customerId" = $1 AND "type" = 'redeem'`,
      [customerId]
    );
    return result && result.total ? parseFloat(result.total) : 0;
  }

  async getStatisticsByType(customerId: string): Promise<Record<TransactionType, number>> {
    const results = await query<{ type: TransactionType; count: string }[]>(
      `SELECT "type", COUNT(*) as count FROM "customerLoyaltyTransaction" WHERE "customerId" = $1 GROUP BY "type"`,
      [customerId]
    );
    const stats: Record<string, number> = {};
    results?.forEach(row => { stats[row.type] = parseInt(row.count, 10); });
    return stats as Record<TransactionType, number>;
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ customerLoyaltyTransactionId: string }>(
      `DELETE FROM "customerLoyaltyTransaction" WHERE "customerLoyaltyTransactionId" = $1 RETURNING "customerLoyaltyTransactionId"`,
      [id]
    );
    return !!result;
  }
}

export default new CustomerLoyaltyTransactionRepo();
