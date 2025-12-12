import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

// Import types from generated DB types - single source of truth
import { MembershipSubscription as DbMembershipSubscription } from '../../../libs/db/types';

// Re-export DB type
export type MembershipSubscription = DbMembershipSubscription;

// Type alias for subscription status (used in application logic)
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'paused' | 'trial' | 'pending' | 'pastDue';

// Derived types for create/update operations
export type MembershipSubscriptionCreateParams = Omit<MembershipSubscription, 'membershipSubscriptionId' | 'createdAt' | 'updatedAt' | 'membershipNumber'>;
export type MembershipSubscriptionUpdateParams = Partial<Pick<MembershipSubscription, 'status' | 'endDate' | 'nextBillingDate' | 'lastBillingDate' | 'cancelledAt' | 'cancelReason' | 'isAutoRenew' | 'priceOverride' | 'paymentMethodId' | 'notes'>>;

export class MembershipSubscriptionRepo {
  private async generateMembershipNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MEM-${timestamp}-${random}`;
  }

  async findById(id: string): Promise<MembershipSubscription | null> {
    return await queryOne<MembershipSubscription>(`SELECT * FROM "membershipSubscription" WHERE "membershipSubscriptionId" = $1`, [id]);
  }

  async findByMembershipNumber(membershipNumber: string): Promise<MembershipSubscription | null> {
    return await queryOne<MembershipSubscription>(`SELECT * FROM "membershipSubscription" WHERE "membershipNumber" = $1`, [membershipNumber]);
  }

  async findByCustomerId(customerId: string): Promise<MembershipSubscription[]> {
    return (await query<MembershipSubscription[]>(
      `SELECT * FROM "membershipSubscription" WHERE "customerId" = $1 ORDER BY "createdAt" DESC`,
      [customerId]
    )) || [];
  }

  async findActiveByCustomerId(customerId: string): Promise<MembershipSubscription[]> {
    return (await query<MembershipSubscription[]>(
      `SELECT * FROM "membershipSubscription" WHERE "customerId" = $1 AND "status" = 'active' ORDER BY "createdAt" DESC`,
      [customerId]
    )) || [];
  }

  async findByPlanId(planId: string, limit = 50, offset = 0): Promise<MembershipSubscription[]> {
    return (await query<MembershipSubscription[]>(
      `SELECT * FROM "membershipSubscription" WHERE "membershipPlanId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
      [planId, limit, offset]
    )) || [];
  }

  async findByStatus(status: SubscriptionStatus, limit = 100): Promise<MembershipSubscription[]> {
    return (await query<MembershipSubscription[]>(
      `SELECT * FROM "membershipSubscription" WHERE "status" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
      [status, limit]
    )) || [];
  }

  async findExpiringSoon(days = 7): Promise<MembershipSubscription[]> {
    const now = unixTimestamp();
    const futureDate = parseInt(now) + (days * 24 * 60 * 60);
    return (await query<MembershipSubscription[]>(
      `SELECT * FROM "membershipSubscription" WHERE "status" = 'active' AND "endDate" IS NOT NULL AND "endDate" BETWEEN $1 AND $2`,
      [now, futureDate.toString()]
    )) || [];
  }

  async findTrialEnding(days = 3): Promise<MembershipSubscription[]> {
    const now = unixTimestamp();
    const futureDate = parseInt(now) + (days * 24 * 60 * 60);
    return (await query<MembershipSubscription[]>(
      `SELECT * FROM "membershipSubscription" WHERE "status" = 'trial' AND "trialEndDate" BETWEEN $1 AND $2`,
      [now, futureDate.toString()]
    )) || [];
  }

  async create(params: MembershipSubscriptionCreateParams): Promise<MembershipSubscription> {
    const now = unixTimestamp();
    const membershipNumber = await this.generateMembershipNumber();

    const result = await queryOne<MembershipSubscription>(
      `INSERT INTO "membershipSubscription" (
        "customerId", "membershipPlanId", "status", "membershipNumber", "startDate", "endDate",
        "trialEndDate", "nextBillingDate", "lastBillingDate", "isAutoRenew", "priceOverride",
        "billingCycleOverride", "paymentMethodId", "notes", "createdBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        params.customerId, params.membershipPlanId, params.status || 'active', membershipNumber,
        params.startDate || now, params.endDate || null, params.trialEndDate || null,
        params.nextBillingDate || null, params.lastBillingDate || null, params.isAutoRenew ?? true,
        params.priceOverride || null, params.billingCycleOverride || null, params.paymentMethodId || null,
        params.notes || null, params.createdBy || null, now, now
      ]
    );

    if (!result) throw new Error('Failed to create membership subscription');
    return result;
  }

  async update(id: string, params: MembershipSubscriptionUpdateParams): Promise<MembershipSubscription | null> {
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

    return await queryOne<MembershipSubscription>(
      `UPDATE "membershipSubscription" SET ${updateFields.join(', ')} WHERE "membershipSubscriptionId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async updateStatus(id: string, status: SubscriptionStatus): Promise<MembershipSubscription | null> {
    const updates: any = { status };
    if (status === 'cancelled') updates.cancelledAt = new Date();
    return this.update(id, updates);
  }

  async cancel(id: string, reason?: string): Promise<MembershipSubscription | null> {
    return this.update(id, { status: 'cancelled', cancelledAt: new Date(), cancelReason: reason });
  }

  async pause(id: string): Promise<MembershipSubscription | null> {
    return this.update(id, { status: 'paused' });
  }

  async resume(id: string): Promise<MembershipSubscription | null> {
    return this.update(id, { status: 'active' });
  }

  async renew(id: string, endDate: Date, nextBillingDate: Date): Promise<MembershipSubscription | null> {
    return this.update(id, { endDate, nextBillingDate, lastBillingDate: new Date() });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ membershipSubscriptionId: string }>(
      `DELETE FROM "membershipSubscription" WHERE "membershipSubscriptionId" = $1 RETURNING "membershipSubscriptionId"`,
      [id]
    );
    return !!result;
  }

  async getStatistics(): Promise<Record<SubscriptionStatus, number>> {
    const results = await query<{ status: SubscriptionStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count FROM "membershipSubscription" GROUP BY "status"`
    );
    const stats: Record<string, number> = {};
    results?.forEach(row => { stats[row.status] = parseInt(row.count, 10); });
    return stats as Record<SubscriptionStatus, number>;
  }
}

export default new MembershipSubscriptionRepo();
