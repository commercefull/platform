import { ReturnRequest } from '../../domain/entities/ReturnRequest';
import { ReturnNotFoundError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { eventBus } from '../../../../libs/events/eventBus';

export class CompleteReturnInspectionUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string, passedItems?: Record<string, unknown>, failedItems?: Record<string, unknown>): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);

    returnRequest.completeInspection(passedItems, failedItems);
    const updated = await this.returnRepo.update(returnRequest);
    if (!updated) throw new ReturnNotFoundError(returnId);

    eventBus.emit('return.inspected', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
      passedItems,
      failedItems,
    });

    return updated;
  }
}

