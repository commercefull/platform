/**
 * CreateMerchantPayout Use Case
 *
 * Validates that the merchant has sufficient balance, then creates a payout record.
 *
 * Validates: Requirements 3.16
 */

import merchantBalanceRepo from '../../infrastructure/repositories/merchantBalanceRepo';
import merchantPayoutRepo, { MerchantPayout } from '../../infrastructure/repositories/merchantPayoutRepo';

// ============================================================================
// Command
// ============================================================================

export class CreateMerchantPayoutCommand {
  constructor(
    public readonly merchantId: string,
    public readonly amount: number,
    public readonly currency: string = 'USD',
    public readonly reference?: string,
    public readonly scheduledAt?: Date,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CreateMerchantPayoutResponse {
  merchantPayoutId: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: string;
  reference?: string;
  scheduledAt?: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateMerchantPayoutUseCase {
  constructor(
    private readonly balanceRepo: typeof merchantBalanceRepo = merchantBalanceRepo,
    private readonly payoutRepo: typeof merchantPayoutRepo = merchantPayoutRepo,
  ) {}

  async execute(command: CreateMerchantPayoutCommand): Promise<CreateMerchantPayoutResponse> {
    const balance = await this.balanceRepo.findByMerchant(command.merchantId, command.currency);

    const available = balance?.availableBalance ?? 0;
    if (available < command.amount) {
      throw new Error(
        `Insufficient funds: available ${available} ${command.currency}, requested ${command.amount} ${command.currency}`,
      );
    }

    const payout = await this.payoutRepo.create({
      merchantId: command.merchantId,
      amount: command.amount,
      currency: command.currency,
      status: 'pending',
      reference: command.reference,
      scheduledAt: command.scheduledAt,
    });

    if (!payout) {
      throw new Error('Failed to create merchant payout');
    }

    return this.mapToResponse(payout);
  }

  private mapToResponse(p: MerchantPayout): CreateMerchantPayoutResponse {
    return {
      merchantPayoutId: p.merchantPayoutId,
      merchantId: p.merchantId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      reference: p.reference,
      scheduledAt: p.scheduledAt?.toISOString(),
      createdAt: p.createdAt.toISOString(),
    };
  }
}
