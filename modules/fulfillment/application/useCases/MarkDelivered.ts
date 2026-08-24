/**
 * MarkDelivered Use Case
 *
 * Marks a fulfillment as delivered.
 */

import { Fulfillment } from '../../domain/entities/Fulfillment';
import { IFulfillmentRepository } from '../../domain/repositories/FulfillmentRepository';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';
import { emitFulfillmentDelivered } from '../../domain/events/FulfillmentEvents';

export interface MarkDeliveredInput {
  fulfillmentId: string;
}

export interface MarkDeliveredOutput {
  fulfillment: Fulfillment;
}

export class MarkDeliveredUseCase {
  constructor(private fulfillmentRepository: IFulfillmentRepository) {}

  async execute(input: MarkDeliveredInput): Promise<MarkDeliveredOutput> {
    const fulfillment = await this.fulfillmentRepository.findById(input.fulfillmentId);
    if (!fulfillment) {
      throw new FulfillmentNotFoundError(input.fulfillmentId);
    }

    // Allow deliver after ship; if not shipped yet but in transit/out_for_delivery, also allow
    fulfillment.markDelivered();

    // Save
    const savedFulfillment = await this.fulfillmentRepository.save(fulfillment);

    // Emit event
    emitFulfillmentDelivered({
      fulfillmentId: savedFulfillment.fulfillmentId,
      orderId: savedFulfillment.orderId,
      deliveredAt: savedFulfillment.deliveredAt!,
    });

    return { fulfillment: savedFulfillment };
  }
}
