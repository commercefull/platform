/**
 * Currency Catalog Port
 *
 * Read-only currency lookups required by the pricing calculation pipeline.
 * Implemented by infrastructure (`currencyRepo`, optionally behind a cache)
 * and injected into use cases at the composition root.
 */

import { Currency } from '../currency';

export interface CurrencyCatalogPort {
  getByCode(code: string): Promise<Currency | null>;
  getDefault(): Promise<Currency | null>;
}
