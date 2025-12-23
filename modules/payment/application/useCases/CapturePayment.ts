/**
 * CapturePayment Use Case
 * 
 * Captures a previously authorized payment.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface CapturePaymentInput {
  transactionId: string;
  amount?: number; // Optional partial capture amount
  metadata?: Record<string, unknown>;
}

export interface CapturePaymentOutput {
  transactionId: string;
  capturedAmount: number;
  status: 'captured' | 'partial_captured' | 'failed';
  capturedAt: string;
  remainingAmount?: number;
}

export class CapturePaymentUseCase {
  constructor(
    private readonly paymentRepository: any, // PaymentRepository
    private readonly paymentGateway: any // PaymentGatewayService
  ) {}

  async execute(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    // Get the transaction
    const transaction = await this.paymentRepository.findTransactionById(input.transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${input.transactionId}`);
    }

    // Validate transaction is authorized
    if (transaction.status !== 'authorized') {
      throw new Error(`Transaction cannot be captured. Current status: ${transaction.status}`);
    }

    // Determine capture amount
    const captureAmount = input.amount ?? transaction.amount;
    if (captureAmount > transaction.amount) {
      throw new Error('Capture amount cannot exceed authorized amount');
    }

    // Call payment gateway to capture
    const gatewayResult = await this.paymentGateway.capture({
      transactionId: transaction.gatewayTransactionId,
      amount: captureAmount,
      currency: transaction.currency,
      metadata: input.metadata,
    });

    if (!gatewayResult.success) {
      // Update transaction status to failed
      transaction.status = 'capture_failed';
      transaction.gatewayResponse = gatewayResult.error;
      await this.paymentRepository.updateTransaction(transaction);

      throw new Error(`Capture failed: ${gatewayResult.error}`);
    }

    // Update transaction
    const isPartialCapture = captureAmount < transaction.amount;
    transaction.status = isPartialCapture ? 'partial_captured' : 'captured';
    transaction.capturedAmount = captureAmount;
    transaction.capturedAt = new Date();
    transaction.gatewayResponse = gatewayResult.response;
    
    await this.paymentRepository.updateTransaction(transaction);

    // Emit event
    eventBus.emit('payment.received', {
      transactionId: transaction.transactionId,
      orderId: transaction.orderId,
      amount: captureAmount,
      currency: transaction.currency,
    });

    return {
      transactionId: transaction.transactionId,
      capturedAmount: captureAmount,
      status: transaction.status,
      capturedAt: transaction.capturedAt.toISOString(),
      remainingAmount: isPartialCapture ? transaction.amount - captureAmount : undefined,
    };
  }
}
