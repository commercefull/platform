import fulfillmentDataRepository from '../../infrastructure/repositories/FulfillmentDataRepository';

const adminOperationsRepo = fulfillmentDataRepository.admin;

export class ManageOperationsUseCase {
  async getOperationsStats() {
    return adminOperationsRepo.getOperationsStats();
  }
  async findRecentFulfillments(limit?: number) {
    return adminOperationsRepo.findRecentFulfillments(limit);
  }
  async findWarehousesWithCounts() {
    return adminOperationsRepo.findWarehousesWithCounts();
  }
}
