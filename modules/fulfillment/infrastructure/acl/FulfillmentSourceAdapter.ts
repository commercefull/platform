/**
 * Fulfillment Source Adapter (ACL)
 *
 * Implements the fulfillment-domain source port by querying the store and
 * warehouse modules, translating their entities into the records the
 * planning use case consumes.
 */

import type { StoreRepository } from '../../../store';
import type { WarehouseRepository } from '../../../warehouse';
import type { Store } from '../../../store/domain/entities/Store';
import { FulfillmentSourcePort, FulfillableStore, FulfillmentWarehouse } from '../../domain/repositories/FulfillmentSourceRepository';

function toFulfillableStore(store: Store): FulfillableStore {
  return {
    storeId: store.storeId,
    name: store.name,
    address: store.address,
    settings: {
      allowOnlineOrdering: store.settings?.fulfillment?.fulfillOnlineOrders ?? true,
      pickup: store.settings?.pickup ? { enabled: store.settings.pickup.enabled } : undefined,
      localDelivery: store.settings?.localDelivery ? { enabled: store.settings.localDelivery.enabled } : undefined,
    },
    priority: store.isHeadquarters ? 0 : undefined,
  };
}

export class FulfillmentSourceAdapter implements FulfillmentSourcePort {
  constructor(
    private readonly stores: Pick<StoreRepository, 'findActive'>,
    private readonly warehouses: Pick<WarehouseRepository, 'findDefault'>,
  ) {}

  async findFulfillableStores(): Promise<FulfillableStore[]> {
    const stores = await this.stores.findActive();
    return stores.map(toFulfillableStore);
  }

  async findDefaultWarehouse(): Promise<FulfillmentWarehouse | null> {
    const warehouse = await this.warehouses.findDefault();
    if (!warehouse) return null;
    return {
      distributionWarehouseId: warehouse.distributionWarehouseId,
      name: warehouse.name,
      addressLine1: warehouse.addressLine1,
      addressLine2: warehouse.addressLine2,
      city: warehouse.city,
      state: warehouse.state,
      postalCode: warehouse.postalCode,
      country: warehouse.country,
      phone: warehouse.phone,
      email: warehouse.email,
    };
  }
}
