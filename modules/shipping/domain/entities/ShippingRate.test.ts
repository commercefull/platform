import { ShippingRate } from './ShippingRate';

describe('ShippingRate domain entity', () => {
  const baseProps = {
    rateId: 'rate1',
    carrierId: 'carrier1',
    methodId: 'method1',
    name: 'Standard',
    calculationType: 'weight' as const,
    baseRateCents: 500,
    perUnitRate: 0.5,
    estimatedDaysMin: 3,
    estimatedDaysMax: 5,
  };

  describe('calculateRate — weight-based', () => {
    it('calculates base + perUnitRate * weight', () => {
      const rate = ShippingRate.create(baseProps);
      // 5 + 0.5 * 10 = 10
      expect(rate.calculateRate(10, 10000, 1)).toBe(1000);
    });

    it('returns 0 when subtotalCents meets freeShippingThreshold', () => {
      const rate = ShippingRate.create({ ...baseProps, freeShippingThresholdCents: 20000 });
      expect(rate.calculateRate(10, 25000, 1)).toBe(0);
    });

    it('returns base rate when subtotalCents is below freeShippingThreshold', () => {
      const rate = ShippingRate.create({ ...baseProps, freeShippingThresholdCents: 20000 });
      expect(rate.calculateRate(10, 10000, 1)).toBe(1000);
    });
  });

  describe('calculateRate — dimensional weight', () => {
    it('uses actual weight when no dim factor is set', () => {
      const rate = ShippingRate.create(baseProps);
      // 5 + 0.5 * 10 = 10 (volume ignored)
      expect(rate.calculateRate(10, 10000, 1, 5000)).toBe(1000);
    });

    it('uses dim weight when volume / dimFactor > actual weight', () => {
      const rate = ShippingRate.create({ ...baseProps, dimensionalFactor: 139 });
      // dimWeight = 5000 / 139 = 35.97
      // billableWeight = max(10, 35.97) = 35.97
      // rate = 5 + 0.5 * 35.97 = 22.985
      expect(rate.calculateRate(10, 10000, 1, 5000)).toBe(2299);
    });

    it('uses actual weight when actual > dim weight', () => {
      const rate = ShippingRate.create({ ...baseProps, dimensionalFactor: 139 });
      // dimWeight = 1000 / 139 = 7.19
      // billableWeight = max(50, 7.19) = 50
      // rate = 5 + 0.5 * 50 = 30
      expect(rate.calculateRate(50, 10000, 1, 1000)).toBe(3000);
    });

    it('ignores dim weight when volume is not provided', () => {
      const rate = ShippingRate.create({ ...baseProps, dimensionalFactor: 139 });
      // no volume → billableWeight = 10
      // rate = 5 + 0.5 * 10 = 10
      expect(rate.calculateRate(10, 10000, 1)).toBe(1000);
    });

    it('ignores dim weight when dimFactor is zero', () => {
      const rate = ShippingRate.create({ ...baseProps, dimensionalFactor: 0 });
      expect(rate.calculateRate(10, 10000, 1, 5000)).toBe(1000);
    });
  });

  describe('calculateRate — flat', () => {
    it('returns only base rate', () => {
      const rate = ShippingRate.create({ ...baseProps, calculationType: 'flat' });
      expect(rate.calculateRate(10, 10000, 1)).toBe(500);
    });
  });

  describe('calculateRate — quantity', () => {
    it('calculates base + perUnitRate * quantity', () => {
      const rate = ShippingRate.create({ ...baseProps, calculationType: 'quantity' });
      // 5 + 0.5 * 3 = 6.5
      expect(rate.calculateRate(10, 10000, 3)).toBe(650);
    });
  });

  describe('calculateRate — price', () => {
    it('calculates base + perUnitRate * (subtotalCents / 100)', () => {
      const rate = ShippingRate.create({ ...baseProps, calculationType: 'price' });
      // 5 + 0.5 * (200/100) = 6
      expect(rate.calculateRate(10, 20000, 1)).toBe(600);
    });
  });

  describe('isApplicable', () => {
    it('returns true for active rate with no constraints', () => {
      const rate = ShippingRate.create(baseProps);
      expect(rate.isApplicable(10, 10000)).toBe(true);
    });

    it('returns false when weight below minWeight', () => {
      const rate = ShippingRate.create({ ...baseProps, minWeight: 20 });
      expect(rate.isApplicable(10, 10000)).toBe(false);
    });

    it('returns false when weight above maxWeight', () => {
      const rate = ShippingRate.create({ ...baseProps, maxWeight: 5 });
      expect(rate.isApplicable(10, 10000)).toBe(false);
    });

    it('returns false when subtotalCents below minPriceCents', () => {
      const rate = ShippingRate.create({ ...baseProps, minPriceCents: 20000 });
      expect(rate.isApplicable(10, 10000)).toBe(false);
    });

    it('returns false when subtotalCents above maxPriceCents', () => {
      const rate = ShippingRate.create({ ...baseProps, maxPriceCents: 5000 });
      expect(rate.isApplicable(10, 10000)).toBe(false);
    });

    it('returns false when country not in countries list', () => {
      const rate = ShippingRate.create({ ...baseProps, countries: ['US', 'CA'] });
      expect(rate.isApplicable(10, 100, 'MX')).toBe(false);
      expect(rate.isApplicable(10, 100, 'US')).toBe(true);
    });
  });

  describe('accessors', () => {
    it('exposes rateId, name, baseRateCents, isActive, dimensionalFactor', () => {
      const rate = ShippingRate.create({ ...baseProps, dimensionalFactor: 139 });
      expect(rate.rateId).toBe('rate1');
      expect(rate.name).toBe('Standard');
      expect(rate.baseRateCents).toBe(500);
      expect(rate.isActive).toBe(true);
      expect(rate.dimensionalFactor).toBe(139);
    });
  });
});
