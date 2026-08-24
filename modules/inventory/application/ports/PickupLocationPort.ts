/**
 * PickupLocationPort
 *
 * ACL port owned by inventory. Provides CRUD access to pickup locations
 * that are physically owned by the store module.
 *
 * Store is the canonical owner of pickup location data; inventory
 * accesses it through this port to avoid a direct infrastructure
 * dependency on store.
 */

export interface PickupLocationSummary {
  id: string;
  storeId: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  isActive: boolean;
  prepareTimeMinutes?: number;
}

export interface CreatePickupLocationInput {
  storeId: string;
  name: string;
  address: PickupLocationSummary['address'];
  prepareTimeMinutes?: number;
}

export interface UpdatePickupLocationInput {
  name?: string;
  address?: Partial<PickupLocationSummary['address']>;
  isActive?: boolean;
}

export interface PickupLocationPort {
  findById(id: string): Promise<PickupLocationSummary | null>;
  findAll(storeId?: string): Promise<PickupLocationSummary[]>;
  create(data: CreatePickupLocationInput): Promise<PickupLocationSummary>;
  update(id: string, data: UpdatePickupLocationInput): Promise<PickupLocationSummary | null>;
  delete(id: string): Promise<boolean>;
}
