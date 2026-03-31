import { UserStoreRepository } from '../../../domain/repositories/UserStoreRepository';

export class RemoveUserFromStoreUseCase {
  constructor(private readonly userStoreRepository: UserStoreRepository) {}

  async execute(userId: string, storeId: string): Promise<void> {
    const assignment = await this.userStoreRepository.findByUserAndStore(userId, storeId);
    if (!assignment) {
      throw new Error('User store assignment not found');
    }

    await this.userStoreRepository.delete(assignment.userStoreId);
  }
}
