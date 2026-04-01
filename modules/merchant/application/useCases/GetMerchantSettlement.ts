/**
 * GetMerchantSettlement Use Case
 *
 * Returns a merchant payout (settlement) with its associated line items.
 *
 * Validates: Requirements 3.17
 */

import merchantPayoutRepo, { MerchantPayout } from '../../infrastructure/repositories/merchantPayoutRepo';
import merchantPayoutItemRepo, { MerchantPayoutItem } from '../../infrastructure/repositories/merchantPayoutItemRepo';

// ============================================================================
// Command
// ============================================================================

export class GetMerchantSettlementCommand {
  constructor(
    public readonly merchantPayoutId: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface GetMerchantSettlementResponse {
  payout: MerchantPayout;
  lineItems: MerchantPayoutItem[];
}

// ============================================================================
// Use Case
// ============================================================================

export class GetMerchantSettlementUseCase {
  constructor(
    private readonly payoutRepo: typeof merchantPayoutRepo = merchantPayoutRepo,
    private readonly payoutItemRepo: typeof merchantPayoutItemRepo = merchantPayoutItemRepo,
  ) {}

  async execute(command: GetMerchantSettlementCommand): Promise<GetMerchantSettlementResponse> {
    const payout = await this.payoutRepo.findById(command.merchantPayoutId);

    if (!payout) {
      throw new Error(`Merchant payout not found: ${command.merchantPayoutId}`);
    }

    const lineItems = await this.payoutItemRepo.findByPayout(command.merchantPayoutId);

    return { payout, lineItems };
  }
}
