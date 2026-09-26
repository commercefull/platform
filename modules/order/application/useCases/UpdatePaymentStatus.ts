/**
 * Update Payment Status Use Case
 * Updates the payment status of an order and records the change in status history
 */

import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { BadRequestError } from '../../../../libs/errors';
import { withTransaction } from '../../../../libs/db';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';

// ============================================================================
// Command
// ============================================================================

export class UpdatePaymentStatusCommand {
  constructor(
    public readonly orderId: string,
    public readonly paymentStatus: PaymentStatus,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface UpdatePaymentStatusResponse {
  orderId: string;
  previousStatus: string;
  paymentStatus: string;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdatePaymentStatusUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: UpdatePaymentStatusCommand): Promise<UpdatePaymentStatusResponse> {
    const validStatuses = Object.values(PaymentStatus) as string[];
    if (!validStatuses.includes(command.paymentStatus)) {
      throw new BadRequestError(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await this.orderRepository.findById(command.orderId);
    if (!order) {
      throw new OrderNotFoundError();
    }

    const previousStatus = order.paymentStatus;
    order.updatePaymentStatus(command.paymentStatus);

    await withTransaction(async () => {
      await this.orderRepository.save(order);
      await this.orderRepository.recordPaymentStatusChange(command.orderId, command.paymentStatus);
    });

    return {
      orderId: order.orderId,
      previousStatus,
      paymentStatus: order.paymentStatus,
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
