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

export const manageOperationsUseCase = new ManageOperationsUseCase(fulfillmentDataRepository.admin);
