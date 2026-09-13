/**
 * Get Shipping Label Use Case
 *
 * Retrieves a shipping label by ID or tracking number.
 */

import { shippingLabelRepo } from '../wired';
import type { ShippingLabel } from '../../domain/repositories/ShippingLabelRepository';

export interface GetLabelInput {
  shippingLabelId?: string;
  trackingNumber?: string;
}

export class GetShippingLabelUseCase {
  async execute(input: GetLabelInput): Promise<{ found: boolean; label: ShippingLabel | null }> {
    if (input.shippingLabelId) {
      const label = await shippingLabelRepo.findById(input.shippingLabelId);
      return { found: !!label, label };
    }

    if (input.trackingNumber) {
      const label = await shippingLabelRepo.findByTrackingNumber(input.trackingNumber);
      return { found: !!label, label };
    }

    return { found: false, label: null };
  }
}

export const getShippingLabelUseCase = new GetShippingLabelUseCase();
