/**
 * StorePickupLocationAdapter
 *
 * ACL adapter implementing inventory's PickupLocationPort.
 * Translates store's pickupLocationRepo functions into
 * inventory's PickupLocationSummary vocabulary.
 *
 * Only this adapter may import from store's infrastructure.
 */

import {
  PickupLocationPort,
  PickupLocationSummary,
  CreatePickupLocationInput,
  UpdatePickupLocationInput,
} from '../../application/ports/PickupLocationPort';
import type * as pickupLocationRepo from '../../../store/infrastructure/repositories/pickupLocationRepo';
import type { PickupLocation } from '../../../store/infrastructure/repositories/pickupLocationRepo';

function toSummary(loc: PickupLocation): PickupLocationSummary {
  return {
    id: loc.pickupLocationId,
    storeId: loc.storeId,
    name: loc.name,
    address: loc.address,
    isActive: loc.isActive,
    prepareTimeMinutes: loc.prepareTimeMinutes,
  };
}

export class StorePickupLocationAdapter implements PickupLocationPort {
  constructor(
    private readonly locations: Pick<
      typeof pickupLocationRepo,
      'saveLocation' | 'getLocation' | 'getLocations' | 'updateLocation' | 'deleteLocation'
    >,
  ) {}

  async findById(id: string): Promise<PickupLocationSummary | null> {
    const loc = await this.locations.getLocation(id);
    return loc ? toSummary(loc) : null;
  }

  async findAll(storeId?: string): Promise<PickupLocationSummary[]> {
    const locs = await this.locations.getLocations(storeId);
    return locs.map(toSummary);
  }

  async create(data: CreatePickupLocationInput): Promise<PickupLocationSummary> {
    const loc = await this.locations.saveLocation({
      storeId: data.storeId,
      name: data.name,
      address: data.address,
      prepareTimeMinutes: data.prepareTimeMinutes,
    });
    return toSummary(loc);
  }

  async update(id: string, data: UpdatePickupLocationInput): Promise<PickupLocationSummary | null> {
    const loc = await this.locations.updateLocation(id, {
      name: data.name,
      address: data.address,
      isActive: data.isActive,
    });
    return loc ? toSummary(loc) : null;
  }

  async delete(id: string): Promise<boolean> {
    return this.locations.deleteLocation(id);
  }
}
