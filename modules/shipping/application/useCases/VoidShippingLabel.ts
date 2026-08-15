/**
 * Void Shipping Label Use Case
 *
 * Voids a previously created shipping label.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import shippingLabelRepo, { ShippingLabel } from '../../infrastructure/repositories/shippingLabelRepo';

export interface VoidLabelInput {
  shippingLabelId: string;
  reason?: string;
}

export class VoidShippingLabelUseCase {
  async execute(input: VoidLabelInput): Promise<{ voided: boolean; label: ShippingLabel | null }> {
    const label = await shippingLabelRepo.voidLabel(input.shippingLabelId, input.reason);

    if (!label) {
      return { voided: false, label: null };
    }

    eventBus.emit('shipping.label.voided', {
      shippingLabelId: label.shippingLabelId,
      trackingNumber: label.trackingNumber,
      reason: input.reason,
    });

    return { voided: true, label };
  }
}

export const voidShippingLabelUseCase = new VoidShippingLabelUseCase();
