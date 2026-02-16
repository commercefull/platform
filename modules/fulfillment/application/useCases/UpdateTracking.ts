/**
 * Update Tracking Use Case
 */

import { Fulfillment } from '../../domain/entities/Fulfillment';
import { IFulfillmentRepository } from '../../domain/repositories/FulfillmentRepository';
import { eventBus } from '../../../../libs/events/eventBus';

export class UpdateTrackingCommand {
  constructor(
    public readonly fulfillmentId: string,
    public readonly trackingNumber: string,
    public readonly trackingUrl?: string,
  ) {}
}

export class UpdateTrackingUseCase {
  constructor(private readonly repository: IFulfillmentRepository) {}

  async execute(command: UpdateTrackingCommand): Promise<{ fulfillment: Fulfillment }> {
    const fulfillment = await this.repository.findById(command.fulfillmentId);
    if (!fulfillment) {
      throw new Error(`Fulfillment ${command.fulfillmentId} not found`);
    }

    fulfillment.updateTracking(command.trackingNumber, command.trackingUrl);
    const saved = await this.repository.save(fulfillment);

    eventBus.emit('fulfillment.tracking_updated', {
      fulfillmentId: saved.fulfillmentId,
      orderId: saved.orderId,
      trackingNumber: command.trackingNumber,
      trackingUrl: command.trackingUrl,
    });

    return { fulfillment: saved };
  }
}
