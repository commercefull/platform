/**
 * Delete Store Use Case
 * Deletes a store and emits the store.deleted domain event
 */

import { StoreRepository } from '../../domain/repositories/StoreRepository';
import { eventBus } from '../../../../libs/events/eventBus';

export class DeleteStoreUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(storeId: string): Promise<void> {
    await this.storeRepository.delete(storeId);

    eventBus.emit('store.deleted', { storeId });
  }
}
