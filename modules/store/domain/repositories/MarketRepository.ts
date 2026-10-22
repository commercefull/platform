import { Market, MarketStatus } from '../entities/Market';

/** Query filter for listing markets. */
export interface MarketListFilter {
  organizationId?: string;
  status?: MarketStatus;
  storeId?: string;
  /** Markets that serve this ISO country code. */
  countryCode?: string;
}

/**
 * MarketRepository — domain port for `Market` persistence.
 * Implemented by `infrastructure/repositories/MarketRepo.ts`.
 */
export interface MarketRepository {
  save(market: Market): Promise<void>;
  update(market: Market): Promise<void>;
  findById(marketId: string): Promise<Market | null>;
  findByCode(organizationId: string, code: string): Promise<Market | null>;
  findByHostname(hostname: string): Promise<Market | null>;
  findByStoreId(storeId: string): Promise<Market[]>;
  list(filter?: MarketListFilter): Promise<Market[]>;
  delete(marketId: string): Promise<void>;
}
