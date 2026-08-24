/**
 * Update Order Status Use Case
 * Updates the status of an order with validation
 */

import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { eventBus } from '../../../../libs/events/eventBus';
import { withTransaction } from '../../../../libs/db';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';

// ============================================================================
// Command
// ============================================================================

export class UpdateOrderStatusCommand {
  constructor(
    public readonly orderId: string,
    public readonly newStatus: OrderStatus,
    public readonly reason?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface UpdateOrderStatusResponse {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  status: string;
  newStatus: string;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: UpdateOrderStatusCommand): Promise<UpdateOrderStatusResponse> {
    const order = await this.orderRepository.findById(command.orderId);

    if (!order) {
      throw new OrderNotFoundError();
    }

    const previousStatus = order.status;

    // Use domain logic to update status (validates transition)
    order.updateStatus(command.newStatus, command.reason);

    // Save updated order and record status change in a single transaction
    await withTransaction(async () => {
      await this.orderRepository.save(order);
      await this.orderRepository.recordStatusChange(command.orderId, command.newStatus, command.reason, previousStatus);
    });

    // Emit event
    eventBus.emit('order.status_changed', {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: command.newStatus,
      reason: command.reason,
    });

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      previousStatus,
      status: command.newStatus,
      newStatus: command.newStatus,
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
