import { ALL_CAPABILITY_KEYS, MarketCapabilities } from './MarketCapabilities';

describe('store/domain/MarketCapabilities', () => {
  it('should default every capability to false when created empty', () => {
    const caps = MarketCapabilities.create();
    for (const key of ALL_CAPABILITY_KEYS) {
      expect(caps.supports(key)).toBe(false);
    }
  });

  it('should report true for explicitly enabled capabilities', () => {
    const caps = MarketCapabilities.create({ supports_pickup: true, supports_cod: true });
    expect(caps.supports('supports_pickup')).toBe(true);
    expect(caps.supports('supports_cod')).toBe(true);
    expect(caps.supports('supports_guest_checkout')).toBe(false);
  });

  it('should return a deterministic boolean for unlisted keys', () => {
    const caps = MarketCapabilities.create();
    expect(caps.supports('supports_cross_border')).toBe(false);
  });

  it('should expose all capabilities when created via all()', () => {
    const caps = MarketCapabilities.all();
    for (const key of ALL_CAPABILITY_KEYS) {
      expect(caps.supports(key)).toBe(true);
    }
  });

  it('should expose no capabilities when created via none()', () => {
    const caps = MarketCapabilities.none();
    expect(caps.supportedKeys()).toEqual([]);
  });

  it('should let a channel override disable a market capability', () => {
    const caps = MarketCapabilities.create({ supports_pickup: true, supports_cod: true });
    const narrowed = caps.mergeWithChannelOverrides({ supports_pickup: false });
    expect(narrowed.supports('supports_pickup')).toBe(false);
    expect(narrowed.supports('supports_cod')).toBe(true);
  });

  it('should not let a channel override re-enable a capability the market does not support', () => {
    const caps = MarketCapabilities.create({ supports_pickup: false });
    const merged = caps.mergeWithChannelOverrides({ supports_pickup: true });
    expect(merged.supports('supports_pickup')).toBe(false);
  });

  it('should narrow by platform gates when a feature is globally off', () => {
    const caps = MarketCapabilities.create({ supports_subscriptions: true, supports_cod: true });
    const narrowed = caps.narrowBy({ supports_subscriptions: false });
    expect(narrowed.supports('supports_subscriptions')).toBe(false);
    expect(narrowed.supports('supports_cod')).toBe(true);
  });

  it('should serialize to a plain map', () => {
    const caps = MarketCapabilities.create({ supports_pickup: true });
    const map = caps.toMap();
    expect(map.supports_pickup).toBe(true);
    expect(map.supports_cod).toBe(false);
  });
});
