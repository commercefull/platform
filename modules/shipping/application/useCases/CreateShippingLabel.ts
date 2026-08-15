/**
 * Create Shipping Label Use Case
 *
 * Creates a shipping label for a fulfillment or order.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import shippingLabelRepo, { CreateShippingLabelInput, ShippingLabel } from '../../infrastructure/repositories/shippingLabelRepo';
import shippingCarrierRepo from '../../infrastructure/repositories/shippingCarrierRepo';

export interface CreateLabelInput {
  shippingCarrierId: string;
  carrierService?: string;
  orderId?: string;
  fulfillmentId?: string;
  trackingNumber: string;
  labelUrl?: string;
  labelFormat?: string;
  shipFromName?: string;
  shipToName?: string;
  shipToAddressLine1?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToPostalCode?: string;
  shipToCountry?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  shippingCost?: number;
}

export class CreateShippingLabelUseCase {
  async execute(input: CreateLabelInput): Promise<ShippingLabel> {
    const carrier = await shippingCarrierRepo.findById(input.shippingCarrierId);
    if (!carrier) {
      throw new Error('Carrier not found');
    }

    if (!carrier.isActive) {
      throw new Error('Carrier is not active');
    }

    const labelInput: CreateShippingLabelInput = {
      shippingCarrierId: input.shippingCarrierId,
      carrierName: carrier.name,
      carrierService: input.carrierService,
      trackingNumber: input.trackingNumber,
      labelUrl: input.labelUrl,
      labelFormat: input.labelFormat || 'PDF',
      orderId: input.orderId,
      fulfillmentId: input.fulfillmentId,
      shipFromName: input.shipFromName,
      shipToName: input.shipToName,
      shipToAddressLine1: input.shipToAddressLine1,
      shipToCity: input.shipToCity,
      shipToState: input.shipToState,
      shipToPostalCode: input.shipToPostalCode,
      shipToCountry: input.shipToCountry,
      weight: input.weight,
      dimensions: input.dimensions,
      shippingCost: input.shippingCost,
    };

    const label = await shippingLabelRepo.create(labelInput);

    eventBus.emit('shipping.label_created', {
      shippingLabelId: label.shippingLabelId,
      trackingNumber: label.trackingNumber,
      carrierId: label.shippingCarrierId,
      orderId: label.orderId,
      fulfillmentId: label.fulfillmentId,
    });

    return label;
  }
}

export const createShippingLabelUseCase = new CreateShippingLabelUseCase();
