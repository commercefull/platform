/**
 * Update Fulfillment Status Use Case
 * Updates the fulfillment status of an order and records the change in status history
 */

import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';
import { BadRequestError } from '../../../../libs/errors';
import { withTransaction } from '../../../../libs/db';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';

// ============================================================================
// Command
// ============================================================================

export class UpdateFulfillmentStatusCommand {
  constructor(
    public readonly orderId: string,
    public readonly fulfillmentStatus: FulfillmentStatus,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface UpdateFulfillmentStatusResponse {
  orderId: string;
  previousStatus: string;
  fulfillmentStatus: string;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdateFulfillmentStatusUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: UpdateFulfillmentStatusCommand): Promise<UpdateFulfillmentStatusResponse> {
    const validStatuses = Object.values(FulfillmentStatus) as string[];
    if (!validStatuses.includes(command.fulfillmentStatus)) {
      throw new BadRequestError(`Invalid fulfillment status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await this.orderRepository.findById(command.orderId);
    if (!order) {
      throw new OrderNotFoundError();
    }

    const previousStatus = order.fulfillmentStatus;
    order.updateFulfillmentStatus(command.fulfillmentStatus);

    await withTransaction(async () => {
      await this.orderRepository.save(order);
      await this.orderRepository.recordFulfillmentStatusChange(command.orderId, command.fulfillmentStatus);
    });

    return {
      orderId: order.orderId,
      previousStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
