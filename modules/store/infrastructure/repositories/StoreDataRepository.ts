/**
 * Consolidated Store Data Repository
 *
 * Merges StoreRepo and pickupLocationRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Store (stores, pickup locations)
 */

import storeRepo from './StoreRepo';
import storeCurrencyRepo from './StoreCurrencyRepo';
import pickupLocationRepo from './pickupLocationRepo';
import salesChannelRepo from './SalesChannelRepo';

class StoreDataRepository {
  readonly stores = storeRepo;
  readonly currencies = storeCurrencyRepo;
  readonly pickupLocations = pickupLocationRepo;
  readonly salesChannels = salesChannelRepo;
}

export default new StoreDataRepository();
