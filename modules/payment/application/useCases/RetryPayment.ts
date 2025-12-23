/**
 * RetryPayment Use Case
 *
 * Retries a failed payment with same or different payment method.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface RetryPaymentInput {
  transactionId: string;
  paymentMethodId?: string;
  customerId?: string;
}

export interface RetryPaymentOutput {
  success: boolean;
  newTransactionId: string;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
  retriedAt: string;
}

export class RetryPaymentUseCase {
  constructor(private readonly paymentRepository: any) {}

  async execute(input: RetryPaymentInput): Promise<RetryPaymentOutput> {
    // Get original transaction
    const originalTransaction = await this.paymentRepository.findById(input.transactionId);
    if (!originalTransaction) {
      throw new Error(`Transaction not found: ${input.transactionId}`);
    }

    // Only failed transactions can be retried
    if (originalTransaction.status !== 'failed') {
      throw new Error(`Cannot retry transaction with status: ${originalTransaction.status}`);
    }

    // Check retry limit
    const retryCount = await this.paymentRepository.countRetries(input.transactionId);
    if (retryCount >= 3) {
      throw new Error('Maximum retry attempts reached');
    }

    const newTransactionId = `txn_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    // Create new transaction as retry
    const newTransaction = await this.paymentRepository.create({
      transactionId: newTransactionId,
      orderId: originalTransaction.orderId,
      customerId: input.customerId || originalTransaction.customerId,
      amount: originalTransaction.amount,
      currency: originalTransaction.currency,
      paymentMethodId: input.paymentMethodId || originalTransaction.paymentMethodId,
      provider: originalTransaction.provider,
      status: 'pending',
      retryOf: input.transactionId,
      metadata: {
        ...originalTransaction.metadata,
        retryAttempt: retryCount + 1,
      },
    });

    // Attempt to process payment
    try {
      // This would integrate with actual payment provider
      const result = await this.processWithProvider(newTransaction);

      if (result.success) {
        await this.paymentRepository.updateStatus(newTransactionId, 'completed', {
          providerTransactionId: result.providerTransactionId,
        });

        eventBus.emit('payment.completed', {
          transactionId: newTransactionId,
          orderId: newTransaction.orderId,
          retriedFrom: input.transactionId,
        });

        return {
          success: true,
          newTransactionId,
          status: 'completed',
          retriedAt: new Date().toISOString(),
        };
      } else {
        await this.paymentRepository.updateStatus(newTransactionId, 'failed', {
          failureReason: result.error,
        });

        return {
          success: false,
          newTransactionId,
          status: 'failed',
          message: result.error,
          retriedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';

      await this.paymentRepository.updateStatus(newTransactionId, 'failed', {
        failureReason: errorMessage,
      });

      return {
        success: false,
        newTransactionId,
        status: 'failed',
        message: errorMessage,
        retriedAt: new Date().toISOString(),
      };
    }
  }

  private async processWithProvider(transaction: any): Promise<{ success: boolean; providerTransactionId?: string; error?: string }> {
    // This would be implemented with actual provider SDK
    // For now, return pending to be updated via webhook
    return {
      success: true,
      providerTransactionId: `prov_${Date.now().toString(36)}`,
    };
  }
}
