/**
 * RecordPaymentFee Use Case
 *
 * Creates a fee record linked to a payment transaction.
 *
 * Validates: Requirements 1.3
 */

import paymentFeeRepo, { PaymentFee } from '../../infrastructure/repositories/paymentFeeRepo';

// ============================================================================
// Command
// ============================================================================

export class RecordPaymentFeeCommand {
  constructor(
    public readonly transactionId: string,
    public readonly merchantId: string,
    public readonly type: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly description?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface RecordPaymentFeeResponse {
  paymentFeeId: string;
  transactionId: string;
  merchantId: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class RecordPaymentFeeUseCase {
  constructor(private readonly repo: typeof paymentFeeRepo = paymentFeeRepo) {}

  async execute(command: RecordPaymentFeeCommand): Promise<RecordPaymentFeeResponse> {
    const fee = await this.repo.create({
      transactionId: command.transactionId,
      merchantId: command.merchantId,
      type: command.type,
      amount: command.amount,
      currency: command.currency,
      description: command.description,
    });

    if (!fee) {
      throw new Error('Failed to create payment fee');
    }

    return this.mapToResponse(fee);
  }

  private mapToResponse(f: PaymentFee): RecordPaymentFeeResponse {
    return {
      paymentFeeId: f.paymentFeeId,
      transactionId: f.transactionId,
      merchantId: f.merchantId,
      type: f.type,
      amount: f.amount,
      currency: f.currency,
      description: f.description,
      createdAt: f.createdAt.toISOString(),
    };
  }
}
