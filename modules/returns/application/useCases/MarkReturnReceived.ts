import { ReturnRequest } from '../../domain/entities/ReturnRequest';
import { ReturnNotFoundError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { eventBus } from '../../../../libs/events/eventBus';

export class MarkReturnReceivedUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);

    returnRequest.markReceived();
    const updated = await this.returnRepo.update(returnRequest);
    if (!updated) throw new ReturnNotFoundError(returnId);

    eventBus.emit('return.received', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
    });

    return updated;
  }
}

