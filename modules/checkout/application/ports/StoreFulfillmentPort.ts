/**
 * StoreFulfillmentPort
 *
 * ACL port owned by checkout. Provides store and pickup location data
 * for BOPIS and local delivery eligibility checks.
 */

export interface StoreFulfillmentOption {
  storeId: string;
  storeName: string;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  freeDeliveryThreshold?: number;
  radiusKm?: number;
}

export interface PickupLocation {
  locationId: string;
  storeId: string;
  storeName: string;
  address: {
    line1: string;
    city: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface StoreFulfillmentPort {
  checkLocalDeliveryEligibility(address: {
    latitude?: number;
    longitude?: number;
    postalCode?: string;
    city?: string;
    country?: string;
  }): Promise<{ eligible: boolean; options: StoreFulfillmentOption[] }>;

  getAllPickupLocations(): Promise<PickupLocation[]>;
  getPickupLocation(locationId: string): Promise<PickupLocation | null>;
  findNearestPickupLocations(lat: number, lng: number, radiusKm?: number): Promise<PickupLocation[]>;
}
