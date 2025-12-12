/**
 * Update Order Status Use Case
 * Updates the status of an order with validation
 */

import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class UpdateOrderStatusCommand {
  constructor(
    public readonly orderId: string,
    public readonly newStatus: OrderStatus,
    public readonly reason?: string
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface UpdateOrderStatusResponse {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
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
      throw new Error('Order not found');
    }

    const previousStatus = order.status;

    // Use domain logic to update status (validates transition)
    order.updateStatus(command.newStatus, command.reason);

    // Save updated order
    await this.orderRepository.save(order);

    // Record status change in history
    await this.orderRepository.recordStatusChange(
      command.orderId,
      command.newStatus,
      command.reason
    );

    // Emit event
    eventBus.emit('order.status_changed', {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: command.newStatus,
      reason: command.reason
    });

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: command.newStatus,
      updatedAt: order.updatedAt.toISOString()
    };
  }
}
