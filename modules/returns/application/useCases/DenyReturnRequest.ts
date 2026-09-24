import { ReturnRequest } from '../../domain/entities/ReturnRequest';
import { ReturnNotFoundError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { eventBus } from '../../../../libs/events/eventBus';

export class DenyReturnRequestUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string, reason?: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);

    returnRequest.deny(reason);
    const updated = await this.returnRepo.update(returnRequest);
    if (!updated) throw new ReturnNotFoundError(returnId);

    eventBus.emit('return.denied', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
      orderId: updated.orderId,
      reason,
    });

    return updated;
  }
}

