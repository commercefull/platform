import { evaluateConditions } from './ShippingConditionsEvaluator';

describe('ShippingConditionsEvaluator', () => {
  const baseCtx = { subtotal: 100, itemCount: 3 };

  it('should return applicable when no conditions', () => {
    expect(evaluateConditions(null, baseCtx)).toEqual({ applicable: true, adjustment: 0 });
    expect(evaluateConditions(undefined, baseCtx)).toEqual({ applicable: true, adjustment: 0 });
  });

  it('should check minOrderValue', () => {
    const result = evaluateConditions({ minOrderValue: 150 }, baseCtx);
    expect(result.applicable).toBe(false);
    expect(result.reason).toContain('minimum');
  });

  it('should check maxOrderValue', () => {
    const result = evaluateConditions({ maxOrderValue: 50 }, baseCtx);
    expect(result.applicable).toBe(false);
  });

  it('should check minWeight', () => {
    const result = evaluateConditions({ minWeight: 10 }, { ...baseCtx, totalWeight: 5 });
    expect(result.applicable).toBe(false);
  });

  it('should check maxWeight', () => {
    const result = evaluateConditions({ maxWeight: 10 }, { ...baseCtx, totalWeight: 20 });
    expect(result.applicable).toBe(false);
  });

  it('should check minItemCount', () => {
    expect(evaluateConditions({ minItemCount: 5 }, baseCtx).applicable).toBe(false);
    expect(evaluateConditions({ minItemCount: 2 }, baseCtx).applicable).toBe(true);
  });

  it('should check maxItemCount', () => {
    expect(evaluateConditions({ maxItemCount: 2 }, baseCtx).applicable).toBe(false);
  });

  it('should check countries whitelist', () => {
    expect(evaluateConditions({ countries: ['US'] }, { ...baseCtx, country: 'CA' }).applicable).toBe(false);
    expect(evaluateConditions({ countries: ['US'] }, { ...baseCtx, country: 'US' }).applicable).toBe(true);
  });

  it('should check excludeCountries', () => {
    expect(evaluateConditions({ excludeCountries: ['CA'] }, { ...baseCtx, country: 'CA' }).applicable).toBe(false);
  });

  it('should check states', () => {
    expect(evaluateConditions({ states: ['NY'] }, { ...baseCtx, state: 'CA' }).applicable).toBe(false);
    expect(evaluateConditions({ states: ['NY'] }, { ...baseCtx, state: 'NY' }).applicable).toBe(true);
  });

  it('should check postal code patterns', () => {
    expect(evaluateConditions({ postalCodePatterns: ['100*'] }, { ...baseCtx, postalCode: '10001' }).applicable).toBe(true);
    expect(evaluateConditions({ postalCodePatterns: ['200*'] }, { ...baseCtx, postalCode: '10001' }).applicable).toBe(false);
  });

  it('should check date range - not yet valid', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(evaluateConditions({ dateRange: { from: future } }, baseCtx).applicable).toBe(false);
  });

  it('should check date range - expired', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(evaluateConditions({ dateRange: { to: past } }, baseCtx).applicable).toBe(false);
  });

  it('should apply surcharge', () => {
    const result = evaluateConditions({ surcharge: 5 }, baseCtx);
    expect(result.applicable).toBe(true);
    expect(result.adjustment).toBe(5);
  });

  it('should apply discount', () => {
    const result = evaluateConditions({ discount: 10 }, baseCtx);
    expect(result.applicable).toBe(true);
    expect(result.adjustment).toBe(-10);
  });

  it('should apply both surcharge and discount', () => {
    const result = evaluateConditions({ surcharge: 5, discount: 3 }, baseCtx);
    expect(result.adjustment).toBe(2);
  });
});
