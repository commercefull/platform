import { generateUUID } from '../../../../../libs/uuid';
import { UserStoreAssignment, StoreRole } from '../../../domain/entities/UserStoreAssignment';
import { StoreUserRepository } from '../../../domain/repositories/StoreUserRepository';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { StoreLookupPort } from '../../ports/StoreLookupPort';
import { UserNotFoundError, StoreNotFoundError, UserAlreadyAssignedToStoreError } from '../../../domain/errors/IdentityErrors';

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
    private readonly userStoreRepository: StoreUserRepository,
    private readonly userRepository: UserRepository,
    private readonly storeLookupPort: StoreLookupPort,
  ) {}

  async execute(input: AssignUserToStoreInput): Promise<AssignUserToStoreOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const store = await this.storeLookupPort.findById(input.storeId);
    if (!store) {
      throw new StoreNotFoundError();
    }

    const existing = await this.userStoreRepository.findByUserAndStore(input.userId, input.storeId);
    if (existing) {
      throw new UserAlreadyAssignedToStoreError();
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
