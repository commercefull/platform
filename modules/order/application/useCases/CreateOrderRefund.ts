/**
 * CreateOrderRefund Use Case
 * Creates a refund record linked to a payment
 *
 * Validates: Requirements 2.11
 */

import { OrderQueryRepository, OrderPaymentRefund, OrderPaymentRefundStatus } from '../../domain/repositories/OrderQueryRepository';

import {
  OrderPaymentNotFoundError,
  RefundAmountMustBePositiveError,
  RefundExceedsRefundableBalanceError,
} from '../../domain/errors/OrderErrors';
export interface CreateOrderRefundCommandProps {
  orderPaymentId: string;
  amountCents: number;
  reason?: string;
  notes?: string;
  transactionId?: string;
  refundedBy?: string;
  status?: OrderPaymentRefundStatus;
}

// ============================================================================
// Command
// ============================================================================

export class CreateOrderRefundCommand {
  public readonly orderPaymentId: string;
  public readonly amountCents: number;
  public readonly reason?: string;
  public readonly notes?: string;
  public readonly transactionId?: string;
  public readonly refundedBy?: string;
  public readonly status: OrderPaymentRefundStatus;

  constructor(props: CreateOrderRefundCommandProps) {
    this.orderPaymentId = props.orderPaymentId;
    this.amountCents = props.amountCents;
    this.reason = props.reason;
    this.notes = props.notes;
    this.transactionId = props.transactionId;
    this.refundedBy = props.refundedBy;
    this.status = props.status ?? 'pending';
  }
}

// ============================================================================
// Response
// ============================================================================

export interface CreateOrderRefundResponse {
  orderPaymentRefundId: string;
  orderPaymentId: string;
  amountCents: number;
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
  constructor(private readonly queryRepo: OrderQueryRepository) {}

  async execute(command: CreateOrderRefundCommand): Promise<CreateOrderRefundResponse> {
    const payment = await this.queryRepo.findPaymentById(command.orderPaymentId);
    if (!payment) {
      throw new OrderPaymentNotFoundError();
    }

    if (command.amountCents <= 0) {
      throw new RefundAmountMustBePositiveError();
    }

    const maxRefundable = payment.amountCents - payment.refundedAmountCents;
    if (command.amountCents > maxRefundable) {
      throw new RefundExceedsRefundableBalanceError(maxRefundable);
    }

    const refund: OrderPaymentRefund = await this.queryRepo.createRefund({
      orderPaymentId: command.orderPaymentId,
      amountCents: command.amountCents,
      reason: command.reason,
      notes: command.notes,
      transactionId: command.transactionId,
      status: command.status,
      gatewayResponse: undefined,
      refundedBy: command.refundedBy,
    });

    return {
      orderPaymentRefundId: refund.orderPaymentRefundId,
      orderPaymentId: refund.orderPaymentId,
      amountCents: refund.amountCents,
      reason: refund.reason,
      notes: refund.notes,
      transactionId: refund.transactionId,
      status: refund.status,
      refundedBy: refund.refundedBy,
      createdAt: refund.createdAt.toISOString(),
    };
  }
}
