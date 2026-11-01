/**
 * ResolveMarketContext — Customer-facing Market Resolution
 *
 * Resolves the active `Market` for an inbound request (hostname → market via
 * `hostnamePatterns`) and returns the public-facing context the storefront
 * needs: currency/locale options, capability map, and tax display mode.
 */

import { Market } from '../../domain/entities/Market';
import { MarketNotFoundError } from '../../domain/errors/StoreErrors';
import { MarketRepository } from '../../domain/repositories/MarketRepository';

export class ResolveMarketContextCommand {
  constructor(
    public readonly hostname: string,
    /** Customer-selected overrides (cookie/query) — validated against the market. */
    public readonly currencyCode?: string,
    public readonly localeCode?: string,
  ) {}
}

export interface MarketContextResponse {
  marketId: string;
  code: string;
  name: string;
  countryCodes: string[];
  defaultCurrencyCode: string;
  supportedCurrencyCodes: string[];
  currencyCode: string;
  defaultLocaleCode: string;
  supportedLocaleCodes: string[];
  localeCode: string;
  taxDisplayMode: string;
  capabilities: Record<string, unknown>;
}

export class ResolveMarketContextUseCase {
  constructor(private readonly marketRepository: MarketRepository) {}

  async execute(command: ResolveMarketContextCommand): Promise<MarketContextResponse> {
    const market = await this.marketRepository.findByHostname(command.hostname);
    if (!market || !market.isActive) {
      throw new MarketNotFoundError(`No active market serves hostname '${command.hostname}'.`);
    }
    return this.toContext(market, command);
  }

  /** Resolve an explicit market by id (storefront market switcher). */
  async executeForMarket(marketId: string): Promise<MarketContextResponse> {
    const market = await this.marketRepository.findById(marketId);
    if (!market || !market.isActive) {
      throw new MarketNotFoundError(`Market '${marketId}' is not available.`);
    }
    return this.toContext(market);
  }

  private toContext(market: Market, command?: ResolveMarketContextCommand): MarketContextResponse {
    const currencyCode =
      command?.currencyCode && market.supportsCurrency(command.currencyCode)
        ? command.currencyCode.toUpperCase()
        : market.defaultCurrencyCode;
    const localeCode =
      command?.localeCode && market.supportsLocale(command.localeCode) ? command.localeCode : market.defaultLocaleCode;
    return {
      marketId: market.marketId,
      code: market.code,
      name: market.name,
      countryCodes: market.countryCodes,
      defaultCurrencyCode: market.defaultCurrencyCode,
      supportedCurrencyCodes: market.supportedCurrencyCodes,
      currencyCode,
      defaultLocaleCode: market.defaultLocaleCode,
      supportedLocaleCodes: market.supportedLocaleCodes,
      localeCode,
      taxDisplayMode: market.taxDisplayMode,
      capabilities: market.capabilities.toMap(),
    };
  }
}
