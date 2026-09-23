import type {
  AdminGdprRepository,
  AdminGdprCreateRequestParams,
} from '../../domain/repositories/GdprRepository';

export class ManageAdminGdprUseCase {
  constructor(private readonly adminGdprRepo: AdminGdprRepository) {}
  async getGdprStats() {
    return this.adminGdprRepo.getGdprStats();
  }
  async getConsentStats() {
    return this.adminGdprRepo.getConsentStats();
  }
  async findRecentRequests(limit?: number) {
    return this.adminGdprRepo.findRecentRequests(limit);
  }
  async findRequestById(requestId: string) {
    return this.adminGdprRepo.findRequestById(requestId);
  }
  async findCustomerIdByEmail(email: string) {
    return this.adminGdprRepo.findCustomerIdByEmail(email);
  }
  async createRequest(params: AdminGdprCreateRequestParams) {
    return this.adminGdprRepo.createRequest(params);
  }
  async updateStatus(requestId: string, status: string) {
    return this.adminGdprRepo.updateStatus(requestId, status);
  }
  async completeRequest(requestId: string, notes?: string) {
    return this.adminGdprRepo.completeRequest(requestId, notes);
  }
}

