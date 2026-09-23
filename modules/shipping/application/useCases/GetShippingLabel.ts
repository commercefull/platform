/**
 * Get Shipping Label Use Case
 *
 * Retrieves a shipping label by ID or tracking number.
 */

import type { ShippingLabel, ShippingLabelPort } from '../../domain/repositories/ShippingLabelRepository';

export interface GetLabelInput {
  shippingLabelId?: string;
  trackingNumber?: string;
}

export class GetShippingLabelUseCase {
  constructor(private readonly shippingLabelRepo: Pick<ShippingLabelPort, 'findById' | 'findByTrackingNumber'>) {}

  async execute(input: GetLabelInput): Promise<{ found: boolean; label: ShippingLabel | null }> {
    if (input.shippingLabelId) {
      const label = await this.shippingLabelRepo.findById(input.shippingLabelId);
      return { found: !!label, label };
    }

    if (input.trackingNumber) {
      const label = await this.shippingLabelRepo.findByTrackingNumber(input.trackingNumber);
      return { found: !!label, label };
    }

    return { found: false, label: null };
  }
}

