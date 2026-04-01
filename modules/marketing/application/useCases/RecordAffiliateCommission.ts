/**
 * RecordAffiliateCommission Use Case
 *
 * Creates a commission record in marketingAffiliateCommission for an affiliate-attributed order.
 *
 * Validates: Requirements 6.8
 */

import * as affiliateRepo from '../../infrastructure/repositories/affiliateRepo';

// ============================================================================
// Command
// ============================================================================

export class RecordAffiliateCommissionCommand {
  constructor(
    public readonly affiliateId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface RecordAffiliateCommissionResponse {
  marketingAffiliateCommissionId: string;
  affiliateId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class RecordAffiliateCommissionUseCase {
  constructor(private readonly affRepo: typeof affiliateRepo = affiliateRepo) {}

  async execute(command: RecordAffiliateCommissionCommand): Promise<RecordAffiliateCommissionResponse> {
    if (!command.affiliateId) throw new Error('affiliateId is required');
    if (!command.orderId) throw new Error('orderId is required');
    if (command.amount <= 0) throw new Error('Commission amount must be greater than zero');

    const affiliate = await this.affRepo.findById(command.affiliateId);
    if (!affiliate) throw new Error(`Affiliate ${command.affiliateId} not found`);

    const commission = await this.affRepo.recordCommission(
      command.affiliateId,
      command.orderId,
      command.amount,
      command.currency,
    );

    if (!commission) throw new Error('Failed to record affiliate commission');

    return {
      marketingAffiliateCommissionId: commission.marketingAffiliateCommissionId,
      affiliateId: commission.affiliateId,
      orderId: commission.orderId,
      amount: commission.amount,
      currency: commission.currency,
      status: commission.status,
      createdAt: commission.createdAt.toISOString(),
    };
  }
}
