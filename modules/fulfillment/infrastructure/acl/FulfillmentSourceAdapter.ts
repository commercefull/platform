/**
 * Fulfillment Source Adapter (ACL)
 *
 * Implements the fulfillment-domain source port by querying the store and
 * warehouse modules, translating their entities into the records the
 * planning use case consumes.
 */

import StoreRepo from '../../../store/infrastructure/repositories/StoreRepo';
import WarehouseRepo from '../../../warehouse/infrastructure/repositories/warehouseRepo';
import type { Store } from '../../../store/domain/entities/Store';
import {
  FulfillmentSourcePort,
  FulfillableStore,
  FulfillmentWarehouse,
} from '../../domain/repositories/FulfillmentSourceRepository';

function toFulfillableStore(store: Store): FulfillableStore {
  return {
    storeId: store.storeId,
    name: store.name,
    address: store.address,
    settings: {
      allowOnlineOrdering: store.settings?.allowGuestCheckout,
      pickup: store.settings?.pickup ? { enabled: store.settings.pickup.enabled } : undefined,
      localDelivery: store.settings?.localDelivery ? { enabled: store.settings.localDelivery.enabled } : undefined,
    },
    priority: store.isHeadquarters ? 0 : undefined,
  };
}

export class FulfillmentSourceAdapter implements FulfillmentSourcePort {
  async findFulfillableStores(): Promise<FulfillableStore[]> {
    const stores = await StoreRepo.findActive();
    return stores.map(toFulfillableStore);
  }

  async findDefaultWarehouse(): Promise<FulfillmentWarehouse | null> {
    const warehouse = await WarehouseRepo.findDefault();
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
