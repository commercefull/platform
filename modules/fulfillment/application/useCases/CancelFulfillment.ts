/**
 * Cancel Fulfillment Use Case
 */

import { Fulfillment } from '../../domain/entities/Fulfillment';
import { IFulfillmentRepository } from '../../domain/repositories/FulfillmentRepository';
import { eventBus } from '../../../../libs/events/eventBus';

export class CancelFulfillmentCommand {
  constructor(
    public readonly fulfillmentId: string,
    public readonly reason?: string,
  ) {}
}

export class CancelFulfillmentUseCase {
  constructor(private readonly repository: IFulfillmentRepository) {}

  async execute(command: CancelFulfillmentCommand): Promise<{ fulfillment: Fulfillment }> {
    const fulfillment = await this.repository.findById(command.fulfillmentId);
    if (!fulfillment) {
      throw new Error(`Fulfillment ${command.fulfillmentId} not found`);
    }

    fulfillment.cancel();
    const saved = await this.repository.save(fulfillment);

    eventBus.emit('fulfillment.cancelled', {
      fulfillmentId: saved.fulfillmentId,
      orderId: saved.orderId,
      reason: command.reason,
    });

    return { fulfillment: saved };
  }
}
