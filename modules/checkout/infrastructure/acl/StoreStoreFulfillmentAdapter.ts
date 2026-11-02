/**
 * StoreStoreFulfillmentAdapter
 *
 * ACL adapter implementing checkout's StoreFulfillmentPort.
 * Translates store's StoreRepo and pickupLocationRepo into
 * checkout's StoreFulfillmentOption + PickupLocation vocabulary.
 */

import { StoreFulfillmentPort, StoreFulfillmentOption, PickupLocation } from '../../application/ports/StoreFulfillmentPort';
import type StoreRepo from '../../../store/infrastructure/repositories/StoreRepo';
import type {
  PickupLocation as PickupLocationRecord,
  getLocations,
  getLocation,
  findNearestLocations,
} from '../../../store/infrastructure/repositories/pickupLocationRepo';

type PickupLocationRepoPort = {
  getLocations: typeof getLocations;
  getLocation: typeof getLocation;
  findNearestLocations: typeof findNearestLocations;
};

// Locations without an assigned store can't be pickup targets.
type AssignedPickupLocation = PickupLocationRecord & { storeId: string };
const isAssignedLocation = <T extends { storeId: string | null }>(loc: T): loc is T & { storeId: string } => loc.storeId !== null;

type ActiveStore = Awaited<ReturnType<typeof StoreRepo.findActive>>[number];
type LocalDeliverySettings = NonNullable<NonNullable<ActiveStore['settings']>['localDelivery']>;

type DeliveryAddress = {
  latitude?: number;
  longitude?: number;
  postalCode?: string;
  city?: string;
  country?: string;
};

export class StoreStoreFulfillmentAdapter implements StoreFulfillmentPort {
  constructor(
    private readonly storeRepo: Pick<typeof StoreRepo, 'findActive'>,
    private readonly pickupLocations: PickupLocationRepoPort,
  ) {}

  async checkLocalDeliveryEligibility(address: DeliveryAddress): Promise<{ eligible: boolean; options: StoreFulfillmentOption[] }> {
    const stores = await this.storeRepo.findActive();
    const options: StoreFulfillmentOption[] = [];

    for (const store of stores) {
      const option = this.deliveryOptionFor(store, address);
      if (option) options.push(option);
    }

    return { eligible: options.length > 0, options };
  }

  /** Build the fulfillment option when the address is eligible for this store's local delivery. */
  private deliveryOptionFor(store: ActiveStore, address: DeliveryAddress): StoreFulfillmentOption | null {
    const deliverySettings = store.settings?.localDelivery;
    if (!deliverySettings?.enabled || !this.isEligibleForStore(store, deliverySettings, address)) return null;
    return {
      storeId: store.storeId,
      storeName: store.name,
      deliveryFee: deliverySettings.deliveryFee || 0,
      estimatedDeliveryMinutes: deliverySettings.estimatedDeliveryMinutes || 60,
      freeDeliveryThreshold: deliverySettings.freeDeliveryThreshold,
      radiusKm: deliverySettings.radiusKm,
    };
  }

  private isEligibleForStore(store: ActiveStore, deliverySettings: LocalDeliverySettings, address: DeliveryAddress): boolean {
    if (deliverySettings.postalCodes?.length && address.postalCode && deliverySettings.postalCodes.includes(address.postalCode)) {
      return true;
    }
    return this.isWithinRadius(store, deliverySettings, address);
  }

  private isWithinRadius(store: ActiveStore, deliverySettings: LocalDeliverySettings, address: DeliveryAddress): boolean {
    if (
      !deliverySettings.radiusKm ||
      !address.latitude ||
      !address.longitude ||
      !store.address?.latitude ||
      !store.address?.longitude
    ) {
      return false;
    }
    const distance = this.calculateDistance(address.latitude, address.longitude, store.address.latitude, store.address.longitude);
    return distance <= deliverySettings.radiusKm;
  }

  async getAllPickupLocations(): Promise<PickupLocation[]> {
    const locations = await this.pickupLocations.getLocations();
    return locations.filter(isAssignedLocation).map(loc => this.mapLocation(loc));
  }

  async getPickupLocation(locationId: string): Promise<PickupLocation | null> {
    const loc = await this.pickupLocations.getLocation(locationId);
    return loc && isAssignedLocation(loc) ? this.mapLocation(loc) : null;
  }

  async findNearestPickupLocations(lat: number, lng: number, radiusKm?: number): Promise<PickupLocation[]> {
    const locations = await this.pickupLocations.findNearestLocations(lat, lng, radiusKm ?? 50);
    return locations.filter(isAssignedLocation).map(loc => this.mapLocation(loc));
  }

  private mapLocation(loc: AssignedPickupLocation): PickupLocation {
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
