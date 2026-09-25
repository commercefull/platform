import inventoryDataRepository from '../infrastructure/repositories/InventoryDataRepository';
import storeDispatchRepository from '../infrastructure/repositories/StoreDispatchAggregateRepository';
import { StorePickupLocationAdapter } from '../infrastructure/acl/StorePickupLocationAdapter';
import { inventoryAllocationRuleRepo } from '../infrastructure';
import { AdjustStockUseCase } from './useCases/AdjustStock';
import * as pickupLocationRepo from '../../store/infrastructure/repositories/pickupLocationRepo';

export const pickupLocationAdapter = new StorePickupLocationAdapter(pickupLocationRepo);
export const adjustStockUseCase = new AdjustStockUseCase(inventoryDataRepository.stock);

export { inventoryDataRepository, storeDispatchRepository };

export { inventoryAllocationRuleRepo };
