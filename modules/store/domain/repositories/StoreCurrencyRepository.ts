/**
 * StoreCurrency Repository Interface
 * Store-scoped currency membership — which currencies a store supports.
 */

import { StoreCurrency } from '../entities/StoreCurrency';

export interface StoreCurrencyRepository {
  /** All currency memberships for a store (active and inactive), with codes resolved. */
  findByStore(storeId: string): Promise<StoreCurrency[]>;

  /** Active currency memberships only. */
  findActiveByStore(storeId: string): Promise<StoreCurrency[]>;

  /** The store's default currency membership. */
  findDefault(storeId: string): Promise<StoreCurrency | null>;

  /** Convenience: active currency codes for a store (e.g. ['USD', 'EUR']). */
  getSupportedCodes(storeId: string): Promise<string[]>;

  /** Convenience: the store's default currency code, or null when none is configured. */
  getDefaultCode(storeId: string): Promise<string | null>;

  /** Add a supported currency by ISO code. */
  add(storeId: string, currencyCode: string, options?: { isDefault?: boolean }): Promise<StoreCurrency>;

  /** Remove a supported currency by ISO code. */
  remove(storeId: string, currencyCode: string): Promise<void>;

  /** Mark one currency as the store default (clears the previous default). */
  setDefault(storeId: string, currencyCode: string): Promise<void>;

  /** Replace the store's supported currency set; exactly one code may be the default. */
  replaceAll(storeId: string, currencyCodes: string[], defaultCode?: string): Promise<void>;
}
