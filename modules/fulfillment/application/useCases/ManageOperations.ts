import type { IAdminOperationsRepository } from '../../domain/repositories/AdminOperationsRepository';

export class ManageOperationsUseCase {
  constructor(private readonly adminOperationsRepo: IAdminOperationsRepository) {}

  async getOperationsStats() {
    return this.adminOperationsRepo.getOperationsStats();
  }
  async findRecentFulfillments(limit?: number) {
    return this.adminOperationsRepo.findRecentFulfillments(limit);
  }
  async findWarehousesWithCounts() {
    return this.adminOperationsRepo.findWarehousesWithCounts();
  }
}
