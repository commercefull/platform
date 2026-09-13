import type { IAdminOperationsRepository } from '../../domain/repositories/AdminOperationsRepository';
import { fulfillmentDataRepository } from '../wired';

const adminOperationsRepo: IAdminOperationsRepository = fulfillmentDataRepository.admin;

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
