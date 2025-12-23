import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partiallyRefunded';
export type PaymentType = 'subscription' | 'setupFee' | 'manual' | 'refund';

export interface MembershipPayment {
  membershipPaymentId: string;
  createdAt: string;
  updatedAt: string;
  subscriptionId: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  status: PaymentStatus;
  paymentType: PaymentType;
  paymentMethod?: string;
  transactionId?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
}

export type MembershipPaymentCreateParams = Omit<MembershipPayment, 'membershipPaymentId' | 'createdAt' | 'updatedAt'>;
export type MembershipPaymentUpdateParams = Partial<Pick<MembershipPayment, 'status' | 'transactionId' | 'notes'>>;

export class MembershipPaymentRepo {
  async findById(id: string): Promise<MembershipPayment | null> {
    return await queryOne<MembershipPayment>(`SELECT * FROM "membershipPayment" WHERE "membershipPaymentId" = $1`, [id]);
  }

  async findBySubscriptionId(subscriptionId: string): Promise<MembershipPayment[]> {
    return (
      (await query<MembershipPayment[]>(`SELECT * FROM "membershipPayment" WHERE "subscriptionId" = $1 ORDER BY "paymentDate" DESC`, [
        subscriptionId,
      ])) || []
    );
  }

  async findByCustomerId(customerId: string, limit = 50): Promise<MembershipPayment[]> {
    return (
      (await query<MembershipPayment[]>(`SELECT * FROM "membershipPayment" WHERE "customerId" = $1 ORDER BY "paymentDate" DESC LIMIT $2`, [
        customerId,
        limit,
      ])) || []
    );
  }

  async findByStatus(status: PaymentStatus, limit = 100): Promise<MembershipPayment[]> {
    return (
      (await query<MembershipPayment[]>(`SELECT * FROM "membershipPayment" WHERE "status" = $1 ORDER BY "paymentDate" DESC LIMIT $2`, [
        status,
        limit,
      ])) || []
    );
  }

  async findByTransactionId(transactionId: string): Promise<MembershipPayment | null> {
    return await queryOne<MembershipPayment>(`SELECT * FROM "membershipPayment" WHERE "transactionId" = $1`, [transactionId]);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<MembershipPayment[]> {
    return (
      (await query<MembershipPayment[]>(
        `SELECT * FROM "membershipPayment" WHERE "paymentDate" BETWEEN $1 AND $2 ORDER BY "paymentDate" DESC`,
        [startDate, endDate],
      )) || []
    );
  }

  async create(params: MembershipPaymentCreateParams): Promise<MembershipPayment> {
    const now = unixTimestamp();

    const result = await queryOne<MembershipPayment>(
      `INSERT INTO "membershipPayment" (
        "subscriptionId", "customerId", "amount", "currency", "paymentDate", "status", "paymentType",
        "paymentMethod", "transactionId", "billingPeriodStart", "billingPeriodEnd", "notes",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        params.subscriptionId,
        params.customerId,
        params.amount,
        params.currency || 'USD',
        params.paymentDate || now,
        params.status || 'pending',
        params.paymentType,
        params.paymentMethod || null,
        params.transactionId || null,
        params.billingPeriodStart || null,
        params.billingPeriodEnd || null,
        params.notes || null,
        now,
        now,
      ],
    );

    if (!result) throw new Error('Failed to create membership payment');
    return result;
  }

  async update(id: string, params: MembershipPaymentUpdateParams): Promise<MembershipPayment | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<MembershipPayment>(
      `UPDATE "membershipPayment" SET ${updateFields.join(', ')} WHERE "membershipPaymentId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  async markAsCompleted(id: string, transactionId: string): Promise<MembershipPayment | null> {
    return this.update(id, { status: 'completed', transactionId });
  }

  async markAsFailed(id: string): Promise<MembershipPayment | null> {
    return this.update(id, { status: 'failed' });
  }

  async markAsRefunded(id: string): Promise<MembershipPayment | null> {
    return this.update(id, { status: 'refunded' });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ membershipPaymentId: string }>(
      `DELETE FROM "membershipPayment" WHERE "membershipPaymentId" = $1 RETURNING "membershipPaymentId"`,
      [id],
    );
    return !!result;
  }

  async getTotalRevenue(subscriptionId?: string): Promise<number> {
    let sql = `SELECT SUM("amount") as total FROM "membershipPayment" WHERE "status" = 'completed' AND "paymentType" != 'refund'`;
    const params: any[] = [];

    if (subscriptionId) {
      sql += ` AND "subscriptionId" = $1`;
      params.push(subscriptionId);
    }

    const result = await queryOne<{ total: string }>(sql, params);
    return result && result.total ? parseFloat(result.total) : 0;
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<PaymentStatus, number>;
    byType: Record<PaymentType, number>;
    revenue: number;
  }> {
    const totalResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "membershipPayment"`);
    const total = totalResult ? parseInt(totalResult.count, 10) : 0;

    const statusResults = await query<{ status: PaymentStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count FROM "membershipPayment" GROUP BY "status"`,
    );
    const byStatus: Record<string, number> = {};
    statusResults?.forEach(row => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    const typeResults = await query<{ paymentType: PaymentType; count: string }[]>(
      `SELECT "paymentType", COUNT(*) as count FROM "membershipPayment" GROUP BY "paymentType"`,
    );
    const byType: Record<string, number> = {};
    typeResults?.forEach(row => {
      byType[row.paymentType] = parseInt(row.count, 10);
    });

    const revenue = await this.getTotalRevenue();

    return { total, byStatus: byStatus as Record<PaymentStatus, number>, byType: byType as Record<PaymentType, number>, revenue };
  }
}

export default new MembershipPaymentRepo();
