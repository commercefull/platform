/**
 * GetMerchantFinancials Use Case
 *
 * Returns the merchant's current balance, recent transactions, and pending payouts.
 *
 * Validates: Requirements 3.16
 */

import merchantBalanceRepo, { MerchantBalance } from '../../infrastructure/repositories/merchantBalanceRepo';
import merchantTransactionRepo, { MerchantTransaction } from '../../infrastructure/repositories/merchantTransactionRepo';
import merchantPayoutRepo, { MerchantPayout } from '../../infrastructure/repositories/merchantPayoutRepo';

// ============================================================================
// Command
// ============================================================================

export class GetMerchantFinancialsCommand {
  constructor(
    public readonly merchantId: string,
    public readonly currency: string = 'USD',
    public readonly transactionLimit: number = 20,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface MerchantFinancialsResponse {
  merchantId: string;
  balance: MerchantBalance | null;
  recentTransactions: MerchantTransaction[];
  pendingPayouts: MerchantPayout[];
}

// ============================================================================
// Use Case
// ============================================================================

export class GetMerchantFinancialsUseCase {
  constructor(
    private readonly balanceRepo: typeof merchantBalanceRepo = merchantBalanceRepo,
    private readonly transactionRepo: typeof merchantTransactionRepo = merchantTransactionRepo,
    private readonly payoutRepo: typeof merchantPayoutRepo = merchantPayoutRepo,
  ) {}

  async execute(command: GetMerchantFinancialsCommand): Promise<MerchantFinancialsResponse> {
    const [balance, recentTransactions, allPayouts] = await Promise.all([
      this.balanceRepo.findByMerchant(command.merchantId, command.currency),
      this.transactionRepo.findByMerchant(command.merchantId, command.transactionLimit, 0),
      this.payoutRepo.findByMerchant(command.merchantId, 50, 0),
    ]);

    const pendingPayouts = allPayouts.filter(p => p.status === 'pending');

    return {
      merchantId: command.merchantId,
      balance,
      recentTransactions,
      pendingPayouts,
    };
  }
}
