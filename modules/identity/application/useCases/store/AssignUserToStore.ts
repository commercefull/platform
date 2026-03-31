import { generateUUID } from '../../../../../libs/uuid';
import { UserStoreAssignment, StoreRole } from '../../../domain/entities/UserStoreAssignment';
import { UserStoreRepository } from '../../../domain/repositories/UserStoreRepository';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { StoreRepository } from '../../../../store/domain/repositories/StoreRepository';

export interface AssignUserToStoreInput {
  userId: string;
  storeId: string;
  role: StoreRole;
  isPrimary?: boolean;
  permissions?: string[];
}

export interface AssignUserToStoreOutput {
  userStoreId: string;
  userId: string;
  storeId: string;
  role: StoreRole;
  isPrimary: boolean;
  isActive: boolean;
  permissions: string[];
}

export class AssignUserToStoreUseCase {
  constructor(
    private readonly userStoreRepository: UserStoreRepository,
    private readonly userRepository: UserRepository,
    private readonly storeRepository: StoreRepository,
  ) {}

  async execute(input: AssignUserToStoreInput): Promise<AssignUserToStoreOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new Error('Store not found');
    }

    const existing = await this.userStoreRepository.findByUserAndStore(input.userId, input.storeId);
    if (existing) {
      throw new Error('User is already assigned to this store');
    }

    const assignment = UserStoreAssignment.create({
      userStoreId: generateUUID(),
      userId: input.userId,
      storeId: input.storeId,
      role: input.role,
      isPrimary: input.isPrimary,
      permissions: input.permissions,
    });

    const saved = await this.userStoreRepository.save(assignment);

    return {
      userStoreId: saved.userStoreId,
      userId: saved.userId,
      storeId: saved.storeId,
      role: saved.role,
      isPrimary: saved.isPrimary,
      isActive: saved.isActive,
      permissions: saved.permissions,
    };
  }
}
