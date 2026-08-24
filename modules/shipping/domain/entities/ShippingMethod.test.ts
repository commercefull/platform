import { ShippingMethod } from './ShippingMethod';

describe('ShippingMethod', () => {
  const baseProps = {
    name: 'Standard', code: 'STD', type: 'flat_rate' as const, basePrice: 10, zoneIds: ['z1'],
    isActive: true, isDefault: false, sortOrder: 0,
  };

  it('should create a shipping method (happy path)', () => {
    const sm = ShippingMethod.create(baseProps);
    expect(sm.name).toBe('Standard');
    expect(sm.isActive).toBe(true);
    expect(sm.isDefault).toBe(false);
    expect(sm.sortOrder).toBe(0);
    expect(sm.shippingMethodId).toMatch(/^shm_/);
  });

  it('should calculate flat rate', () => {
    const sm = ShippingMethod.create(baseProps);
    expect(sm.calculateRate(5, 100)).toBe(10);
  });

  it('should calculate free shipping', () => {
    const sm = ShippingMethod.create({ ...baseProps, type: 'free' });
    expect(sm.calculateRate(5, 100)).toBe(0);
  });

  it('should calculate weight-based rate', () => {
    const sm = ShippingMethod.create({ ...baseProps, type: 'weight_based', pricePerKg: 2 });
    expect(sm.calculateRate(5, 100)).toBe(20);
  });

  it('should enforce min price', () => {
    const sm = ShippingMethod.create({ ...baseProps, type: 'weight_based', pricePerKg: 0.5, minPrice: 15 });
    expect(sm.calculateRate(5, 100)).toBe(15);
  });

  it('should enforce max price', () => {
    const sm = ShippingMethod.create({ ...baseProps, type: 'weight_based', pricePerKg: 10, maxPrice: 50 });
    expect(sm.calculateRate(10, 100)).toBe(50);
  });

  it('should check availability', () => {
    const sm = ShippingMethod.create({ ...baseProps, minOrderValue: 50, maxWeight: 100 });
    expect(sm.isAvailableFor(5, 100)).toBe(true);
    expect(sm.isAvailableFor(5, 30)).toBe(false);
    expect(sm.isAvailableFor(200, 100)).toBe(false);
  });

  it('should return false when inactive', () => {
    const sm = ShippingMethod.create(baseProps);
    sm.deactivate();
    expect(sm.isAvailableFor(5, 100)).toBe(false);
  });

  it('should activate and deactivate', () => {
    const sm = ShippingMethod.create(baseProps);
    sm.deactivate();
    expect(sm.isActive).toBe(false);
    sm.activate();
    expect(sm.isActive).toBe(true);
  });

  it('should assign and remove zones', () => {
    const sm = ShippingMethod.create(baseProps);
    sm.assignToZones(['z2', 'z3']);
    expect(sm.zoneIds).toContain('z2');
    sm.removeFromZones(['z1']);
    expect(sm.zoneIds).not.toContain('z1');
  });

  it('should update fields', () => {
    const sm = ShippingMethod.create(baseProps);
    sm.update({ name: 'Express', basePrice: 25 });
    expect(sm.name).toBe('Express');
    expect(sm.basePrice).toBe(25);
  });

  it('should serialize to persistence', () => {
    const sm = ShippingMethod.create(baseProps);
    const p = sm.toPersistence();
    expect(p.name).toBe('Standard');
    expect(p.shippingMethodId).toMatch(/^shm_/);
  });
});
