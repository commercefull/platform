import { ReturnRequest } from '../../domain/entities/ReturnRequest';
import { ReturnNotFoundError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';

export class GetReturnRequestUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);
    return returnRequest;
  }
}

