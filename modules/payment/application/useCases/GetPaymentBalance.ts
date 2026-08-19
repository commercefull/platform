/**
 * GetPaymentBalance Use Case
 *
 * Returns a merchant's current balance along with the full credit/debit history.
 *
 * Validates: Requirements 1.7
 */

import paymentBalanceRepo, { PaymentBalance } from '../../infrastructure/repositories/paymentBalanceRepo';

// ============================================================================
// Command
// ============================================================================

export class GetPaymentBalanceCommand {
  constructor(
    public readonly organizationId: string,
    public readonly currency?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface BalanceEntry {
  paymentBalanceId: string;
  currency: string;
  amount: number;
  updatedAt: string;
}

export interface GetPaymentBalanceResponse {
  organizationId: string;
  balances: BalanceEntry[];
  currentBalance?: number;
}

// ============================================================================
// Use Case
// ============================================================================

export class GetPaymentBalanceUseCase {
  constructor(private readonly repo: typeof paymentBalanceRepo = paymentBalanceRepo) {}

  async execute(command: GetPaymentBalanceCommand): Promise<GetPaymentBalanceResponse> {
    const balances = await this.repo.findByMerchant(command.organizationId);

    let currentBalance: number | undefined;
    if (command.currency) {
      currentBalance = await this.repo.getBalance(command.organizationId, command.currency);
    }

    return {
      organizationId: command.organizationId,
      balances: balances.map(b => this.mapEntry(b)),
      currentBalance,
    };
  }

  private mapEntry(b: PaymentBalance): BalanceEntry {
    return {
      paymentBalanceId: b.paymentBalanceId,
      currency: b.currency,
      amount: b.amount,
      updatedAt: b.updatedAt.toISOString(),
    };
  }
}
