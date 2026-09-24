/**
 * GetPaymentBalance Use Case
 *
 * Returns a merchant's current balance along with the full credit/debit history.
 *
 * Validates: Requirements 1.7
 */

import { PaymentBillingRepository, PaymentBalance } from '../../domain/repositories/PaymentBillingRepository';


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
  amountCents: number;
  updatedAt: string;
}

export interface GetPaymentBalanceResponse {
  organizationId: string;
  balances: BalanceEntry[];
  currentBalanceCents?: number;
}

// ============================================================================
// Use Case
// ============================================================================

export class GetPaymentBalanceUseCase {
  constructor(private readonly repo: PaymentBillingRepository) {}

  async execute(command: GetPaymentBalanceCommand): Promise<GetPaymentBalanceResponse> {
    const balances = await this.repo.findBalancesByMerchant(command.organizationId);

    let currentBalanceCents: number | undefined;
    if (command.currency) {
      currentBalanceCents = await this.repo.getBalance(command.organizationId, command.currency);
    }

    return {
      organizationId: command.organizationId,
      balances: balances.map(b => this.mapEntry(b)),
      currentBalanceCents,
    };
  }

  private mapEntry(b: PaymentBalance): BalanceEntry {
    return {
      paymentBalanceId: b.paymentBalanceId,
      currency: b.currency,
      amountCents: b.amountCents,
      updatedAt: b.updatedAt.toISOString(),
    };
  }
}
