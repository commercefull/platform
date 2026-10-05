/**
 * AssortmentSellabilityAdapter
 *
 * ACL adapter implementing basket's SellabilityPort.
 * Delegates to assortment's CheckStoreSellabilityUseCase.
 *
 * Only this adapter may import from assortment's application layer.
 */

import { SellabilityPort } from '../../application/ports/SellabilityPort';
import {
  CheckStoreSellabilityCommand,
  type CheckStoreSellabilityUseCase,
} from '../../../assortment/application/useCases/CheckStoreSellability';
import { logger } from '../../../../libs/logger';

export class AssortmentSellabilityAdapter implements SellabilityPort {
  constructor(private readonly useCase: Pick<CheckStoreSellabilityUseCase, 'execute'>) {}

  async isSellable(storeId: string, productId: string, channelId?: string): Promise<boolean> {
    try {
      return await this.useCase.execute(new CheckStoreSellabilityCommand(storeId, productId, channelId));
    } catch (error: unknown) {
      // Fail open — sellability is a merchandising constraint; absence of
      // assortment data must not block purchases.
      logger.warn('Sellability check failed, allowing item', {
        storeId,
        productId,
        channelId,
        error: (error as Error).message,
      });
      return true;
    }
  }
}
