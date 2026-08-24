import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { AssignUserToStoreUseCase } from '../../application/useCases/store/AssignUserToStore';
import { GetUserStoresUseCase } from '../../application/useCases/store/GetUserStores';
import { ListStoreUsersUseCase } from '../../application/useCases/store/ListStoreUsers';
import { RemoveUserFromStoreUseCase } from '../../application/useCases/store/RemoveUserFromStore';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { StoreLookupPort } from '../../application/ports/StoreLookupPort';
import identityDataRepository from '../../infrastructure/repositories/IdentityDataRepository';

const identityRepo = identityDataRepository.users;
import { StoreRole } from '../../domain/entities/UserStoreAssignment';

const fallbackUserRepository: Pick<UserRepository, 'findById'> = {
  async findById(userId: string) {
    return { userId } as Awaited<ReturnType<UserRepository['findById']>>;
  },
};

const fallbackStoreLookupPort: StoreLookupPort = {
  async findById(storeId: string) {
    return { storeId } as Awaited<ReturnType<StoreLookupPort['findById']>>;
  },
};

const assignUserToStoreUseCase = new AssignUserToStoreUseCase(
  identityRepo,
  fallbackUserRepository as UserRepository,
  fallbackStoreLookupPort,
);
const getUserStoresUseCase = new GetUserStoresUseCase(identityRepo);
const listStoreUsersUseCase = new ListStoreUsersUseCase(identityRepo);
const removeUserFromStoreUseCase = new RemoveUserFromStoreUseCase(identityRepo);

interface AssignUserBody {
  storeId: string;
  role: StoreRole;
  isPrimary?: boolean;
  permissions?: string[];
}

export const assignUserToStore = async (req: TypedRequest<Record<string, string>, unknown, AssignUserBody>, res: Response): Promise<void> => {
  const result = await assignUserToStoreUseCase.execute({
    userId: req.params.userId,
    storeId: req.body.storeId,
    role: req.body.role,
    isPrimary: req.body.isPrimary,
    permissions: req.body.permissions,
  });

  res.status(201).json({ success: true, data: result });
  
};

export const getUserStores = async (req: TypedRequest, res: Response): Promise<void> => {
  const result = await getUserStoresUseCase.execute(req.params.userId);
  res.json({ success: true, data: result });
  
};

export const listStoreUsers = async (req: TypedRequest, res: Response): Promise<void> => {
  const result = await listStoreUsersUseCase.execute(req.params.storeId);
  res.json({ success: true, data: result });
  
};

export const removeUserFromStore = async (req: TypedRequest, res: Response): Promise<void> => {
  await removeUserFromStoreUseCase.execute(req.params.userId, req.params.storeId);
  res.json({ success: true });
  
};
