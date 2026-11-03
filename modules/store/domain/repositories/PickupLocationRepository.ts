/**
 * Pickup Location Repository Port
 *
 * Domain interface for store pickup location persistence.
 */

export interface PickupLocation {
  pickupLocationId: string;
  storeId: string | null;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  latitude?: number;
  longitude?: number;
  operatingHours?: Record<string, { open: string; close: string }>;
  isActive: boolean;
  contactPhone?: string;
  contactEmail?: string;
  instructions?: string;
  maxOrdersPerSlot?: number;
  prepareTimeMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePickupLocationInput {
  storeId: string | null;
  name: string;
  address: PickupLocation['address'];
  latitude?: number;
  longitude?: number;
  operatingHours?: Record<string, { open: string; close: string }>;
  contactPhone?: string;
  contactEmail?: string;
  instructions?: string;
  maxOrdersPerSlot?: number;
  prepareTimeMinutes?: number;
}

export interface UpdatePickupLocationInput {
  name?: string;
  address?: Partial<PickupLocation['address']>;
  latitude?: number;
  longitude?: number;
  operatingHours?: Record<string, { open: string; close: string }>;
  isActive?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  instructions?: string;
  maxOrdersPerSlot?: number;
  prepareTimeMinutes?: number;
}

export interface PickupLocationRepository {
  saveLocation(params: CreatePickupLocationInput): Promise<PickupLocation>;
  getLocation(pickupLocationId: string): Promise<PickupLocation | null>;
  getLocations(storeId?: string): Promise<PickupLocation[]>;
  updateLocation(pickupLocationId: string, params: UpdatePickupLocationInput): Promise<PickupLocation | null>;
  deleteLocation(pickupLocationId: string): Promise<boolean>;
  findNearestLocations(
    latitude: number,
    longitude: number,
    radiusKm?: number,
    limit?: number,
  ): Promise<Array<PickupLocation & { distance: number }>>;
}
