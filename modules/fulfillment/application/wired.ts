import fulfillmentDataRepository from '../infrastructure/repositories/FulfillmentDataRepository';
import fulfillmentPartnerRepository from '../infrastructure/repositories/FulfillmentPartnerRepository';
import type {
  CreateFulfillmentLocationParams,
  UpdateFulfillmentLocationParams,
  FulfillmentPartner,
} from '../infrastructure/repositories/FulfillmentPartnerRepository';

export {
  fulfillmentDataRepository,
  fulfillmentPartnerRepository,
  CreateFulfillmentLocationParams,
  UpdateFulfillmentLocationParams,
  FulfillmentPartner,
};

import { ManageOperationsUseCase } from './useCases/ManageOperations';
import { ManageFulfillmentLocationsUseCase } from './useCases/ManageFulfillmentLocations';
import { PlanFulfillmentUseCase } from './useCases/PlanFulfillment';
import { FulfillmentSourceAdapter } from '../infrastructure/acl/FulfillmentSourceAdapter';
import { OrderRouter } from '../../order/domain/services/OrderRouter';
import StoreRepo from '../../store/infrastructure/repositories/StoreRepo';
import InventoryRepo from '../../inventory/infrastructure/repositories/inventoryRepo';

export const manageOperationsUseCase = new ManageOperationsUseCase(fulfillmentDataRepository.admin);
export const manageFulfillmentLocationsUseCase = new ManageFulfillmentLocationsUseCase(
  fulfillmentPartnerRepository.locations,
  fulfillmentPartnerRepository.partners,
);

const orderRouter = new OrderRouter(
  {
    findById: async (id: string) => {
      const store = await StoreRepo.findById(id);
      return store
        ? {
            storeId: store.storeId,
            name: store.name,
            canFulfillOnline: store.settings?.allowGuestCheckout ?? true,
            canPickupInStore: store.settings?.pickup?.enabled ?? false,
            localDeliveryEnabled: store.settings?.localDelivery?.enabled ?? false,
          }
        : null;
    },
  },
  {
    getAvailableQuantity: async (_storeId: string, productId: string, variantId?: string) => {
      const availability = await InventoryRepo.checkProductAvailability(productId, variantId, 1);
      return availability.totalAvailable;
    },
  },
);

export const planFulfillmentUseCase = new PlanFulfillmentUseCase(orderRouter, new FulfillmentSourceAdapter());

import { GetFulfillmentUseCase } from './useCases/GetFulfillment';
import { CreateFulfillmentUseCase } from './useCases/CreateFulfillment';
import { ShipOrderUseCase } from './useCases/ShipOrder';
import { MarkDeliveredUseCase } from './useCases/MarkDelivered';
import { CancelFulfillmentUseCase } from './useCases/CancelFulfillment';
import { UpdateTrackingUseCase } from './useCases/UpdateTracking';
import { ProcessPickingUseCase } from './useCases/ProcessPicking';
import { ProcessPackingUseCase } from './useCases/ProcessPacking';
import { InitiateReturnUseCase } from './useCases/InitiateReturn';
import { ManageFulfillmentsUseCase } from './useCases/ManageFulfillments';

export const getFulfillmentUseCase = new GetFulfillmentUseCase(fulfillmentDataRepository.fulfillments);
export const createFulfillmentUseCase = new CreateFulfillmentUseCase(fulfillmentDataRepository.fulfillments);
export const shipOrderUseCase = new ShipOrderUseCase(fulfillmentDataRepository.fulfillments);
export const markDeliveredUseCase = new MarkDeliveredUseCase(fulfillmentDataRepository.fulfillments);
export const cancelFulfillmentUseCase = new CancelFulfillmentUseCase(fulfillmentDataRepository.fulfillments);
export const updateTrackingUseCase = new UpdateTrackingUseCase(fulfillmentDataRepository.fulfillments);
export const processPickingUseCase = new ProcessPickingUseCase(fulfillmentDataRepository.fulfillments);
export const processPackingUseCase = new ProcessPackingUseCase(fulfillmentDataRepository.fulfillments);
export const initiateReturnUseCase = new InitiateReturnUseCase(fulfillmentDataRepository.fulfillments);
export const manageFulfillmentsUseCase = new ManageFulfillmentsUseCase(fulfillmentDataRepository.fulfillments);
