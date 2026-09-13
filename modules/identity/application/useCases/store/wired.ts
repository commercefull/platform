import { identityDataRepository } from '../../wired';
import storeDataRepository from '../../../../store/infrastructure/repositories/StoreDataRepository';

const identityRepo = identityDataRepository.users;
const storeRepo = storeDataRepository.stores;
import { ListStoreUsersUseCase } from './ListStoreUsers';
import { AssignUserToStoreUseCase } from './AssignUserToStore';
import { RemoveUserFromStoreUseCase } from './RemoveUserFromStore';
import { StoreLookupAdapter } from '../../../infrastructure/acl/StoreLookupAdapter';
import type { UserRepository } from '../../../domain/repositories/UserRepository';

export const listStoreUsersUseCase = new ListStoreUsersUseCase(identityRepo);
export const removeUserFromStoreUseCase = new RemoveUserFromStoreUseCase(identityRepo);
export const assignUserToStoreUseCase = new AssignUserToStoreUseCase(
  identityRepo,
  { findById: async (userId: string) => ({ userId }) } as unknown as UserRepository,
  new StoreLookupAdapter(storeRepo),
);
