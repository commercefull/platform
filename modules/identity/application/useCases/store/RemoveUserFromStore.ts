import { StoreUserRepository } from '../../../domain/repositories/StoreUserRepository';
import { UserStoreAssignmentNotFoundError } from '../../../domain/errors/IdentityErrors';

export class RemoveUserFromStoreUseCase {
  constructor(private readonly userStoreRepository: StoreUserRepository) {}

  async execute(userId: string, storeId: string): Promise<void> {
    const assignment = await this.userStoreRepository.findByUserAndStore(userId, storeId);
    if (!assignment) {
      throw new UserStoreAssignmentNotFoundError();
    }

    await this.userStoreRepository.delete(assignment.userStoreId);
  }
}
