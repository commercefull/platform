/**
 * StoreStoreContextAdapter
 *
 * ACL adapter implementing checkout's StoreContextPort on top of the
 * store module's GetStoreUseCase.
 */

import { StoreContextPort, StoreContext } from '../../application/ports/StoreContextPort';
import { GetStoreUseCase, GetStoreQuery } from '../../../store/application/useCases/GetStore';

export class StoreStoreContextAdapter implements StoreContextPort {
  constructor(private readonly getStoreUseCase: Pick<GetStoreUseCase, 'execute'>) {}

  async getStoreContext(storeId: string): Promise<StoreContext | null> {
    try {
      const response = await this.getStoreUseCase.execute(new GetStoreQuery(storeId));
      if (!response.store) return null;
      return {
        organizationId: response.store.organizationId,
        country: (response.store.address as Record<string, unknown> | undefined)?.country as string | undefined,
      };
    } catch {
      return null;
    }
  }
}
