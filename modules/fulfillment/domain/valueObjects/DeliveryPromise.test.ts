import { DeliveryPromise } from './DeliveryPromise';

describe('DeliveryPromise', () => {
  const baseProps = {
    sourceId: 'wh-1',
    sourceType: 'warehouse' as const,
    shipFrom: { country: 'DE', postalCode: '10115' },
    shipTo: { country: 'BE', postalCode: '1000' },
    carrier: 'dhl',
    serviceLevel: 'standard',
    earliestDate: new Date('2026-11-01T00:00:00Z'),
    latestDate: new Date('2026-11-04T00:00:00Z'),
    confidence: 'high' as const,
    isEstimate: false,
  };

  it('should create a promise and expose its window', () => {
    const promise = DeliveryPromise.create(baseProps);
    expect(promise.sourceId).toBe('wh-1');
    expect(promise.shipFrom.country).toBe('DE');
    expect(promise.shipTo.country).toBe('BE');
    expect(promise.confidence).toBe('high');
    expect(promise.isEstimate).toBe(false);
  });

  it('should compute the transit window in days', () => {
    const promise = DeliveryPromise.create(baseProps);
    expect(promise.transitDays()).toBe(3);
  });

  it('should reject a latestDate before earliestDate', () => {
    expect(() =>
      DeliveryPromise.create({ ...baseProps, latestDate: new Date('2026-10-01T00:00:00Z') }),
    ).toThrow('latestDate must be on or after earliestDate');
  });

  it('should report lateness against the latest date', () => {
    const promise = DeliveryPromise.create(baseProps);
    expect(promise.isLate(new Date('2026-11-05T00:00:00Z'))).toBe(true);
    expect(promise.isLate(new Date('2026-11-02T00:00:00Z'))).toBe(false);
  });

  it('should serialize window dates to ISO in toJSON', () => {
    const json = DeliveryPromise.create(baseProps).toJSON();
    expect(json.earliestDate).toBe('2026-11-01T00:00:00.000Z');
    expect(json.latestDate).toBe('2026-11-04T00:00:00.000Z');
  });
});
