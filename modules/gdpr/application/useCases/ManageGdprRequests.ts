import type {
  GdprDataRequestRepository,
  GdprRequestFilters,
} from '../../domain/repositories/GdprRepository';
import { GdprDataRequest } from '../../domain/entities/GdprDataRequest';
import { PaginationOptions } from 'libs/types/shared';

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
