/**
 * StoreLookupAdapter
 *
 * ACL adapter bridging assortment's StoreLookupPort to the store module's
 * GetStoreUseCase — validates storeIds before assortment config attaches.
 */

import type { GetStoreUseCase } from '../../../store/application/useCases/GetStore';
import type { StoreLookupPort } from '../../application/ports/StoreLookupPort';

export class StoreLookupAdapter implements StoreLookupPort {
  constructor(private readonly getStore: Pick<GetStoreUseCase, 'execute'>) {}

  async storeExists(storeId: string): Promise<boolean> {
    const result = await this.getStore.execute({ storeId });
    return result.store !== null;
  }
}
