import gdprDataRepository from '../../infrastructure/repositories/GdprDataRepository';

const adminGdprRepo = gdprDataRepository.admin;
const gdprDataRequestRepo = gdprDataRepository.dataRequests;

export class ManageAdminGdprUseCase {
  async getGdprStats() {
    return adminGdprRepo.getGdprStats();
  }
  async getConsentStats() {
    return adminGdprRepo.getConsentStats();
  }
  async findRecentRequests(limit?: number) {
    return adminGdprRepo.findRecentRequests(limit);
  }
  async findRequestById(requestId: string) {
    return adminGdprRepo.findRequestById(requestId);
  }
  async findCustomerIdByEmail(email: string) {
    return adminGdprRepo.findCustomerIdByEmail(email);
  }
  async createRequest(params: Parameters<typeof adminGdprRepo.createRequest>[0]) {
    return adminGdprRepo.createRequest(params);
  }
  async updateStatus(requestId: string, status: string) {
    return adminGdprRepo.updateStatus(requestId, status);
  }
  async completeRequest(requestId: string, notes?: string) {
    return adminGdprRepo.completeRequest(requestId, notes);
  }
}

export class ManageGdprRequestsUseCase {
  async findById(id: string) {
    return gdprDataRequestRepo.findById(id);
  }
  async findByCustomerId(customerId: string) {
    return gdprDataRequestRepo.findByCustomerId(customerId);
  }
  async findAll(filters?: Parameters<typeof gdprDataRequestRepo.findAll>[0], pagination?: Parameters<typeof gdprDataRequestRepo.findAll>[1]) {
    return gdprDataRequestRepo.findAll(filters, pagination);
  }
  async save(request: Parameters<typeof gdprDataRequestRepo.save>[0]) {
    return gdprDataRequestRepo.save(request);
  }
}
