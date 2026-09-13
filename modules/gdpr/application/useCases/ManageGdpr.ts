import {
  GdprDataRequestRepository,
  GdprRequestFilters,
  AdminGdprRepository,
  AdminGdprCreateRequestParams,
} from '../../domain/repositories/GdprRepository';
import { GdprDataRequest } from '../../domain/entities/GdprDataRequest';
import { PaginationOptions } from 'libs/types/shared';

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

export class ManageGdprRequestsUseCase {
  constructor(private readonly gdprDataRequestRepo: GdprDataRequestRepository) {}
  async findById(id: string) {
    return this.gdprDataRequestRepo.findById(id);
  }
  async findByCustomerId(customerId: string) {
    return this.gdprDataRequestRepo.findByCustomerId(customerId);
  }
  async findAll(
    filters?: GdprRequestFilters,
    pagination?: PaginationOptions,
  ) {
    return this.gdprDataRequestRepo.findAll(filters, pagination);
  }
  async save(request: GdprDataRequest) {
    return this.gdprDataRequestRepo.save(request);
  }
}
