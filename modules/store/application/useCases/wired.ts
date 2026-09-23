import storeDataRepository from '../../infrastructure/repositories/StoreDataRepository';

const storeRepo = storeDataRepository.stores;
import { ListStoresUseCase } from './ListStores';
import { GetStoreUseCase } from './GetStore';
import { CreateStoreUseCase } from './CreateStore';
import { UpdateStoreUseCase } from './UpdateStore';
import { SystemConfigAdapter } from '../../infrastructure/acl/SystemConfigAdapter';
import { OrganizationLookupAdapter } from '../../infrastructure/acl/OrganizationLookupAdapter';
import systemConfigurationRepo from '../../../configuration/infrastructure/repositories/SystemConfigurationRepo';
import organizationRepo from '../../../organization/infrastructure/repositories/organizationRepo';

export const listStoresUseCase = new ListStoresUseCase(storeRepo);
export const getStoreUseCase = new GetStoreUseCase(storeRepo);
export const organizationLookupAdapter = new OrganizationLookupAdapter(organizationRepo);
export const createStoreUseCase = new CreateStoreUseCase(
  storeRepo,
  new SystemConfigAdapter(systemConfigurationRepo),
  organizationLookupAdapter,
);
export const updateStoreUseCase = new UpdateStoreUseCase(storeRepo);

export class FindActiveStoresUseCase {
  async execute() {
    return storeRepo.findActive();
  }
}
