import { ShippingRate } from './ShippingRate';

describe('ShippingRate domain entity', () => {
  const baseProps = {
    rateId: 'rate1',
    carrierId: 'carrier1',
    methodId: 'method1',
    name: 'Standard',
    calculationType: 'weight' as const,
    baseRate: 5,
    perUnitRate: 0.5,
    estimatedDaysMin: 3,
    estimatedDaysMax: 5,
  };

  describe('calculateRate — weight-based', () => {
    it('calculates base + perUnitRate * weight', () => {
      const rate = ShippingRate.create(baseProps);
      // 5 + 0.5 * 10 = 10
      expect(rate.calculateRate(10, 100, 1)).toBe(10);
    });

    it('returns 0 when subtotal meets freeShippingThreshold', () => {
      const rate = ShippingRate.create({ ...baseProps, freeShippingThreshold: 200 });
      expect(rate.calculateRate(10, 250, 1)).toBe(0);
    });

    it('returns base rate when subtotal is below freeShippingThreshold', () => {
      const rate = ShippingRate.create({ ...baseProps, freeShippingThreshold: 200 });
      expect(rate.calculateRate(10, 100, 1)).toBe(10);
    });
  });

  describe('calculateRate — dimensional weight', () => {
    it('uses actual weight when no dim factor is set', () => {
      const rate = ShippingRate.create(baseProps);
      // 5 + 0.5 * 10 = 10 (volume ignored)
      expect(rate.calculateRate(10, 100, 1, 5000)).toBe(10);
    });

    it('uses dim weight when volume / dimFactor > actual weight', () => {
      const rate = ShippingRate.create({ ...baseProps, dimensionalFactor: 139 });
      // dimWeight = 5000 / 139 = 35.97
      // billableWeight = max(10, 35.97) = 35.97
      // rate = 5 + 0.5 * 35.97 = 22.985
      expect(rate.calculateRate(10, 100, 1, 5000)).toBeCloseTo(22.985, 2);
    });

    it('uses actual weight when actual > dim weight', () => {
      const rate = ShippingRate.create({ ...baseProps, dimensionalFactor: 139 });
      // dimWeight = 1000 / 139 = 7.19
      // billableWeight = max(50, 7.19) = 50
      // rate = 5 + 0.5 * 50 = 30
      expect(rate.calculateRate(50, 100, 1, 1000)).toBe(30);
    });

    it('ignores dim weight when volume is not provided', () => {
      const rate = ShippingRate.create({ ...baseProps, dimensionalFactor: 139 });
      // no volume → billableWeight = 10
      // rate = 5 + 0.5 * 10 = 10
      expect(rate.calculateRate(10, 100, 1)).toBe(10);
    });

    it('ignores dim weight when dimFactor is zero', () => {
      const rate = ShippingRate.create({ ...baseProps, dimensionalFactor: 0 });
      expect(rate.calculateRate(10, 100, 1, 5000)).toBe(10);
    });
  });

  describe('calculateRate — flat', () => {
    it('returns only base rate', () => {
      const rate = ShippingRate.create({ ...baseProps, calculationType: 'flat' });
      expect(rate.calculateRate(10, 100, 1)).toBe(5);
    });
  });

  describe('calculateRate — quantity', () => {
    it('calculates base + perUnitRate * quantity', () => {
      const rate = ShippingRate.create({ ...baseProps, calculationType: 'quantity' });
      // 5 + 0.5 * 3 = 6.5
      expect(rate.calculateRate(10, 100, 3)).toBe(6.5);
    });
  });

  describe('calculateRate — price', () => {
    it('calculates base + perUnitRate * (subtotal / 100)', () => {
      const rate = ShippingRate.create({ ...baseProps, calculationType: 'price' });
      // 5 + 0.5 * (200/100) = 6
      expect(rate.calculateRate(10, 200, 1)).toBe(6);
    });
  });

  describe('isApplicable', () => {
    it('returns true for active rate with no constraints', () => {
      const rate = ShippingRate.create(baseProps);
      expect(rate.isApplicable(10, 100)).toBe(true);
    });

    it('returns false when weight below minWeight', () => {
      const rate = ShippingRate.create({ ...baseProps, minWeight: 20 });
      expect(rate.isApplicable(10, 100)).toBe(false);
    });

    it('returns false when weight above maxWeight', () => {
      const rate = ShippingRate.create({ ...baseProps, maxWeight: 5 });
      expect(rate.isApplicable(10, 100)).toBe(false);
    });

    it('returns false when subtotal below minPrice', () => {
      const rate = ShippingRate.create({ ...baseProps, minPrice: 200 });
      expect(rate.isApplicable(10, 100)).toBe(false);
    });

    it('returns false when subtotal above maxPrice', () => {
      const rate = ShippingRate.create({ ...baseProps, maxPrice: 50 });
      expect(rate.isApplicable(10, 100)).toBe(false);
    });

    it('returns false when country not in countries list', () => {
      const rate = ShippingRate.create({ ...baseProps, countries: ['US', 'CA'] });
      expect(rate.isApplicable(10, 100, 'MX')).toBe(false);
      expect(rate.isApplicable(10, 100, 'US')).toBe(true);
    });
  });

  describe('accessors', () => {
    it('exposes rateId, name, baseRate, isActive, dimensionalFactor', () => {
      const rate = ShippingRate.create({ ...baseProps, dimensionalFactor: 139 });
      expect(rate.rateId).toBe('rate1');
      expect(rate.name).toBe('Standard');
      expect(rate.baseRate).toBe(5);
      expect(rate.isActive).toBe(true);
      expect(rate.dimensionalFactor).toBe(139);
    });
  });
});
