/**
 * Process Refund Use Case
 * Processes a refund for an order
 */

import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { eventBus } from '../../../../libs/events/eventBus';
import { withTransaction } from '../../../../libs/db';
import { OrderNotFoundError, OrderCannotBeRefundedError, RefundAmountMustBePositiveError, RefundExceedsOrderTotalError } from '../../domain/errors/OrderErrors';

// ============================================================================
// Command
// ============================================================================

export class ProcessRefundCommand {
  constructor(
    public readonly orderId: string,
    public readonly amount: number,
    public readonly reason: string,
    public readonly transactionId?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ProcessRefundResponse {
  orderId: string;
  orderNumber: string;
  refundAmount: number;
  isFullRefund: boolean;
  previousPaymentStatus: string;
  newPaymentStatus: string;
  orderStatus: string;
  processedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ProcessRefundUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: ProcessRefundCommand): Promise<ProcessRefundResponse> {
    const order = await this.orderRepository.findById(command.orderId);

    if (!order) {
      throw new OrderNotFoundError();
    }

    // Check if order can be refunded
    if (!order.canBeRefunded) {
      throw new OrderCannotBeRefundedError(order.status, order.paymentStatus);
    }

    // Validate refund amount
    if (command.amount <= 0) {
      throw new RefundAmountMustBePositiveError();
    }

    if (command.amount > order.totalAmount.amount) {
      throw new RefundExceedsOrderTotalError();
    }

    const previousPaymentStatus = order.paymentStatus;
    const isFullRefund = command.amount >= order.totalAmount.amount;

    // Update payment status
    if (isFullRefund) {
      order.updatePaymentStatus(PaymentStatus.REFUNDED);
      order.updateStatus(OrderStatus.REFUNDED, command.reason);
    } else {
      order.updatePaymentStatus(PaymentStatus.PARTIALLY_REFUNDED);
    }

    // Add admin note
    order.addAdminNote(`Refund processed: $${command.amount.toFixed(2)} - Reason: ${command.reason}`);

    // Save updated order and record payment status change in a single transaction
    await withTransaction(async () => {
      await this.orderRepository.save(order);
      await this.orderRepository.recordPaymentStatusChange(command.orderId, order.paymentStatus, command.transactionId);
    });

    // Emit event
    eventBus.emit('order.refunded', {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      refundAmount: command.amount,
      reason: command.reason,
      isFullRefund,
    });

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      refundAmount: command.amount,
      isFullRefund,
      previousPaymentStatus,
      newPaymentStatus: order.paymentStatus,
      orderStatus: order.status,
      processedAt: new Date().toISOString(),
    };
  }
}
