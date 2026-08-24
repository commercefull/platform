/**
 * CapturePayment Use Case
 *
 * Captures a previously authorized payment.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { TransactionNotFoundError, TransactionCannotBeCapturedError, CaptureAmountExceedsAuthorizedError, CaptureFailedError } from '../../domain/errors/PaymentErrors';

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

interface PaymentRepositoryPort {
  findTransactionById(id: string): Promise<TransactionRecord | null>;
  updateTransaction(transaction: TransactionRecord): Promise<void>;
}

interface PaymentGatewayPort {
  capture(params: {
    transactionId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; response?: Record<string, unknown>; error?: string }>;
}

interface TransactionRecord {
  transactionId: string;
  orderId: string;
  gatewayTransactionId: string;
  amount: number;
  currency: string;
  status: string;
  capturedAmount?: number;
  capturedAt?: Date;
  gatewayResponse?: Record<string, unknown> | string;
}

export class CapturePaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    // Get the transaction
    const transaction = await this.paymentRepository.findTransactionById(input.transactionId);
    if (!transaction) {
      throw new TransactionNotFoundError(input.transactionId);
    }

    // Validate transaction is authorized
    if (transaction.status !== 'authorized') {
      throw new TransactionCannotBeCapturedError(transaction.status);
    }

    // Determine capture amount
    const captureAmount = input.amount ?? transaction.amount;
    if (captureAmount > transaction.amount) {
      throw new CaptureAmountExceedsAuthorizedError();
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

      throw new CaptureFailedError(gatewayResult.error ?? 'Unknown gateway error');
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
      status: transaction.status as 'captured' | 'partial_captured',
      capturedAt: transaction.capturedAt.toISOString(),
      remainingAmount: isPartialCapture ? transaction.amount - captureAmount : undefined,
    };
  }
}
