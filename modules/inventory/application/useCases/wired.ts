import storeDispatchRepository from '../../infrastructure/repositories/StoreDispatchAggregateRepository';
import inventoryDataRepository from '../../infrastructure/repositories/InventoryDataRepository';

const inventoryRepository = inventoryDataRepository.items;
const adminInventoryRepository = inventoryDataRepository.admin;
import { ListStoreDispatchesUseCase } from './ListStoreDispatches';
import { GetStoreDispatchUseCase } from './GetStoreDispatch';
import { CreateStoreDispatchUseCase } from './CreateStoreDispatch';
import { ApproveStoreDispatchUseCase } from './ApproveStoreDispatch';
import { DispatchFromStoreUseCase } from './DispatchFromStore';
import { ReceiveStoreDispatchUseCase } from './ReceiveStoreDispatch';
import { CancelStoreDispatchUseCase } from './CancelStoreDispatch';
import { GetDispatchesByStoreUseCase } from './GetDispatchesByStore';
import { ManageAdminInventoryUseCase } from './ManageAdminInventory';

export const listStoreDispatchesUseCase = new ListStoreDispatchesUseCase(storeDispatchRepository);
export const getStoreDispatchUseCase = new GetStoreDispatchUseCase(storeDispatchRepository);
export const createStoreDispatchUseCase = new CreateStoreDispatchUseCase(storeDispatchRepository, inventoryRepository);
export const approveStoreDispatchUseCase = new ApproveStoreDispatchUseCase(storeDispatchRepository, inventoryRepository);
export const dispatchFromStoreUseCase = new DispatchFromStoreUseCase(storeDispatchRepository, inventoryRepository);
export const receiveStoreDispatchUseCase = new ReceiveStoreDispatchUseCase(storeDispatchRepository, inventoryRepository);
export const cancelStoreDispatchUseCase = new CancelStoreDispatchUseCase(storeDispatchRepository);
export const getDispatchesByStoreUseCase = new GetDispatchesByStoreUseCase(storeDispatchRepository);
export const manageAdminInventoryUseCase = new ManageAdminInventoryUseCase(adminInventoryRepository);
