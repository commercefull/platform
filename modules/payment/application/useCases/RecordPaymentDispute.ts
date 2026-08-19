/**
 * RecordPaymentDispute Use Case
 *
 * Creates a dispute record for a payment and updates the associated
 * transaction status to reflect the dispute.
 *
 * Validates: Requirements 1.2
 */

import paymentDisputeRepo, { PaymentDispute } from '../../infrastructure/repositories/paymentDisputeRepo';
import paymentRepo from '../../infrastructure/repositories/paymentRepo';

// ============================================================================
// Command
// ============================================================================

export class RecordPaymentDisputeCommand {
  constructor(
    public readonly paymentId: string,
    public readonly organizationId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: string = 'open',
    public readonly externalDisputeId?: string,
    public readonly reason?: string,
    public readonly evidence?: Record<string, unknown>,
    public readonly dueBy?: Date,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface RecordPaymentDisputeResponse {
  paymentDisputeId: string;
  paymentId: string;
  organizationId: string;
  externalDisputeId?: string;
  status: string;
  reason?: string;
  amount: number;
  currency: string;
  dueBy?: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class RecordPaymentDisputeUseCase {
  constructor(
    private readonly disputeRepo: typeof paymentDisputeRepo = paymentDisputeRepo,
    private readonly txRepo: typeof paymentRepo = paymentRepo,
  ) {}

  async execute(command: RecordPaymentDisputeCommand): Promise<RecordPaymentDisputeResponse> {
    const dispute = await this.disputeRepo.create({
      paymentId: command.paymentId,
      organizationId: command.organizationId,
      externalDisputeId: command.externalDisputeId,
      status: command.status,
      reason: command.reason,
      amount: command.amount,
      currency: command.currency,
      evidence: command.evidence,
      dueBy: command.dueBy,
      resolvedAt: undefined,
    });

    if (!dispute) {
      throw new Error('Failed to create payment dispute');
    }

    // Update the transaction status to reflect the dispute
    const transaction = await this.txRepo.findTransactionById(command.paymentId);
    if (transaction) {
      await this.txRepo.updateTransaction(transaction.paymentTransactionId, { status: 'disputed' });
    }

    return this.mapToResponse(dispute);
  }

  private mapToResponse(d: PaymentDispute): RecordPaymentDisputeResponse {
    return {
      paymentDisputeId: d.paymentDisputeId,
      paymentId: d.paymentId,
      organizationId: d.organizationId,
      externalDisputeId: d.externalDisputeId,
      status: d.status,
      reason: d.reason,
      amount: d.amount,
      currency: d.currency,
      dueBy: d.dueBy?.toISOString(),
      createdAt: d.createdAt.toISOString(),
    };
  }
}
