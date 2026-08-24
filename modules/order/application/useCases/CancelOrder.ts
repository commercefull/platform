/**
 * Cancel Order Use Case
 * Cancels an order with validation and cleanup
 */

import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { eventBus } from '../../../../libs/events/eventBus';
import { withTransaction } from '../../../../libs/db';
import { OrderNotFoundError, CancelOrderPermissionError, OrderCannotBeCancelledError } from '../../domain/errors/OrderErrors';

// ============================================================================
// Command
// ============================================================================

export class CancelOrderCommand {
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
    public readonly customerId?: string, // For authorization check
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CancelOrderResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  cancelledAt: string;
  reason: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CancelOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: CancelOrderCommand): Promise<CancelOrderResponse> {
    const order = await this.orderRepository.findById(command.orderId);

    if (!order) {
      throw new OrderNotFoundError();
    }

    // Authorization check - if customerId is provided, ensure order belongs to customer
    if (command.customerId && order.customerId !== command.customerId) {
      throw new CancelOrderPermissionError();
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled) {
      throw new OrderCannotBeCancelledError(order.status);
    }

    // Cancel the order using domain logic
    order.cancel(command.reason);

    // Save updated order and record status change in a single transaction
    await withTransaction(async () => {
      await this.orderRepository.save(order);
      await this.orderRepository.recordStatusChange(command.orderId, OrderStatus.CANCELLED, command.reason);
    });

    // Emit event
    eventBus.emit('order.cancelled', {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      reason: command.reason,
      totalAmount: order.totalAmount.amount,
    });

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      cancelledAt: order.cancelledAt!.toISOString(),
      reason: command.reason,
    };
  }
}
