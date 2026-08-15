/**
 * Check Local Delivery Eligibility Use Case
 * Checks if a customer address is within a store's local delivery zone
 */

import StoreRepo from '../../../store/infrastructure/repositories/StoreRepo';

export interface LocalDeliveryOption {
  storeId: string;
  storeName: string;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  freeDeliveryThreshold?: number;
  radiusKm?: number;
}

export class CheckLocalDeliveryEligibilityUseCase {
  async execute(address: { latitude?: number; longitude?: number; postalCode?: string; city?: string; country?: string }): Promise<{
    eligible: boolean;
    options: LocalDeliveryOption[];
  }> {
    const stores = await StoreRepo.findActive();
    const options: LocalDeliveryOption[] = [];

    for (const store of stores) {
      const deliverySettings = store.settings?.localDelivery;
      if (!deliverySettings?.enabled) continue;

      let isEligible = false;

      // Check by postal code
      if (deliverySettings.postalCodes && deliverySettings.postalCodes.length > 0) {
        if (address.postalCode && deliverySettings.postalCodes.includes(address.postalCode)) {
          isEligible = true;
        }
      }

      // Check by radius (Haversine distance)
      if (!isEligible && deliverySettings.radiusKm && address.latitude && address.longitude && store.address?.latitude && store.address?.longitude) {
        const distance = this.calculateDistance(
          address.latitude,
          address.longitude,
          store.address.latitude,
          store.address.longitude,
        );
        if (distance <= deliverySettings.radiusKm) {
          isEligible = true;
        }
      }

      if (isEligible) {
        options.push({
          storeId: store.storeId,
          storeName: store.name,
          deliveryFee: deliverySettings.deliveryFee,
          estimatedDeliveryMinutes: deliverySettings.estimatedDeliveryMinutes,
          freeDeliveryThreshold: deliverySettings.freeDeliveryThreshold,
          radiusKm: deliverySettings.radiusKm,
        });
      }
    }

    return {
      eligible: options.length > 0,
      options,
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const checkLocalDeliveryEligibilityUseCase = new CheckLocalDeliveryEligibilityUseCase();
