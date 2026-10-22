/**
 * ManageMarkets Use Case
 * CRUD for the Market aggregate — create, update, get, list, delete.
 * Launch/readiness flows live in EvaluateMarketReadiness and LaunchMarket.
 */

import { MarketRepository, MarketListFilter } from '../../domain/repositories/MarketRepository';
import { Market, MarketStatus, MarketTaxDisplayMode } from '../../domain/entities/Market';
import type { MarketCapabilityMap } from '../../domain/entities/MarketCapabilities';
import { MarketCodeAlreadyExistsError, MarketNotFoundError, MarketValidationError } from '../../domain/errors/StoreErrors';
import { generateUUID } from '../../../../libs/uuid';

// ============================================================================
// Commands
// ============================================================================

export interface MarketWriteData {
  storeId?: string;
  code: string;
  name: string;
  countryCodes?: string[];
  defaultCurrencyCode?: string;
  supportedCurrencyCodes?: string[];
  defaultLocaleCode?: string;
  supportedLocaleCodes?: string[];
  catalogAssortmentId?: string;
  defaultPriceListId?: string;
  contractingEntityId?: string;
  taxDisplayMode?: MarketTaxDisplayMode;
  allowDynamicFxConversion?: boolean;
  capabilities?: MarketCapabilityMap;
  allowedPaymentMethods?: string[];
  allowedFulfillmentMethods?: string[];
  hostnamePatterns?: string[];
  metadata?: Record<string, unknown>;
}

export class CreateMarketCommand {
  constructor(
    public readonly organizationId: string,
    public readonly marketData: MarketWriteData,
  ) {}
}

export class UpdateMarketCommand {
  constructor(
    public readonly marketId: string,
    public readonly marketData: Partial<MarketWriteData>,
  ) {}
}

export class GetMarketCommand {
  constructor(public readonly marketId: string) {}
}

export class ListMarketsCommand {
  constructor(public readonly filter?: MarketListFilter) {}
}

export class DeleteMarketCommand {
  constructor(public readonly marketId: string) {}
}

export class SetMarketStatusCommand {
  constructor(
    public readonly marketId: string,
    public readonly action: 'disable',
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface MarketResponse {
  marketId: string;
  organizationId: string;
  storeId?: string;
  code: string;
  name: string;
  status: MarketStatus;
  version: number;
  countryCodes: string[];
  defaultCurrencyCode: string;
  supportedCurrencyCodes: string[];
  defaultLocaleCode: string;
  supportedLocaleCodes: string[];
  catalogAssortmentId?: string;
  defaultPriceListId?: string;
  contractingEntityId?: string;
  taxDisplayMode: MarketTaxDisplayMode;
  allowDynamicFxConversion: boolean;
  capabilities: MarketCapabilityMap;
  allowedPaymentMethods: string[];
  allowedFulfillmentMethods: string[];
  hostnamePatterns: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function toResponse(market: Market): MarketResponse {
  return {
    marketId: market.marketId,
    organizationId: market.organizationId,
    storeId: market.storeId,
    code: market.code,
    name: market.name,
    status: market.status,
    version: market.version,
    countryCodes: market.countryCodes,
    defaultCurrencyCode: market.defaultCurrencyCode,
    supportedCurrencyCodes: market.supportedCurrencyCodes,
    defaultLocaleCode: market.defaultLocaleCode,
    supportedLocaleCodes: market.supportedLocaleCodes,
    catalogAssortmentId: market.catalogAssortmentId,
    defaultPriceListId: market.defaultPriceListId,
    contractingEntityId: market.contractingEntityId,
    taxDisplayMode: market.taxDisplayMode,
    allowDynamicFxConversion: market.allowDynamicFxConversion,
    capabilities: market.capabilities.toMap(),
    allowedPaymentMethods: market.allowedPaymentMethods,
    allowedFulfillmentMethods: market.allowedFulfillmentMethods,
    hostnamePatterns: market.hostnamePatterns,
    metadata: market.metadata,
    createdAt: market.createdAt.toISOString(),
    updatedAt: market.updatedAt.toISOString(),
  };
}

// ============================================================================
// Use Case
// ============================================================================

export class ManageMarketsUseCase {
  constructor(private readonly marketRepository: MarketRepository) {}

  async create(command: CreateMarketCommand): Promise<MarketResponse> {
    const code = command.marketData.code?.trim().toUpperCase();
    if (!code) throw new MarketValidationError('Market code is required.');

    const existing = await this.marketRepository.findByCode(command.organizationId, code);
    if (existing) throw new MarketCodeAlreadyExistsError(code);

    const market = Market.create({
      marketId: generateUUID(),
      organizationId: command.organizationId,
      storeId: command.marketData.storeId,
      code,
      name: command.marketData.name,
      countryCodes: command.marketData.countryCodes,
      defaultCurrencyCode: command.marketData.defaultCurrencyCode,
      supportedCurrencyCodes: command.marketData.supportedCurrencyCodes,
      defaultLocaleCode: command.marketData.defaultLocaleCode,
      supportedLocaleCodes: command.marketData.supportedLocaleCodes,
      catalogAssortmentId: command.marketData.catalogAssortmentId,
      defaultPriceListId: command.marketData.defaultPriceListId,
      contractingEntityId: command.marketData.contractingEntityId,
      taxDisplayMode: command.marketData.taxDisplayMode,
      allowDynamicFxConversion: command.marketData.allowDynamicFxConversion,
      capabilities: command.marketData.capabilities,
      allowedPaymentMethods: command.marketData.allowedPaymentMethods,
      allowedFulfillmentMethods: command.marketData.allowedFulfillmentMethods,
      hostnamePatterns: command.marketData.hostnamePatterns,
      metadata: command.marketData.metadata,
    });

    await this.marketRepository.save(market);
    return toResponse(market);
  }

  async update(command: UpdateMarketCommand): Promise<MarketResponse> {
    const market = await this.marketRepository.findById(command.marketId);
    if (!market) throw new MarketNotFoundError(command.marketId);

    if (command.marketData.code && command.marketData.code.trim().toUpperCase() !== market.code) {
      const code = command.marketData.code.trim().toUpperCase();
      const existing = await this.marketRepository.findByCode(market.organizationId, code);
      if (existing && existing.marketId !== market.marketId) {
        throw new MarketCodeAlreadyExistsError(code);
      }
    }

    const { code: _code, ...updates } = command.marketData;
    market.updateConfiguration(updates);
    market.incrementVersion();
    await this.marketRepository.update(market);
    return toResponse(market);
  }

  async get(command: GetMarketCommand): Promise<MarketResponse> {
    const market = await this.marketRepository.findById(command.marketId);
    if (!market) throw new MarketNotFoundError(command.marketId);
    return toResponse(market);
  }

  async list(command: ListMarketsCommand): Promise<MarketResponse[]> {
    const markets = await this.marketRepository.list(command.filter);
    return markets.map(toResponse);
  }

  async delete(command: DeleteMarketCommand): Promise<void> {
    const market = await this.marketRepository.findById(command.marketId);
    if (!market) throw new MarketNotFoundError(command.marketId);
    if (market.isActive) {
      throw new MarketValidationError('Active markets cannot be deleted — disable the market first.');
    }
    await this.marketRepository.delete(command.marketId);
  }

  async disable(command: SetMarketStatusCommand): Promise<MarketResponse> {
    const market = await this.marketRepository.findById(command.marketId);
    if (!market) throw new MarketNotFoundError(command.marketId);
    market.disable();
    await this.marketRepository.update(market);
    return toResponse(market);
  }
}
