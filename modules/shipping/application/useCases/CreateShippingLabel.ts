/**
 * Create Shipping Label Use Case
 *
 * Creates a shipping label for a fulfillment or order.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import type { CreateShippingLabelInput, ShippingLabel, ShippingLabelPort } from '../../domain/repositories/ShippingLabelRepository';
import type { ShippingCarrierPort } from '../../domain/repositories/ShippingConfigPorts';
import { ShippingCarrierNotFoundError, ShippingValidationError } from '../../domain/errors/ShippingErrors';

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
  constructor(
    private readonly shippingLabelRepo: Pick<ShippingLabelPort, 'create'>,
    private readonly shippingCarrierRepo: Pick<ShippingCarrierPort, 'findById'>,
  ) {}

  async execute(input: CreateLabelInput): Promise<ShippingLabel> {
    const carrier = await this.shippingCarrierRepo.findById(input.shippingCarrierId);
    if (!carrier) {
      throw new ShippingCarrierNotFoundError('Carrier not found');
    }

    if (!carrier.isActive) {
      throw new ShippingValidationError('Carrier is not active');
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

    const label = await this.shippingLabelRepo.create(labelInput);

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

