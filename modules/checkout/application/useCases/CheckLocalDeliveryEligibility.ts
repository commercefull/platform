/**
 * Check Local Delivery Eligibility Use Case
 * Checks if a customer address is within a store's local delivery zone
 */

import { StoreFulfillmentPort } from '../../application/ports/StoreFulfillmentPort';

export interface LocalDeliveryOption {
  storeId: string;
  storeName: string;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  freeDeliveryThreshold?: number;
  radiusKm?: number;
}

export class CheckLocalDeliveryEligibilityUseCase {
  constructor(private readonly storeFulfillmentPort?: StoreFulfillmentPort) {}

  async execute(address: { latitude?: number; longitude?: number; postalCode?: string; city?: string; country?: string }): Promise<{
    eligible: boolean;
    options: LocalDeliveryOption[];
  }> {
    if (!this.storeFulfillmentPort) {
      return { eligible: false, options: [] };
    }
    const result = await this.storeFulfillmentPort.checkLocalDeliveryEligibility(address);
    return {
      eligible: result.eligible,
      options: result.options,
    };
  }
}
