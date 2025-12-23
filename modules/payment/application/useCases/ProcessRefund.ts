/**
 * Process Refund Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { PaymentRefund } from '../../domain/entities/PaymentRefund';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class ProcessPaymentRefundCommand {
  constructor(
    public readonly transactionId: string,
    public readonly amount: number,
    public readonly reason?: string,
    public readonly metadata?: Record<string, any>,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ProcessRefundResponse {
  refundId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ProcessPaymentRefundUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(command: ProcessPaymentRefundCommand): Promise<ProcessRefundResponse> {
    const transaction = await this.paymentRepository.findTransactionById(command.transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (!transaction.canBeRefunded) {
      throw new Error(`Transaction cannot be refunded. Status: ${transaction.status}`);
    }

    if (command.amount > transaction.refundableAmount) {
      throw new Error(`Refund amount ($${command.amount}) exceeds refundable amount ($${transaction.refundableAmount})`);
    }

    const refundId = generateUUID();

    const refund = PaymentRefund.create({
      refundId,
      transactionId: command.transactionId,
      amount: command.amount,
      currency: transaction.currency,
      reason: command.reason,
      metadata: command.metadata,
    });

    await this.paymentRepository.saveRefund(refund);

    // Update transaction
    transaction.recordRefund(command.amount);
    await this.paymentRepository.saveTransaction(transaction);

    // Emit event
    eventBus.emit('payment.failed', {
      refundId: refund.refundId,
      transactionId: refund.transactionId,
      amount: refund.amount,
      reason: refund.reason,
    });

    return {
      refundId: refund.refundId,
      transactionId: refund.transactionId,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      createdAt: refund.createdAt.toISOString(),
    };
  }
}
