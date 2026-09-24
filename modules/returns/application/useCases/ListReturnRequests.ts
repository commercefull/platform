import { ReturnRequest } from '../../domain/entities/ReturnRequest';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';

export class ListReturnRequestsUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(status?: string, limit?: number, offset?: number): Promise<ReturnRequest[]> {
    if (status) {
      return this.returnRepo.findByStatus(status as never, limit, offset);
    }
    return this.returnRepo.findPending(limit);
  }
}

