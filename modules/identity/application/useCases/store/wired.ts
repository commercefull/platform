import identityDataRepository from '../../../infrastructure/repositories/IdentityDataRepository';
import storeDataRepository from '../../../../store/infrastructure/repositories/StoreDataRepository';

const identityRepo = identityDataRepository.users;
const storeRepo = storeDataRepository.stores;
import { ListStoreUsersUseCase } from './ListStoreUsers';
import { AssignUserToStoreUseCase } from './AssignUserToStore';
import { RemoveUserFromStoreUseCase } from './RemoveUserFromStore';
import { StoreLookupAdapter } from '../../../infrastructure/acl/StoreLookupAdapter';

export const listStoreUsersUseCase = new ListStoreUsersUseCase(identityRepo);
export const removeUserFromStoreUseCase = new RemoveUserFromStoreUseCase(identityRepo);
export const assignUserToStoreUseCase = new AssignUserToStoreUseCase(
  identityRepo,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { findById: async (userId: string) => ({ userId }) } as any,
  new StoreLookupAdapter(storeRepo),
);
