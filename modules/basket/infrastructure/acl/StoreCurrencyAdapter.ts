/**
 * StoreCurrencyAdapter
 *
 * ACL adapter implementing basket's StoreCurrencyPort by delegating to the
 * store module's currency membership repository.
 *
 * Only this adapter may import from the store module.
 */

import { storeDataRepository } from '../../../store/application/wired';
import type { StoreCurrencyPort } from '../../application/ports/StoreCurrencyPort';

export class StoreCurrencyAdapter implements StoreCurrencyPort {
  async isSupported(storeId: string, currencyCode: string): Promise<boolean> {
    const codes = await storeDataRepository.currencies.getSupportedCodes(storeId);
    return codes.includes(currencyCode);
  }

  async getDefaultCode(storeId: string): Promise<string | null> {
    return storeDataRepository.currencies.getDefaultCode(storeId);
  }
}
