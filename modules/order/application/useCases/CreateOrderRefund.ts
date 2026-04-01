/**
 * CreateOrderRefund Use Case
 * Creates a refund record linked to a payment
 *
 * Validates: Requirements 2.11
 */

import orderPaymentRepo from '../../infrastructure/repositories/orderPaymentRepo';
import orderPaymentRefundRepo, { OrderPaymentRefund, OrderPaymentRefundStatus } from '../../infrastructure/repositories/orderPaymentRefundRepo';

// ============================================================================
// Command
// ============================================================================

export class CreateOrderRefundCommand {
  constructor(
    public readonly orderPaymentId: string,
    public readonly amount: number,
    public readonly reason?: string,
    public readonly notes?: string,
    public readonly transactionId?: string,
    public readonly refundedBy?: string,
    public readonly status: OrderPaymentRefundStatus = 'pending',
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CreateOrderRefundResponse {
  orderPaymentRefundId: string;
  orderPaymentId: string;
  amount: number;
  reason?: string;
  notes?: string;
  transactionId?: string;
  status: string;
  refundedBy?: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateOrderRefundUseCase {
  constructor(
    private readonly paymentRepo: typeof orderPaymentRepo = orderPaymentRepo,
    private readonly refundRepo: typeof orderPaymentRefundRepo = orderPaymentRefundRepo,
  ) {}

  async execute(command: CreateOrderRefundCommand): Promise<CreateOrderRefundResponse> {
    const payment = await this.paymentRepo.findById(command.orderPaymentId);
    if (!payment) {
      throw new Error('Order payment not found');
    }

    if (command.amount <= 0) {
      throw new Error('Refund amount must be greater than zero');
    }

    const maxRefundable = payment.amount - payment.refundedAmount;
    if (command.amount > maxRefundable) {
      throw new Error(`Refund amount exceeds refundable balance of ${maxRefundable}`);
    }

    const refund: OrderPaymentRefund = await this.refundRepo.create({
      orderPaymentId: command.orderPaymentId,
      amount: command.amount,
      reason: command.reason,
      notes: command.notes,
      transactionId: command.transactionId,
      status: command.status,
      refundedBy: command.refundedBy,
    });

    return {
      orderPaymentRefundId: refund.orderPaymentRefundId,
      orderPaymentId: refund.orderPaymentId,
      amount: refund.amount,
      reason: refund.reason,
      notes: refund.notes,
      transactionId: refund.transactionId,
      status: refund.status,
      refundedBy: refund.refundedBy,
      createdAt: refund.createdAt,
    };
  }
}
