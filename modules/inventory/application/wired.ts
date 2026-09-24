import inventoryDataRepository from '../infrastructure/repositories/InventoryDataRepository';
import storeDispatchRepository from '../infrastructure/repositories/StoreDispatchAggregateRepository';
import { StorePickupLocationAdapter } from '../infrastructure/acl/StorePickupLocationAdapter';
import { inventoryAllocationRuleRepo } from '../infrastructure';
import * as pickupLocationRepo from '../../store/infrastructure/repositories/pickupLocationRepo';

export const pickupLocationAdapter = new StorePickupLocationAdapter(pickupLocationRepo);

export { inventoryDataRepository, storeDispatchRepository };

export { inventoryAllocationRuleRepo };
