/**
 * StoreLookupAdapter
 *
 * ACL adapter implementing product's StoreLookupPort.
 * Translates store's StoreRepository into product's
 * StoreSummary vocabulary.
 *
 * Only this adapter may import from store's domain.
 */

import { StoreLookupPort, StoreSummary } from '../../application/ports/StoreLookupPort';
import { StoreRepository } from '../../../store/domain/repositories/StoreRepository';

export class StoreLookupAdapter implements StoreLookupPort {
  constructor(private readonly storeRepository: StoreRepository) {}

  async findById(storeId: string): Promise<StoreSummary | null> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) return null;
    return {
      storeId: store.storeId,
      organizationId: store.organizationId,
    };
  }
}
