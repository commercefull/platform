/**
 * CreateOrderRefund Use Case
 * Creates a refund record linked to a payment
 *
 * Validates: Requirements 2.11
 */

import { OrderQueryRepository, OrderPaymentRefund, OrderPaymentRefundStatus } from '../../domain/repositories/OrderQueryRepository';
import orderDataRepository from '../../infrastructure/repositories/OrderDataRepository';

const orderQueryRepo = orderDataRepository.queries;
import { OrderPaymentNotFoundError, RefundAmountMustBePositiveError, RefundExceedsRefundableBalanceError } from '../../domain/errors/OrderErrors';

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
    private readonly queryRepo: OrderQueryRepository = orderQueryRepo,
  ) {}

  async execute(command: CreateOrderRefundCommand): Promise<CreateOrderRefundResponse> {
    const payment = await this.queryRepo.findPaymentById(command.orderPaymentId);
    if (!payment) {
      throw new OrderPaymentNotFoundError();
    }

    if (command.amount <= 0) {
      throw new RefundAmountMustBePositiveError();
    }

    const maxRefundable = payment.amount - payment.refundedAmount;
    if (command.amount > maxRefundable) {
      throw new RefundExceedsRefundableBalanceError(maxRefundable);
    }

    const refund: OrderPaymentRefund = await this.queryRepo.createRefund({
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
