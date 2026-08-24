/**
 * RecordPaymentDispute Use Case
 *
 * Creates a dispute record for a payment and updates the associated
 * transaction status to reflect the dispute.
 *
 * Validates: Requirements 1.2
 */

import { PaymentBillingRepository, PaymentDispute } from '../../domain/repositories/PaymentBillingRepository';
import { PaymentGatewayRepository } from '../../domain/repositories/PaymentGatewayRepository';
import { FailedToCreatePaymentDisputeError } from '../../domain/errors/PaymentErrors';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';
import paymentDataRepository from '../../infrastructure/repositories/PaymentDataRepository';

const paymentBillingRepo = paymentBillingDataRepository.billing;
const paymentRepo = paymentDataRepository.gateways;

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
    private readonly billingRepo: PaymentBillingRepository = paymentBillingRepo,
    private readonly txRepo: PaymentGatewayRepository = paymentRepo,
  ) {}

  async execute(command: RecordPaymentDisputeCommand): Promise<RecordPaymentDisputeResponse> {
    const dispute = await this.billingRepo.createDispute({
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
      throw new FailedToCreatePaymentDisputeError();
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
