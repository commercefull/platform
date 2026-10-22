/**
 * CommerceContext — Shared Kernel
 *
 * The four orthogonal contexts that describe every commerce interaction.
 * Replaces the country/store/locale/currency coupling where a single
 * `storeSlug` or `region` acted as the master switch.
 *
 * Admission criteria (mirrors `libs/money.ts`):
 * - No dependencies on `modules/*` or `web/*`, no I/O.
 * - Pure data types; resolution logic lives in `web/storefront/` and
 *   module use cases, not here.
 */

/** How the customer reads — never mutates market or currency. */
export interface CustomerContext {
  customerId?: string;
  /** BCP 47 locale, e.g. 'en-GB'. */
  locale: string;
  /** ISO 639-1 language, e.g. 'en'. */
  language: string;
  /** 'ltr' | 'rtl'. */
  textDirection: string;
  /** IANA timezone, e.g. 'Europe/Paris'. */
  timeZone?: string;
  /** Customer's stated currency preference (may differ from market default). */
  preferredCurrencyCode?: string;
  segmentIds?: string[];
}

/** Where the customer buys — defines allowed boundaries. */
export interface MarketContext {
  marketId?: string;
  /** Short market code, e.g. 'GB', 'EU-DE', 'US-DIGITAL'. */
  marketCode?: string;
  marketVersion?: number;
  storeId?: string;
  channelId?: string;
  catalogAssortmentId?: string;
  defaultPriceListId?: string;
  /** Locales this market permits (resolution boundary). */
  supportedLocaleCodes?: string[];
  /** Currencies this market permits (resolution boundary). */
  supportedCurrencyCodes?: string[];
  defaultCurrencyCode?: string;
  /** First-class capability map — `capabilities['supports_pickup']`, etc. */
  capabilities?: Record<string, boolean>;
}

/** The facts of this specific transaction. */
export interface TransactionContext {
  sellerOrganizationId?: string;
  sellerEntityId?: string;
  buyerCustomerId?: string;
  buyerType?: 'B2C' | 'B2B';
  /** Origin country for tax/shipping — resolved per fulfillment group. */
  shipFromCountry?: string;
  /** Destination country for tax/shipping/legal. */
  shipToCountry?: string;
  /** Billing country (digital goods VAT). */
  billToCountry?: string;
  /** Currency the customer browses in. */
  browsingCurrencyCode?: string;
  /** Currency the PSP charges in. */
  transactionCurrencyCode?: string;
  /** When the transaction occurs — needed for historical rate/policy lookup. */
  transactionTimestamp?: Date;
  incoterms?: string;
}

/** Which legal entity contracts and which jurisdictions apply. */
export interface LegalContext {
  contractingEntityId?: string;
  taxJurisdiction?: string;
  /** Privacy regime, e.g. 'EU_GDPR', 'UK_GDPR', 'US_CCPA', 'BR_LGPD', 'JP_APPI'. */
  privacyRegime?: string;
  termsVersion?: string;
  consentVersion?: string;
}

/** Composite context assembled once per request/use-case invocation. */
export interface CommerceContext {
  customer: CustomerContext;
  market: MarketContext;
  transaction: TransactionContext;
  legal: LegalContext;
}

/** Empty context — use-case defaults; callers fill what they resolved. */
export function emptyCommerceContext(): CommerceContext {
  return {
    customer: { locale: 'en-US', language: 'en', textDirection: 'ltr' },
    market: {},
    transaction: {},
    legal: {},
  };
}
