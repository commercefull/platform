import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { getStoreUseCase, manageSalesChannelsUseCase, manageMarketsUseCase, ListMarketsCommand } from '../../modules/store';
import type { MarketResponse } from '../../modules/store';
import { createCache } from '../../libs/cache';
import { createLocaleContext } from '../../libs/i18n';
import { getAddressFieldUiMetadata } from '../../libs/address';
import type { CommerceContext } from '../../libs/commerceContext';

/**
 * Store Resolution Middleware
 *
 * Resolves the active store for every storefront request and attaches it
 * to res.locals so that controllers, theme middleware, and EJS templates
 * can use it.
 *
 * Resolution order:
 * 1. Explicit `?store=` query param (admin preview / testing)
 * 2. Session-stored storeId (sticky after first resolution)
 * 3. Hostname mapping (uk.shop.example.com → 'uk', us.shop.example.com → 'us')
 * 4. Geo-IP via Cloudflare `CF-IPCountry` header or `x-forwarded-country`
 * 5. Default store slug from env `DEFAULT_STORE_SLUG` (fallback 'us')
 *
 * Sets res.locals:
 *   - store: the resolved Store DTO (from GetStoreUseCase) or null
 *   - storeId: resolved store ID
 *   - storeSlug: resolved store slug
 *   - currency: default currency for the store
 *   - locale: locale code for the store (en-GB / en-US)
 *   - region: region code (UK / US)
 *
 * Also persists to req.session for sticky resolution.
 */

interface StoreSession {
  storeId?: string;
  storeSlug?: string;
  currency?: string;
  locale?: string;
  region?: string;
  marketId?: string;
}

interface ResolvedStore {
  storeId: string;
  slug: string;
  defaultCurrency?: string;
  supportedCurrencies?: string[];
  countryCode?: string;
  defaultSalesChannelId?: string;
  settings?: Record<string, unknown>;
  channelSettings?: Record<string, unknown>;
}

// Hostname → store slug mapping (configurable via env)
const HOST_STORE_MAP: Record<string, string> = {
  'uk.shop': 'uk',
  'us.shop': 'us',
  'uk-store': 'uk',
  'us-store': 'us',
  uk: 'uk',
  us: 'us',
  'de.shop': 'enterprise-eu-de',
  'fr.shop': 'enterprise-eu-fr',
  'us-ny.shop': 'enterprise-us-ny',
  'us-ca.shop': 'enterprise-us-ca',
};

// Region → default locale + currency
const REGION_DEFAULTS: Record<string, { locale: string; currency: string }> = {
  GB: { locale: 'en-GB', currency: 'GBP' },
  US: { locale: 'en-US', currency: 'USD' },
  DE: { locale: 'de-DE', currency: 'EUR' },
  FR: { locale: 'fr-FR', currency: 'EUR' },
};

const DEFAULT_STORE_SLUG = process.env.DEFAULT_STORE_SLUG || 'us';
const DEFAULT_LOCALE = 'en-US';
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_REGION = 'US';

// Store records change rarely — a short TTL removes the per-request
// `store WHERE slug` lookup while keeping propagation bounded.
const storeBySlugCache = createCache<ResolvedStore | null>({ namespace: 'storefront:store', ttlMs: 30_000 });
const marketsCache = createCache<MarketResponse[]>({ namespace: 'storefront:markets', ttlMs: 30_000 });

/** Active markets for the deployment — the market table is the
 * configuration-driven replacement for HOST_STORE_MAP/REGION_DEFAULTS. */
async function listActiveMarkets(): Promise<MarketResponse[]> {
  return marketsCache.getOrSet('active', async () => {
    const markets = await manageMarketsUseCase.list(new ListMarketsCommand({ status: 'active' }));
    return markets;
  });
}

/** Match a market whose `hostnamePatterns` cover the request host. */
function marketForHostname(markets: MarketResponse[], host: string): MarketResponse | undefined {
  const normalized = host.toLowerCase().replace(/^www\./, '');
  return markets.find(m =>
    m.hostnamePatterns.some(pattern => {
      const p = pattern.toLowerCase();
      if (p === '*') return false; // wildcard '*' is a fallback, not a match
      return normalized === p || normalized.endsWith(`.${p}`) || normalized.startsWith(`${p}.`);
    }),
  );
}

/** Fallback market covering the geo-IP country. */
function marketForCountry(markets: MarketResponse[], country: string): MarketResponse | undefined {
  const upper = country.toUpperCase();
  return markets.find(m => m.countryCodes.includes(upper));
}

/**
 * Resolve store slug from hostname.
 * Matches the longest configured prefix.
 */
function resolveSlugFromHost(host: string): string | null {
  const normalized = host.toLowerCase().replace(/^www\./, '');
  // Exact match first
  if (HOST_STORE_MAP[normalized]) {
    return HOST_STORE_MAP[normalized];
  }
  // Prefix match (e.g. uk.shop.example.com → 'uk.shop')
  const sortedKeys = Object.keys(HOST_STORE_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (normalized.startsWith(key)) {
      return HOST_STORE_MAP[key];
    }
  }
  return null;
}

/**
 * Resolve region from request headers (Cloudflare / forwarded).
 */
function resolveRegionFromHeaders(req: HttpRequest): string | null {
  const cfCountry = req.headers['cf-ipcountry'] as string | undefined;
  if (cfCountry && cfCountry.length === 2) {
    return cfCountry;
  }
  const forwardedCountry = req.headers['x-forwarded-country'] as string | undefined;
  if (forwardedCountry && forwardedCountry.length === 2) {
    return forwardedCountry;
  }
  return null;
}

/**
 * Map region code to store slug.
 */
function regionToStoreSlug(region: string): string {
  const upper = region.toUpperCase();
  if (upper === 'GB' || upper === 'UK') return 'enterprise-uk';
  if (upper === 'DE') return 'enterprise-eu-de';
  if (upper === 'FR') return 'enterprise-eu-fr';
  return 'enterprise-us-digital';
}

/**
 * Resolve the store slug using the priority chain:
 * query param → session → hostname → geo-IP → default.
 */
function resolveStoreSlug(req: HttpRequest): string {
  const session = (req.session as unknown as { store?: StoreSession } | undefined)?.store;
  const queryStore = req.query.store as string | undefined;

  // 1. Explicit query param (highest priority — admin preview)
  if (queryStore && typeof queryStore === 'string') {
    return queryStore;
  }
  // 2. Session-stored slug (sticky resolution)
  if (session?.storeSlug) {
    return session.storeSlug;
  }
  // 3. Hostname mapping
  const hostSlug = resolveSlugFromHost(req.hostname || '');
  if (hostSlug) {
    return hostSlug;
  }
  // 4. Geo-IP fallback
  const region = resolveRegionFromHeaders(req);
  if (region) {
    return regionToStoreSlug(region);
  }
  // 5. Default
  return DEFAULT_STORE_SLUG;
}

/**
 * Determine region, locale, and currency from the resolved store slug.
 */
function resolveStoreLocale(slug: string, store: ResolvedStore | null): { region: string; locale: string; currency: string } {
  let region = store?.countryCode || DEFAULT_REGION;
  let locale = REGION_DEFAULTS[region]?.locale || DEFAULT_LOCALE;
  let currency = REGION_DEFAULTS[region]?.currency || DEFAULT_CURRENCY;

  if (slug === 'uk' || slug === 'enterprise-uk') {
    region = 'GB';
    locale = 'en-GB';
    currency = 'GBP';
  } else if (slug === 'us' || slug.startsWith('enterprise-us-')) {
    region = 'US';
    locale = 'en-US';
    currency = 'USD';
  } else {
    const regionDefaults = REGION_DEFAULTS[region];
    if (regionDefaults) {
      locale = regionDefaults.locale;
      currency = regionDefaults.currency;
    }
  }

  // Store- and channel-level localization defaults take precedence over
  // slug/region defaults; channel settings win over store settings.
  const configuredLocale = store?.channelSettings?.locale ?? store?.settings?.locale;
  if (typeof configuredLocale === 'string' && configuredLocale.length > 0) {
    locale = configuredLocale;
  }

  // Override currency from store if available
  if (store?.defaultCurrency) {
    currency = store.defaultCurrency;
  }

  return { region, locale, currency };
}

/**
 * Resolve the active market:
 * explicit `?market=` (code or id) → session → hostname patterns →
 * geo-IP country coverage → null (market-less deployments keep store logic).
 */
async function resolveMarket(req: HttpRequest, storeId?: string): Promise<MarketResponse | null> {
  const markets = await listActiveMarkets();
  if (markets.length === 0) return null;

  const session = (req.session as unknown as { store?: StoreSession } | undefined)?.store;
  const queryMarket = req.query.market as string | undefined;

  if (queryMarket) {
    const byKey = markets.find(m => m.marketId === queryMarket || m.code.toLowerCase() === queryMarket.toLowerCase());
    if (byKey) return byKey;
  }
  if (session?.marketId) {
    const sticky = markets.find(m => m.marketId === session.marketId);
    if (sticky) return sticky;
  }
  const byHost = marketForHostname(markets, req.hostname || '');
  if (byHost) return byHost;
  const region = resolveRegionFromHeaders(req);
  if (region) {
    const byCountry = marketForCountry(markets, region);
    if (byCountry) return byCountry;
  }
  if (storeId) {
    const byStore = markets.find(m => m.storeId === storeId);
    if (byStore) return byStore;
  }
  return null;
}

/**
 * Build the composite CommerceContext for the request — customer-facing
 * locale/language preferences layered over the resolved market.
 */
function buildCommerceContext(
  market: MarketResponse | null,
  locale: string,
  currency: string,
  region: string,
  store: ResolvedStore | null,
): CommerceContext {
  return {
    customer: { ...createLocaleContext(locale), preferredCurrencyCode: currency },
    market: market
      ? {
          marketId: market.marketId,
          marketCode: market.code,
          marketVersion: market.version,
          storeId: market.storeId ?? store?.storeId,
          channelId: store?.defaultSalesChannelId,
          catalogAssortmentId: market.catalogAssortmentId,
          defaultPriceListId: market.defaultPriceListId,
          supportedLocaleCodes: market.supportedLocaleCodes,
          supportedCurrencyCodes: market.supportedCurrencyCodes,
          defaultCurrencyCode: market.defaultCurrencyCode,
          capabilities: market.capabilities as Record<string, boolean>,
        }
      : { storeId: store?.storeId, channelId: store?.defaultSalesChannelId },
    transaction: {
      browsingCurrencyCode: currency,
      transactionCurrencyCode: currency,
      shipToCountry: region,
    },
    legal: {
      contractingEntityId: market?.contractingEntityId,
    },
  };
}

/**
 * Apply customer-selected currency/locale overrides — validated against the
 * market's supported sets so a French shopper can browse the EU market in
 * en-GB paying EUR without forking the market config.
 */
function applyMarketOverrides(market: MarketResponse, req: HttpRequest): { locale: string; currency: string } {
  const session = (req.session as unknown as { store?: StoreSession } | undefined)?.store;
  let locale = session?.locale && market.supportedLocaleCodes.includes(session.locale) ? session.locale : market.defaultLocaleCode;
  let currency =
    session?.currency && market.supportedCurrencyCodes.includes(session.currency) ? session.currency : market.defaultCurrencyCode;

  const queryLocale = req.query.locale as string | undefined;
  if (queryLocale && market.supportedLocaleCodes.includes(queryLocale)) locale = queryLocale;
  const queryCurrency = req.query.currency as string | undefined;
  if (queryCurrency && market.supportedCurrencyCodes.includes(queryCurrency)) currency = queryCurrency;

  return { locale, currency };
}

/**
 * Set default store context on res.locals (used on error fallback).
 */
function setDefaultLocals(res: HttpResponse): void {
  res.locals.store = null;
  res.locals.storeId = '';
  res.locals.channelId = '';
  res.locals.storeSlug = DEFAULT_STORE_SLUG;
  res.locals.currency = DEFAULT_CURRENCY;
  res.locals.locale = DEFAULT_LOCALE;
  res.locals.region = DEFAULT_REGION;
  res.locals.market = null;
  res.locals.commerceContext = buildCommerceContext(null, DEFAULT_LOCALE, DEFAULT_CURRENCY, DEFAULT_REGION, null);
  res.locals.addressMetadata = getAddressFieldUiMetadata();
  res.locals.marketCountries = [];
}

export async function resolveStore(req: HttpRequest, res: HttpResponse, next: HttpNext): Promise<void> {
  try {
    const storeSlug = resolveStoreSlug(req);

    // Fetch store (30s TTL — same slug is resolved on every storefront request)
    const store = await storeBySlugCache.getOrSet(storeSlug, async () => {
      const response = await getStoreUseCase.execute({ slug: storeSlug });
      if (!response.store) return null;
      const assignments = response.store.organizationId
        ? await manageSalesChannelsUseCase.listForStore(response.store.organizationId, response.store.storeId)
        : [];
      const defaultAssignment = assignments.find(assignment => assignment.isDefault && assignment.isActive);
      return {
        storeId: response.store.storeId,
        slug: response.store.slug,
        defaultCurrency: response.store.defaultCurrency,
        supportedCurrencies: response.store.supportedCurrencies,
        countryCode: response.store.address?.country as string | undefined,
        defaultSalesChannelId: defaultAssignment?.salesChannelId,
        settings: response.store.settings,
        channelSettings: defaultAssignment?.settings as Record<string, unknown> | undefined,
      };
    });

    const market = await resolveMarket(req, store?.storeId);
    const resolved = resolveStoreLocale(storeSlug, store);
    let { region, locale, currency } = resolved;

    // A resolved market owns locale/currency — the market's configured
    // defaults plus validated customer overrides replace the slug/region
    // defaults. Without a market, legacy store resolution applies unchanged.
    if (market) {
      const marketLocale = applyMarketOverrides(market, req);
      locale = marketLocale.locale;
      currency = marketLocale.currency;
      if (market.countryCodes.length > 0) region = market.countryCodes[0];
    }
    const storeId = store?.storeId || '';

    // Attach to res.locals for controllers and views
    res.locals.store = store;
    res.locals.storeId = storeId;
    res.locals.channelId = store?.defaultSalesChannelId || '';
    res.locals.storeSlug = storeSlug;
    res.locals.currency = currency;
    res.locals.locale = locale;
    res.locals.region = region;
    res.locals.market = market;
    res.locals.commerceContext = buildCommerceContext(market, locale, currency, region, store);
    // Market/locale switchers — only rendered when multiple options exist.
    res.locals.markets = await listActiveMarkets().catch(() => []);
    res.locals.marketCurrencies = market ? market.supportedCurrencyCodes : (store?.supportedCurrencies ?? []);
    res.locals.marketLocales = market ? market.supportedLocaleCodes : [];
    // Per-country address-field requirements for country-driven address forms.
    res.locals.addressMetadata = getAddressFieldUiMetadata();
    res.locals.marketCountries = market ? market.countryCodes : [];

    // Persist to session only for explicit ?store=/?market=/?locale=/?currency=
    // choices — hostname/geo/default resolution is deterministic, so writing
    // it would create a session row for every anonymous visitor.
    const session = req.session as unknown as { store?: StoreSession } | undefined;
    const explicitChoice =
      typeof req.query.store === 'string' ||
      typeof req.query.market === 'string' ||
      typeof req.query.locale === 'string' ||
      typeof req.query.currency === 'string';
    if (session && explicitChoice) {
      session.store = { storeId, storeSlug, currency, locale, region, marketId: market?.marketId };
    }
  } catch {
    // Fall back to defaults on any error — never block the request
    setDefaultLocals(res);
  }

  next();
}
