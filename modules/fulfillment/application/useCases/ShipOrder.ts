/**
 * ShipOrder Use Case
 * 
 * Marks a fulfillment as shipped with tracking information.
 */

import { Fulfillment } from '../../domain/entities/Fulfillment';
import { IFulfillmentRepository } from '../../domain/repositories/FulfillmentRepository';
import { emitFulfillmentShipped } from '../../domain/events/FulfillmentEvents';

export interface ShipOrderInput {
  fulfillmentId: string;
  trackingNumber: string;
  trackingUrl?: string;
  carrierId?: string;
  carrierName?: string;
  shippingCost?: number;
}

export interface ShipOrderOutput {
  fulfillment: Fulfillment;
}

export class ShipOrderUseCase {
  constructor(private fulfillmentRepository: IFulfillmentRepository) {}

  async execute(input: ShipOrderInput): Promise<ShipOrderOutput> {
    const fulfillment = await this.fulfillmentRepository.findById(input.fulfillmentId);
    if (!fulfillment) {
      throw new Error(`Fulfillment not found: ${input.fulfillmentId}`);
    }

    // Mark as shipped with tracking info
    fulfillment.ship({
      trackingNumber: input.trackingNumber,
      trackingUrl: input.trackingUrl,
      carrierId: input.carrierId,
      carrierName: input.carrierName,
    });

    // Save
    const savedFulfillment = await this.fulfillmentRepository.save(fulfillment);

    // Emit event
    emitFulfillmentShipped({
      fulfillmentId: savedFulfillment.fulfillmentId,
      orderId: savedFulfillment.orderId,
      trackingNumber: input.trackingNumber,
      trackingUrl: input.trackingUrl,
      carrierName: input.carrierName,
    });

    return { fulfillment: savedFulfillment };
  }
}
