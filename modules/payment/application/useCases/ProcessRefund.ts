/**
 * Process Refund Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { withTransaction } from '../../../../libs/db';
import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { PaymentRefund } from '../../domain/entities/PaymentRefund';
import { eventBus } from '../../../../libs/events/eventBus';
import {
  TransactionNotFoundError,
  TransactionCannotBeRefundedError,
  RefundAmountExceedsRefundableError,
} from '../../domain/errors/PaymentErrors';

// ============================================================================
// Command
// ============================================================================

export class ProcessPaymentRefundCommand {
  constructor(
    public readonly transactionId: string,
    public readonly amountCents: number,
    public readonly reason?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ProcessRefundResponse {
  refundId: string;
  transactionId: string;
  amountCents: number;
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
      throw new TransactionNotFoundError(command.transactionId);
    }

    if (!transaction.canBeRefunded) {
      throw new TransactionCannotBeRefundedError(transaction.status);
    }

    if (command.amountCents > transaction.refundableAmount) {
      throw new RefundAmountExceedsRefundableError(command.amountCents, transaction.refundableAmount);
    }

    const refundId = generateUUID();

    const refund = PaymentRefund.create({
      refundId,
      transactionId: command.transactionId,
      amountCents: command.amountCents,
      currency: transaction.currency,
      reason: command.reason,
      metadata: command.metadata,
    });

    await withTransaction(async () => {
      await this.paymentRepository.saveRefund(refund);

      // Update transaction
      transaction.recordRefund(command.amountCents);
      await this.paymentRepository.saveTransaction(transaction);
    });

    // Emit event
    eventBus.emit('payment.failed', {
      refundId: refund.refundId,
      transactionId: refund.transactionId,
      amountCents: refund.amountCents,
      reason: refund.reason,
    });

    return {
      refundId: refund.refundId,
      transactionId: refund.transactionId,
      amountCents: refund.amountCents,
      currency: refund.currency,
      status: refund.status,
      createdAt: refund.createdAt.toISOString(),
    };
  }
}
