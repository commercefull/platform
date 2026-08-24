/**
 * Consolidated Store Data Repository
 *
 * Merges StoreRepo and pickupLocationRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Store (stores, pickup locations)
 */

import storeRepo from './StoreRepo';
import pickupLocationRepo from './pickupLocationRepo';

class StoreDataRepository {
  readonly stores = storeRepo;
  readonly pickupLocations = pickupLocationRepo;
}

export default new StoreDataRepository();
