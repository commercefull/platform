/**
 * MarketCapabilities — First-Class Capability Map
 *
 * Replaces the scattered capability booleans (`SystemConfiguration.features`,
 * `Store.settings`, `paymentSettings.allowGuestCheckout`, inline country
 * checks) with a single queryable value object.
 *
 * Callers ask `capabilities.supports('supports_pickup')` instead of checking
 * `store.settings.pickup?.enabled` or a hardcoded country list. Channel-level
 * overrides merge on top of market-level defaults.
 */

export type MarketCapabilityKey =
  | 'supports_checkout'
  | 'supports_guest_checkout'
  | 'supports_online_fulfillment'
  | 'supports_pickup'
  | 'supports_curbside_pickup'
  | 'supports_local_delivery'
  | 'supports_returns'
  | 'supports_cod'
  | 'supports_gift_cards'
  | 'supports_gift_wrapping'
  | 'supports_subscriptions'
  | 'supports_marketplace'
  | 'supports_cross_border'
  | 'supports_digital_products'
  | 'supports_invoice_payment'
  | 'supports_b2b_quotes'
  | 'supports_loyalty'
  | 'supports_coupons'
  | 'supports_wishlist'
  | 'supports_product_reviews';

export type MarketCapabilityMap = Partial<Record<MarketCapabilityKey, boolean>>;

/**
 * The canonical set of capabilities every market resolves. Keys not present
 * in the map are treated as `false` (explicitly unsupported) so capability
 * checks are always deterministic — never `undefined`-ish.
 */
export const ALL_CAPABILITY_KEYS: MarketCapabilityKey[] = [
  'supports_checkout',
  'supports_guest_checkout',
  'supports_online_fulfillment',
  'supports_pickup',
  'supports_curbside_pickup',
  'supports_local_delivery',
  'supports_returns',
  'supports_cod',
  'supports_gift_cards',
  'supports_gift_wrapping',
  'supports_subscriptions',
  'supports_marketplace',
  'supports_cross_border',
  'supports_digital_products',
  'supports_invoice_payment',
  'supports_b2b_quotes',
  'supports_loyalty',
  'supports_coupons',
  'supports_wishlist',
  'supports_product_reviews',
];

export class MarketCapabilities {
  private readonly map: Record<MarketCapabilityKey, boolean>;

  private constructor(map: Record<MarketCapabilityKey, boolean>) {
    this.map = map;
  }

  /**
   * Build a `MarketCapabilities` from a partial map. Unlisted keys default
   * to `false`. Pass `defaults` to pre-seed a baseline (e.g. platform defaults).
   */
  static create(map: MarketCapabilityMap = {}, defaults: MarketCapabilityMap = {}): MarketCapabilities {
    const resolved = {} as Record<MarketCapabilityKey, boolean>;
    for (const key of ALL_CAPABILITY_KEYS) {
      resolved[key] = map[key] ?? defaults[key] ?? false;
    }
    return new MarketCapabilities(resolved);
  }

  /** All capabilities enabled (e.g. platform default for a mature market). */
  static all(): MarketCapabilities {
    return MarketCapabilities.create(Object.fromEntries(ALL_CAPABILITY_KEYS.map(k => [k, true])) as MarketCapabilityMap);
  }

  /** All capabilities disabled (e.g. a draft market that cannot sell yet). */
  static none(): MarketCapabilities {
    return MarketCapabilities.create();
  }

  /** Check a single capability. Never `undefined` — always boolean. */
  supports(key: MarketCapabilityKey): boolean {
    return this.map[key] ?? false;
  }

  /** All capabilities as a plain map (serialisation, EJS, API responses). */
  toMap(): Record<MarketCapabilityKey, boolean> {
    return { ...this.map };
  }

  /** List of supported capability keys (for UI/validation). */
  supportedKeys(): MarketCapabilityKey[] {
    return ALL_CAPABILITY_KEYS.filter(k => this.map[k]);
  }

  /**
   * Merge a channel- or store-level override map on top. An override of
   * `false` disables a market capability for that channel; `true` cannot
   * re-enable a capability the market itself does not support (market is
   * the authoritative boundary — a channel can only narrow, never widen).
   */
  mergeWithChannelOverrides(overrides: MarketCapabilityMap): MarketCapabilities {
    const merged = {} as Record<MarketCapabilityKey, boolean>;
    for (const key of ALL_CAPABILITY_KEYS) {
      // Channel can only narrow: override `false` wins; `true` is a no-op
      // unless the market itself supports the capability.
      merged[key] = overrides[key] === false ? false : this.map[key];
    }
    return new MarketCapabilities(merged);
  }

  /**
   * Narrow by platform-level gates (`SystemConfiguration.features`): a
   * capability is only supported when the platform also permits it.
   */
  narrowBy(platform: MarketCapabilityMap): MarketCapabilities {
    const narrowed = {} as Record<MarketCapabilityKey, boolean>;
    for (const key of ALL_CAPABILITY_KEYS) {
      narrowed[key] = this.map[key] && (platform[key] ?? true);
    }
    return new MarketCapabilities(narrowed);
  }
}
