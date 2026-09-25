/**
 * StoreStoreFulfillmentAdapter
 *
 * ACL adapter implementing checkout's StoreFulfillmentPort.
 * Translates store's StoreRepo and pickupLocationRepo into
 * checkout's StoreFulfillmentOption + PickupLocation vocabulary.
 */

import { StoreFulfillmentPort, StoreFulfillmentOption, PickupLocation } from '../../application/ports/StoreFulfillmentPort';
import type StoreRepo from '../../../store/infrastructure/repositories/StoreRepo';
import type * as pickupLocationRepo from '../../../store/infrastructure/repositories/pickupLocationRepo';

export class StoreStoreFulfillmentAdapter implements StoreFulfillmentPort {
  constructor(
    private readonly storeRepo: Pick<typeof StoreRepo, 'findActive'>,
    private readonly pickupLocations: Pick<
      typeof pickupLocationRepo,
      'getLocations' | 'getLocation' | 'findNearestLocations'
    >,
  ) {}

  async checkLocalDeliveryEligibility(address: {
    latitude?: number;
    longitude?: number;
    postalCode?: string;
    city?: string;
    country?: string;
  }): Promise<{ eligible: boolean; options: StoreFulfillmentOption[] }> {
    const stores = await this.storeRepo.findActive();
    const options: StoreFulfillmentOption[] = [];

    for (const store of stores) {
      const deliverySettings = store.settings?.localDelivery;
      if (!deliverySettings?.enabled) continue;

      let isEligible = false;

      if (deliverySettings.postalCodes && deliverySettings.postalCodes.length > 0) {
        if (address.postalCode && deliverySettings.postalCodes.includes(address.postalCode)) {
          isEligible = true;
        }
      }

      if (
        !isEligible &&
        deliverySettings.radiusKm &&
        address.latitude &&
        address.longitude &&
        store.address?.latitude &&
        store.address?.longitude
      ) {
        const distance = this.calculateDistance(address.latitude, address.longitude, store.address.latitude, store.address.longitude);
        if (distance <= deliverySettings.radiusKm) {
          isEligible = true;
        }
      }

      if (isEligible) {
        options.push({
          storeId: store.storeId,
          storeName: store.name,
          deliveryFee: deliverySettings.deliveryFee || 0,
          estimatedDeliveryMinutes: deliverySettings.estimatedDeliveryMinutes || 60,
          freeDeliveryThreshold: deliverySettings.freeDeliveryThreshold,
          radiusKm: deliverySettings.radiusKm,
        });
      }
    }

    return { eligible: options.length > 0, options };
  }

  async getAllPickupLocations(): Promise<PickupLocation[]> {
    const locations = await this.pickupLocations.getLocations();
    return locations.map(loc => this.mapLocation(loc));
  }

  async getPickupLocation(locationId: string): Promise<PickupLocation | null> {
    const loc = await this.pickupLocations.getLocation(locationId);
    return loc ? this.mapLocation(loc) : null;
  }

  async findNearestPickupLocations(lat: number, lng: number, radiusKm?: number): Promise<PickupLocation[]> {
    const locations = await this.pickupLocations.findNearestLocations(lat, lng, radiusKm ?? 50);
    return locations.map(loc => this.mapLocation(loc));
  }

  private mapLocation(loc: pickupLocationRepo.PickupLocation): PickupLocation {
    return {
      locationId: loc.pickupLocationId,
      storeId: loc.storeId,
      storeName: loc.name,
      address: {
        line1: loc.address.line1,
        city: loc.address.city,
        postalCode: loc.address.postalCode,
        country: loc.address.country,
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
      operatingHours: loc.operatingHours,
      maxOrdersPerSlot: loc.maxOrdersPerSlot,
      prepareTimeMinutes: loc.prepareTimeMinutes,
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
