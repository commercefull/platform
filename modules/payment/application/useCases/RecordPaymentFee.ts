/**
 * RecordPaymentFee Use Case
 *
 * Creates a fee record linked to a payment transaction.
 *
 * Validates: Requirements 1.3
 */

import { PaymentBillingRepository, PaymentFee } from '../../domain/repositories/PaymentBillingRepository';

import { FailedToCreatePaymentFeeError } from '../../domain/errors/PaymentErrors';

// ============================================================================
// Command
// ============================================================================

export class RecordPaymentFeeCommand {
  constructor(
    public readonly transactionId: string,
    public readonly organizationId: string,
    public readonly type: string,
    public readonly amountCents: number,
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
  organizationId: string;
  type: string;
  amountCents: number;
  currency: string;
  description?: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class RecordPaymentFeeUseCase {
  constructor(private readonly repo: PaymentBillingRepository) {}

  async execute(command: RecordPaymentFeeCommand): Promise<RecordPaymentFeeResponse> {
    const fee = await this.repo.createFee({
      transactionId: command.transactionId,
      organizationId: command.organizationId,
      type: command.type,
      amountCents: command.amountCents,
      currency: command.currency,
      description: command.description,
    });

    if (!fee) {
      throw new FailedToCreatePaymentFeeError();
    }

    return this.mapToResponse(fee);
  }

  private mapToResponse(f: PaymentFee): RecordPaymentFeeResponse {
    return {
      paymentFeeId: f.paymentFeeId,
      transactionId: f.transactionId,
      organizationId: f.organizationId,
      type: f.type,
      amountCents: f.amountCents,
      currency: f.currency,
      description: f.description,
      createdAt: f.createdAt.toISOString(),
    };
  }
}
