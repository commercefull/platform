import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type PayoutItemType = 'payment' | 'refund' | 'dispute' | 'fee' | 'adjustment' | 'other';

export interface PayoutItem {
  payoutItemId: string;
  payoutId: string;
  type: PayoutItemType;
  amount: number;
  fee: number;
  netAmount: number;
  currencyCode: string;
  description?: string;
  orderId?: string;
  orderPaymentId?: string;
  paymentRefundId?: string;
  disputeId?: string;
  createdAt: string;
  deletedAt?: string;
}

export type PayoutItemCreateParams = Omit<PayoutItem, 'payoutItemId' | 'createdAt' | 'deletedAt'>;

export class PayoutItemRepo {
  async findById(id: string): Promise<PayoutItem | null> {
    return await queryOne<PayoutItem>(`SELECT * FROM "payoutItem" WHERE "payoutItemId" = $1 AND "deletedAt" IS NULL`, [id]);
  }

  async findByPayout(payoutId: string): Promise<PayoutItem[]> {
    return (
      (await query<PayoutItem[]>(`SELECT * FROM "payoutItem" WHERE "payoutId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" ASC`, [
        payoutId,
      ])) || []
    );
  }

  async findByType(payoutId: string, type: PayoutItemType): Promise<PayoutItem[]> {
    return (
      (await query<PayoutItem[]>(
        `SELECT * FROM "payoutItem" WHERE "payoutId" = $1 AND "type" = $2 AND "deletedAt" IS NULL ORDER BY "createdAt" ASC`,
        [payoutId, type],
      )) || []
    );
  }

  async findByOrder(orderId: string): Promise<PayoutItem[]> {
    return (
      (await query<PayoutItem[]>(`SELECT * FROM "payoutItem" WHERE "orderId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC`, [
        orderId,
      ])) || []
    );
  }

  async create(params: PayoutItemCreateParams): Promise<PayoutItem> {
    const now = unixTimestamp();
    const result = await queryOne<PayoutItem>(
      `INSERT INTO "payoutItem" (
        "payoutId", "type", "amount", "fee", "netAmount", "currencyCode", "description",
        "orderId", "orderPaymentId", "paymentRefundId", "disputeId", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        params.payoutId,
        params.type,
        params.amount,
        params.fee || 0,
        params.netAmount,
        params.currencyCode || 'USD',
        params.description || null,
        params.orderId || null,
        params.orderPaymentId || null,
        params.paymentRefundId || null,
        params.disputeId || null,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create payout item');
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ payoutItemId: string }>(
      `UPDATE "payoutItem" SET "deletedAt" = $1 WHERE "payoutItemId" = $2 AND "deletedAt" IS NULL RETURNING "payoutItemId"`,
      [unixTimestamp(), id],
    );
    return !!result;
  }

  async deleteByPayout(payoutId: string): Promise<number> {
    const results = await query<{ payoutItemId: string }[]>(
      `UPDATE "payoutItem" SET "deletedAt" = $1 WHERE "payoutId" = $2 AND "deletedAt" IS NULL RETURNING "payoutItemId"`,
      [unixTimestamp(), payoutId],
    );
    return results ? results.length : 0;
  }

  async getTotalAmount(payoutId: string): Promise<number> {
    const result = await queryOne<{ total: string }>(
      `SELECT SUM("amount") as total FROM "payoutItem" WHERE "payoutId" = $1 AND "deletedAt" IS NULL`,
      [payoutId],
    );
    return result ? parseFloat(result.total) || 0 : 0;
  }

  async count(payoutId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "payoutItem" WHERE "deletedAt" IS NULL`;
    const params: any[] = [];
    if (payoutId) {
      sql += ` AND "payoutId" = $1`;
      params.push(payoutId);
    }
    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new PayoutItemRepo();
