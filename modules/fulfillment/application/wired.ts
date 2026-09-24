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
import { PlanFulfillmentUseCase } from './useCases/PlanFulfillment';
import { FulfillmentSourceAdapter } from '../infrastructure/acl/FulfillmentSourceAdapter';
import { OrderRouter } from '../../order/domain/services/OrderRouter';
import StoreRepo from '../../store/infrastructure/repositories/StoreRepo';
import InventoryRepo from '../../inventory/infrastructure/repositories/inventoryRepo';

export const manageOperationsUseCase = new ManageOperationsUseCase(fulfillmentDataRepository.admin);

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
