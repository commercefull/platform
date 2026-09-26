/**
 * EstimateDeliveryWindow Use Case
 *
 * Computes the estimated delivery window for a shipping method:
 * handling days + transit days (which may be stored as a number or a
 * { min, max } JSON range) added to the current date.
 */

import type { ShippingAddress } from './CalculateShippingRates';
import type { ShippingMethodPort } from '../../domain/repositories/ShippingConfigPorts';
import { ShippingMethodNotFoundError, ShippingValidationError } from '../../domain/errors/ShippingErrors';

export interface EstimateDeliveryWindowInput {
  methodId?: string;
  destinationAddress?: ShippingAddress;
}

export interface EstimateDeliveryWindowResult {
  methodId: string;
  methodName: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  estimatedDeliveryMin: string;
  estimatedDeliveryMax: string;
  handlingDays: number;
  destinationAddress?: ShippingAddress;
}

export class EstimateDeliveryWindowUseCase {
  constructor(private readonly shippingMethods: Pick<ShippingMethodPort, 'findById'>) {}

  async execute(input: EstimateDeliveryWindowInput): Promise<EstimateDeliveryWindowResult> {
    if (!input.methodId) {
      throw new ShippingValidationError('methodId is required');
    }

    const method = await this.shippingMethods.findById(input.methodId);
    if (!method) {
      throw new ShippingMethodNotFoundError(input.methodId);
    }

    // estimatedDeliveryDays may be stored as JSON { min, max } or a number
    const deliveryDays = method.estimatedDeliveryDays as { min?: number; max?: number } | number | null;
    const handlingDays = method.handlingDays || 0;

    let daysMin = handlingDays;
    let daysMax = handlingDays;

    if (typeof deliveryDays === 'number') {
      daysMin += deliveryDays;
      daysMax += deliveryDays;
    } else if (deliveryDays && typeof deliveryDays === 'object') {
      daysMin += deliveryDays.min || 0;
      daysMax += deliveryDays.max || deliveryDays.min || 0;
    }

    const now = new Date();
    const minDate = new Date(now);
    const maxDate = new Date(now);
    minDate.setDate(minDate.getDate() + daysMin);
    maxDate.setDate(maxDate.getDate() + daysMax);

    return {
      methodId: method.shippingMethodId,
      methodName: method.name,
      estimatedDaysMin: daysMin,
      estimatedDaysMax: daysMax,
      estimatedDeliveryMin: minDate.toISOString(),
      estimatedDeliveryMax: maxDate.toISOString(),
      handlingDays,
      destinationAddress: input.destinationAddress,
    };
  }
}
