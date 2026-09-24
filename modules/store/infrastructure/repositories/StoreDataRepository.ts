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

class StoreDataRepository {
  readonly stores = storeRepo;
  readonly currencies = storeCurrencyRepo;
  readonly pickupLocations = pickupLocationRepo;
}

export default new StoreDataRepository();
