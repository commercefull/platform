/**
 * VoidPayment Use Case
 *
 * Voids a previously authorized (but not captured) payment.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface VoidPaymentInput {
  transactionId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface VoidPaymentOutput {
  transactionId: string;
  status: 'voided' | 'failed';
  voidedAt: string;
}

export class VoidPaymentUseCase {
  constructor(
    private readonly paymentRepository: any, // PaymentRepository
    private readonly paymentGateway: any, // PaymentGatewayService
  ) {}

  async execute(input: VoidPaymentInput): Promise<VoidPaymentOutput> {
    // Get the transaction
    const transaction = await this.paymentRepository.findTransactionById(input.transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${input.transactionId}`);
    }

    // Validate transaction can be voided (only authorized transactions)
    if (transaction.status !== 'authorized') {
      throw new Error(`Transaction cannot be voided. Current status: ${transaction.status}. Only authorized transactions can be voided.`);
    }

    // Call payment gateway to void
    const gatewayResult = await this.paymentGateway.void({
      transactionId: transaction.gatewayTransactionId,
      reason: input.reason,
      metadata: input.metadata,
    });

    if (!gatewayResult.success) {
      transaction.status = 'void_failed';
      transaction.gatewayResponse = gatewayResult.error;
      await this.paymentRepository.updateTransaction(transaction);

      throw new Error(`Void failed: ${gatewayResult.error}`);
    }

    // Update transaction
    transaction.status = 'voided';
    transaction.voidedAt = new Date();
    transaction.voidReason = input.reason;
    transaction.gatewayResponse = gatewayResult.response;

    await this.paymentRepository.updateTransaction(transaction);

    // Emit event (void is similar to failed payment from order perspective)
    eventBus.emit('payment.failed', {
      transactionId: transaction.transactionId,
      orderId: transaction.orderId,
      reason: 'voided',
    });

    return {
      transactionId: transaction.transactionId,
      status: 'voided',
      voidedAt: transaction.voidedAt.toISOString(),
    };
  }
}
