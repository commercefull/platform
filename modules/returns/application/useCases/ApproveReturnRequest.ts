import { ReturnRequest } from '../../domain/entities/ReturnRequest';
import { ReturnNotFoundError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { eventBus } from '../../../../libs/events/eventBus';

export class ApproveReturnRequestUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string, rmaNumber?: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);

    returnRequest.approve(rmaNumber);
    const updated = await this.returnRepo.update(returnRequest);
    if (!updated) throw new ReturnNotFoundError(returnId);

    eventBus.emit('return.approved', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
      orderId: updated.orderId,
      rmaNumber: updated.rmaNumber,
    });

    return updated;
  }
}

