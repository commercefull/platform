import { eventBus } from '../../../../libs/events/eventBus';
import { StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';
import { StoreDispatchNotFoundError } from '../../domain/errors/InventoryErrors';

export class CancelStoreDispatchUseCase {
  constructor(private readonly dispatchRepository: StoreDispatchRepository) {}

  async execute(dispatchId: string, reason?: string): Promise<Record<string, unknown>> {
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    if (!dispatch) {
      throw new StoreDispatchNotFoundError(dispatchId);
    }

    dispatch.cancel(reason);
    const savedDispatch = await this.dispatchRepository.save(dispatch);

    eventBus.emit('inventory.dispatch.cancelled', {
      dispatchId: savedDispatch.dispatchId,
      reason,
    });

    return savedDispatch.toJSON();
  }
}
