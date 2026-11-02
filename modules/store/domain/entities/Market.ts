/**
 * Market — Selling Market Aggregate
 *
 * A declaratively configured "where we sell" boundary: countries, currencies,
 * locales, catalog/price-list bindings, legal contracting entity, and
 * first-class capabilities. Replaces country- and store-slug-based switching
 * with a resolved `MarketContext`.
 *
 * A market is country-neutral: `countryCodes` is a list, not a master switch,
 * and a market may span multiple countries (e.g. `EU`) or one (`JP`).
 */

import { MarketCapabilities, MarketCapabilityKey, MarketCapabilityMap } from './MarketCapabilities';
import { MarketValidationError } from '../errors/StoreErrors';

export type MarketStatus = 'draft' | 'ready' | 'active' | 'disabled';
export type MarketTaxDisplayMode = 'inclusive_tax' | 'exclusive_tax';

export interface MarketProps {
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
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Market {
  private props: MarketProps;

  private constructor(props: MarketProps) {
    this.props = props;
  }

  static create(props: {
    marketId: string;
    organizationId: string;
    storeId?: string;
    code: string;
    name: string;
    status?: MarketStatus;
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
  }): Market {
    if (!props.code || props.code.trim().length === 0) {
      throw new MarketValidationError('Market code is required');
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new MarketValidationError('Market name is required');
    }
    const code = props.code.trim().toUpperCase();
    const defaultCurrencyCode = (props.defaultCurrencyCode ?? 'USD').toUpperCase();
    const supportedCurrencyCodes = normalizeCodes(props.supportedCurrencyCodes ?? [defaultCurrencyCode]);
    if (!supportedCurrencyCodes.includes(defaultCurrencyCode)) {
      throw new MarketValidationError(`Default currency ${defaultCurrencyCode} must be in supportedCurrencyCodes`);
    }
    const defaultLocaleCode = props.defaultLocaleCode ?? 'en-US';
    const supportedLocaleCodes = normalizeCodes(props.supportedLocaleCodes ?? [defaultLocaleCode], false);
    if (!supportedLocaleCodes.includes(defaultLocaleCode)) {
      throw new MarketValidationError(`Default locale ${defaultLocaleCode} must be in supportedLocaleCodes`);
    }
    const now = new Date();
    return new Market({
      marketId: props.marketId,
      organizationId: props.organizationId,
      storeId: props.storeId,
      code,
      name: props.name.trim(),
      status: props.status ?? 'draft',
      version: 1,
      countryCodes: normalizeCodes(props.countryCodes ?? [code]),
      defaultCurrencyCode,
      supportedCurrencyCodes,
      defaultLocaleCode,
      supportedLocaleCodes,
      catalogAssortmentId: props.catalogAssortmentId,
      defaultPriceListId: props.defaultPriceListId,
      contractingEntityId: props.contractingEntityId,
      taxDisplayMode: props.taxDisplayMode ?? 'exclusive_tax',
      allowDynamicFxConversion: props.allowDynamicFxConversion ?? false,
      capabilities: props.capabilities ?? {},
      allowedPaymentMethods: props.allowedPaymentMethods ?? [],
      allowedFulfillmentMethods: props.allowedFulfillmentMethods ?? [],
      hostnamePatterns: props.hostnamePatterns ?? [],
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: MarketProps): Market {
    return new Market(props);
  }

  get marketId(): string {
    return this.props.marketId;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get storeId(): string | undefined {
    return this.props.storeId;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get status(): MarketStatus {
    return this.props.status;
  }
  get version(): number {
    return this.props.version;
  }
  get countryCodes(): string[] {
    return [...this.props.countryCodes];
  }
  get defaultCurrencyCode(): string {
    return this.props.defaultCurrencyCode;
  }
  get supportedCurrencyCodes(): string[] {
    return [...this.props.supportedCurrencyCodes];
  }
  get defaultLocaleCode(): string {
    return this.props.defaultLocaleCode;
  }
  get supportedLocaleCodes(): string[] {
    return [...this.props.supportedLocaleCodes];
  }
  get catalogAssortmentId(): string | undefined {
    return this.props.catalogAssortmentId;
  }
  get defaultPriceListId(): string | undefined {
    return this.props.defaultPriceListId;
  }
  get contractingEntityId(): string | undefined {
    return this.props.contractingEntityId;
  }
  get taxDisplayMode(): MarketTaxDisplayMode {
    return this.props.taxDisplayMode;
  }
  get allowDynamicFxConversion(): boolean {
    return this.props.allowDynamicFxConversion;
  }
  get allowedPaymentMethods(): string[] {
    return [...this.props.allowedPaymentMethods];
  }
  get allowedFulfillmentMethods(): string[] {
    return [...this.props.allowedFulfillmentMethods];
  }
  get hostnamePatterns(): string[] {
    return [...this.props.hostnamePatterns];
  }
  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  /** Resolved capability value object. */
  get capabilities(): MarketCapabilities {
    return MarketCapabilities.create(this.props.capabilities);
  }

  supports(key: MarketCapabilityKey): boolean {
    return this.capabilities.supports(key);
  }

  supportsCountry(countryCode: string): boolean {
    return this.props.countryCodes.includes(countryCode.toUpperCase());
  }

  supportsCurrency(currencyCode: string): boolean {
    return this.props.supportedCurrencyCodes.includes(currencyCode.toUpperCase());
  }

  supportsLocale(localeCode: string): boolean {
    return this.props.supportedLocaleCodes.includes(localeCode);
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  updateConfiguration(
    updates: Partial<{
      name: string;
      storeId: string;
      countryCodes: string[];
      defaultCurrencyCode: string;
      supportedCurrencyCodes: string[];
      defaultLocaleCode: string;
      supportedLocaleCodes: string[];
      catalogAssortmentId: string;
      defaultPriceListId: string;
      contractingEntityId: string;
      taxDisplayMode: MarketTaxDisplayMode;
      allowDynamicFxConversion: boolean;
      capabilities: MarketCapabilityMap;
      allowedPaymentMethods: string[];
      allowedFulfillmentMethods: string[];
      hostnamePatterns: string[];
      metadata: Record<string, unknown>;
    }>,
  ): void {
    if (updates.name !== undefined) this.props.name = updates.name.trim();
    if (updates.storeId !== undefined) this.props.storeId = updates.storeId;
    if (updates.countryCodes !== undefined) this.props.countryCodes = normalizeCodes(updates.countryCodes);
    if (updates.supportedCurrencyCodes !== undefined) this.props.supportedCurrencyCodes = normalizeCodes(updates.supportedCurrencyCodes);
    if (updates.supportedLocaleCodes !== undefined) this.props.supportedLocaleCodes = normalizeCodes(updates.supportedLocaleCodes, false);
    if (updates.defaultCurrencyCode !== undefined) this.props.defaultCurrencyCode = updates.defaultCurrencyCode.toUpperCase();
    if (updates.defaultLocaleCode !== undefined) this.props.defaultLocaleCode = updates.defaultLocaleCode;
    if (updates.catalogAssortmentId !== undefined) this.props.catalogAssortmentId = updates.catalogAssortmentId;
    if (updates.defaultPriceListId !== undefined) this.props.defaultPriceListId = updates.defaultPriceListId;
    if (updates.contractingEntityId !== undefined) this.props.contractingEntityId = updates.contractingEntityId;
    if (updates.taxDisplayMode !== undefined) this.props.taxDisplayMode = updates.taxDisplayMode;
    if (updates.allowDynamicFxConversion !== undefined) this.props.allowDynamicFxConversion = updates.allowDynamicFxConversion;
    if (updates.capabilities !== undefined) this.props.capabilities = { ...this.props.capabilities, ...updates.capabilities };
    if (updates.allowedPaymentMethods !== undefined) this.props.allowedPaymentMethods = updates.allowedPaymentMethods;
    if (updates.allowedFulfillmentMethods !== undefined) this.props.allowedFulfillmentMethods = updates.allowedFulfillmentMethods;
    if (updates.hostnamePatterns !== undefined) this.props.hostnamePatterns = updates.hostnamePatterns;
    if (updates.metadata !== undefined) this.props.metadata = { ...this.props.metadata, ...updates.metadata };

    // Re-validate consistency after update.
    if (!this.props.supportedCurrencyCodes.includes(this.props.defaultCurrencyCode)) {
      throw new MarketValidationError(`Default currency ${this.props.defaultCurrencyCode} must be in supportedCurrencyCodes`);
    }
    if (!this.props.supportedLocaleCodes.includes(this.props.defaultLocaleCode)) {
      throw new MarketValidationError(`Default locale ${this.props.defaultLocaleCode} must be in supportedLocaleCodes`);
    }
    this.touch();
  }

  /** Activate the market (mark sellable). Increments version. */
  activate(): void {
    this.props.status = 'active';
    this.incrementVersion();
  }

  /** Mark ready for launch (all readiness checks passed). */
  markReady(): void {
    if (this.props.status === 'active') return;
    this.props.status = 'ready';
    this.touch();
  }

  disable(): void {
    this.props.status = 'disabled';
    this.touch();
  }

  /** Bump the version — any configuration or launch mutation. */
  incrementVersion(): void {
    this.props.version += 1;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      marketId: this.props.marketId,
      organizationId: this.props.organizationId,
      storeId: this.props.storeId,
      code: this.props.code,
      name: this.props.name,
      status: this.props.status,
      version: this.props.version,
      countryCodes: this.props.countryCodes,
      defaultCurrencyCode: this.props.defaultCurrencyCode,
      supportedCurrencyCodes: this.props.supportedCurrencyCodes,
      defaultLocaleCode: this.props.defaultLocaleCode,
      supportedLocaleCodes: this.props.supportedLocaleCodes,
      catalogAssortmentId: this.props.catalogAssortmentId,
      defaultPriceListId: this.props.defaultPriceListId,
      contractingEntityId: this.props.contractingEntityId,
      taxDisplayMode: this.props.taxDisplayMode,
      allowDynamicFxConversion: this.props.allowDynamicFxConversion,
      capabilities: this.capabilities.toMap(),
      allowedPaymentMethods: this.props.allowedPaymentMethods,
      allowedFulfillmentMethods: this.props.allowedFulfillmentMethods,
      hostnamePatterns: this.props.hostnamePatterns,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

function normalizeCodes(codes: string[], upper = true): string[] {
  return codes.map(c => (upper ? c.trim().toUpperCase() : c.trim())).filter(Boolean);
}
