import { UserStoreRepository } from '../../../domain/repositories/UserStoreRepository';

export interface GetUserStoresOutput {
  userStoreId: string;
  userId: string;
  storeId: string;
  role: string;
  isPrimary: boolean;
  isActive: boolean;
  permissions: string[];
}

export class GetUserStoresUseCase {
  constructor(private readonly userStoreRepository: UserStoreRepository) {}

  async execute(userId: string): Promise<GetUserStoresOutput[]> {
    const assignments = await this.userStoreRepository.findByUserId(userId);

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
