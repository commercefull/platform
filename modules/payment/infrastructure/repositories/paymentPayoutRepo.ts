import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

export type PayoutStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PayoutMethod = 'bank_transfer' | 'paypal' | 'check' | 'other';

export interface Payout {
  payoutId: string;
  organizationId: string;
  amount: number;
  fee: number;
  netAmount: number;
  currencyCode: string;
  status: PayoutStatus;
  payoutMethod: PayoutMethod;
  bankAccountId?: string;
  bankAccountDetails?: unknown;
  description?: string;
  statementDescriptor?: string;
  periodStart?: string;
  periodEnd?: string;
  expectedArrivalDate?: string;
  completedAt?: string;
  failureReason?: string;
  transactionReference?: string;
  gatewayPayoutId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type PayoutCreateParams = Omit<Payout, 'payoutId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type PayoutUpdateParams = Partial<Omit<Payout, 'payoutId' | 'organizationId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export class PayoutRepo {
  async findById(id: string): Promise<Payout | null> {
    return await queryOne<Payout>(`SELECT * FROM "paymentPayout" WHERE "payoutId" = $1 AND "deletedAt" IS NULL`, [id]);
  }

  async findByMerchant(organizationId: string, status?: PayoutStatus, limit = 100): Promise<Payout[]> {
    let sql = `SELECT * FROM "paymentPayout" WHERE "organizationId" = $1 AND "deletedAt" IS NULL`;
    const params: unknown[] = [organizationId];
    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }
    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    return (await query<Payout[]>(sql, params)) || [];
  }

  async findByStatus(status: PayoutStatus, limit = 100): Promise<Payout[]> {
    return (
      (await query<Payout[]>(`SELECT * FROM "paymentPayout" WHERE "status" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT $2`, [
        status,
        limit,
      ])) || []
    );
  }

  async findByGatewayId(gatewayPayoutId: string): Promise<Payout | null> {
    return await queryOne<Payout>(`SELECT * FROM "paymentPayout" WHERE "gatewayPayoutId" = $1 AND "deletedAt" IS NULL`, [gatewayPayoutId]);
  }

  async create(params: PayoutCreateParams): Promise<Payout> {
    const now = unixTimestamp();
    const result = await queryOne<Payout>(
      `INSERT INTO "paymentPayout" (
        "organizationId", "amount", "fee", "netAmount", "currencyCode", "status", "payoutMethod",
        "bankAccountId", "bankAccountDetails", "description", "statementDescriptor", "periodStart",
        "periodEnd", "expectedArrivalDate", "completedAt", "failureReason", "transactionReference",
        "gatewayPayoutId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
      [
        params.organizationId,
        params.amount,
        params.fee || 0,
        params.netAmount,
        params.currencyCode || 'USD',
        params.status || 'pending',
        params.payoutMethod || 'bank_transfer',
        params.bankAccountId || null,
        JSON.stringify(params.bankAccountDetails || {}),
        params.description || null,
        params.statementDescriptor || null,
        params.periodStart || null,
        params.periodEnd || null,
        params.expectedArrivalDate || null,
        params.completedAt || null,
        params.failureReason || null,
        params.transactionReference || null,
        params.gatewayPayoutId || null,
        now,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create payout');
    return result;
  }

  async update(id: string, params: PayoutUpdateParams): Promise<Payout | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'bankAccountDetails' ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<Payout>(
      `UPDATE "paymentPayout" SET ${updateFields.join(', ')} WHERE "payoutId" = $${paramIndex} AND "deletedAt" IS NULL RETURNING *`,
      values,
    );
  }

  async markCompleted(id: string, transactionReference?: string): Promise<Payout | null> {
    return this.update(id, { status: 'completed', completedAt: unixTimestamp(), transactionReference });
  }

  async markFailed(id: string, failureReason: string): Promise<Payout | null> {
    return this.update(id, { status: 'failed', failureReason });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ payoutId: string }>(
      `UPDATE "paymentPayout" SET "deletedAt" = $1 WHERE "payoutId" = $2 AND "deletedAt" IS NULL RETURNING "payoutId"`,
      [unixTimestamp(), id],
    );
    return !!result;
  }

  async count(organizationId?: string, status?: PayoutStatus): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "paymentPayout" WHERE "deletedAt" IS NULL`;
    const params: unknown[] = [];

    if (organizationId) {
      sql += ` AND "organizationId" = $${params.length + 1}`;
      params.push(organizationId);
    }
    if (status) {
      sql += ` AND "status" = $${params.length + 1}`;
      params.push(status);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new PayoutRepo();
