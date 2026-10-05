/**
 * StoreSubscriptionStoreContextAdapter
 *
 * ACL adapter implementing subscription's SubscriptionStoreContextPort
 * on top of the store module's GetStoreUseCase — mirrors checkout's
 * StoreStoreContextAdapter.
 */

import { GetStoreUseCase, GetStoreQuery } from '../../../store/application/useCases/GetStore';
import type { SubscriptionStoreContext, SubscriptionStoreContextPort } from '../../application/ports/SubscriptionStoreContextPort';

export class StoreSubscriptionStoreContextAdapter implements SubscriptionStoreContextPort {
  constructor(private readonly getStoreUseCase: Pick<GetStoreUseCase, 'execute'>) {}

  async getStoreContext(storeId: string): Promise<SubscriptionStoreContext | null> {
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
