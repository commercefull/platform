import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { getStoreUseCase, manageSalesChannelsUseCase } from '../../modules/store';
import { createCache } from '../../libs/cache';

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

    const { region, locale, currency } = resolveStoreLocale(storeSlug, store);
    const storeId = store?.storeId || '';

    // Attach to res.locals for controllers and views
    res.locals.store = store;
    res.locals.storeId = storeId;
    res.locals.channelId = store?.defaultSalesChannelId || '';
    res.locals.storeSlug = storeSlug;
    res.locals.currency = currency;
    res.locals.locale = locale;
    res.locals.region = region;

    // Persist to session only for an explicit ?store= choice — hostname/geo/
    // default resolution is deterministic, so writing it would create a
    // session row for every anonymous visitor (pure write churn).
    const session = req.session as unknown as { store?: StoreSession } | undefined;
    if (session && typeof req.query.store === 'string' && session.store?.storeSlug !== storeSlug) {
      session.store = { storeId, storeSlug, currency, locale, region };
    }
  } catch {
    // Fall back to defaults on any error — never block the request
    setDefaultLocals(res);
  }

  next();
}
