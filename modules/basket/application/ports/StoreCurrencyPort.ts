/**
 * StoreCurrencyPort
 *
 * ACL port owned by basket. A basket belongs to a store and can only be
 * priced in a currency that store supports. The store module provides the
 * implementation; basket never reads the storeCurrency table directly.
 */
export interface StoreCurrencyPort {
  /** Whether the store actively supports the given ISO currency code. */
  isSupported(storeId: string, currencyCode: string): Promise<boolean>;

  /** The store's default currency code, or null when the store has no currencies configured. */
  getDefaultCode(storeId: string): Promise<string | null>;
}
