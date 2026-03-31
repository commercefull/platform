import { UserStoreRepository } from '../../../domain/repositories/UserStoreRepository';

export interface ListStoreUsersOutput {
  userStoreId: string;
  userId: string;
  storeId: string;
  role: string;
  isPrimary: boolean;
  isActive: boolean;
  permissions: string[];
}

export class ListStoreUsersUseCase {
  constructor(private readonly userStoreRepository: UserStoreRepository) {}

  async execute(storeId: string): Promise<ListStoreUsersOutput[]> {
    const assignments = await this.userStoreRepository.findByStoreId(storeId);

    return assignments.map(assignment => ({
      userStoreId: assignment.userStoreId,
      userId: assignment.userId,
      storeId: assignment.storeId,
      role: assignment.role,
      isPrimary: assignment.isPrimary,
      isActive: assignment.isActive,
      permissions: assignment.permissions,
    }));
  }
}
