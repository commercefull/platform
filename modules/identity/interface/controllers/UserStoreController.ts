import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { AssignUserToStoreUseCase } from '../../application/useCases/store/AssignUserToStore';
import { GetUserStoresUseCase } from '../../application/useCases/store/GetUserStores';
import { ListStoreUsersUseCase } from '../../application/useCases/store/ListStoreUsers';
import { RemoveUserFromStoreUseCase } from '../../application/useCases/store/RemoveUserFromStore';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { StoreRepository } from '../../../store/domain/repositories/StoreRepository';
import userStoreRepository from '../../infrastructure/repositories/StoreUserRepository';
import { StoreRole } from '../../domain/entities/UserStoreAssignment';

const fallbackUserRepository: Pick<UserRepository, 'findById'> = {
  async findById(userId: string) {
    return { userId } as Awaited<ReturnType<UserRepository['findById']>>;
  },
};

const fallbackStoreRepository: Pick<StoreRepository, 'findById'> = {
  async findById(storeId: string) {
    return { storeId } as Awaited<ReturnType<StoreRepository['findById']>>;
  },
};

const assignUserToStoreUseCase = new AssignUserToStoreUseCase(
  userStoreRepository,
  fallbackUserRepository as UserRepository,
  fallbackStoreRepository as StoreRepository,
);
const getUserStoresUseCase = new GetUserStoresUseCase(userStoreRepository);
const listStoreUsersUseCase = new ListStoreUsersUseCase(userStoreRepository);
const removeUserFromStoreUseCase = new RemoveUserFromStoreUseCase(userStoreRepository);

interface AssignUserBody {
  storeId: string;
  role: StoreRole;
  isPrimary?: boolean;
  permissions?: string[];
}

export const assignUserToStore = async (req: TypedRequest<Record<string, string>, unknown, AssignUserBody>, res: Response): Promise<void> => {
  try {
    const result = await assignUserToStoreUseCase.execute({
      userId: req.params.userId,
      storeId: req.body.storeId,
      role: req.body.role,
      isPrimary: req.body.isPrimary,
      permissions: req.body.permissions,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? (error as Error).message : 'Failed to assign user to store';
    res.status(400).json({ success: false, message });
  }
};

export const getUserStores = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await getUserStoresUseCase.execute(req.params.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? (error as Error).message : 'Failed to fetch user stores';
    res.status(400).json({ success: false, message });
  }
};

export const listStoreUsers = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await listStoreUsersUseCase.execute(req.params.storeId);
    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? (error as Error).message : 'Failed to fetch store users';
    res.status(400).json({ success: false, message });
  }
};

export const removeUserFromStore = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await removeUserFromStoreUseCase.execute(req.params.userId, req.params.storeId);
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? (error as Error).message : 'Failed to remove user from store';
    res.status(400).json({ success: false, message });
  }
};
