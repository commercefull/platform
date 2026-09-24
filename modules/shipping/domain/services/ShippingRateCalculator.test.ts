/**
 * Unit Tests for ShippingRateCalculator Service (Epic D)
 */

jest.mock('./calculateRate', () => ({
  calculateRate: jest.fn(),
}));

import { ShippingRateCalculator } from './ShippingRateCalculator';
import { calculateRate } from './calculateRate';
import type { ShippingSurchargePort } from '../repositories/ShippingSurchargePort';
import type { ShippingRate, ShippingSurcharge } from '../../../../libs/db/types';

describe('ShippingRateCalculator', () => {
  let calculator: ShippingRateCalculator;
  let mockSurchargePort: jest.Mocked<ShippingSurchargePort>;

  const mockRate = {
    shippingRateId: 'rate1',
    shippingZoneId: 'zone1',
    shippingMethodId: 'method1',
    rateType: 'weightBased',
    baseRateCents: '10',
    perItemRateCents: '0.5',
    freeThresholdCents: null,
    rateMatrix: null,
    minRateCents: null,
    maxRateCents: null,
    currency: 'USD',
    taxable: false,
    isActive: true,
  } as unknown as ShippingRate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSurchargePort = {
      findActiveByRateId: jest.fn().mockResolvedValue([]),
    };
    calculator = new ShippingRateCalculator(mockSurchargePort);
    jest.mocked(calculateRate).mockReturnValue(10);
  });

  it('returns base amountCents with no surcharges', async () => {
    const result = await calculator.calculate({
      rate: mockRate,
      orderSubtotalCents: 100,
      itemCount: 2,
      totalWeight: 5,
    });

    expect(result.baseAmountCents).toBe(10);
    expect(result.surchargeAmountCents).toBe(0);
    expect(result.totalAmountCents).toBe(10);
    expect(result.surchargeBreakdown).toEqual([]);
    expect(result.isFreeShipping).toBe(false);
  });

  it('returns free shipping when base amountCents is zero', async () => {
    jest.mocked(calculateRate).mockReturnValue(0);

    const result = await calculator.calculate({
      rate: mockRate,
      orderSubtotalCents: 500,
      itemCount: 2,
      totalWeight: 5,
    });

    expect(result.isFreeShipping).toBe(true);
    expect(result.totalAmountCents).toBe(0);
    expect(result.surchargeAmountCents).toBe(0);
  });

  it('adds a flat fuel surcharge', async () => {
    const mockSurcharge = {
      shippingSurchargeId: 'sc1',
      shippingRateId: 'rate1',
      type: 'fuel',
      calculationType: 'flat',
      value: '5',
      conditions: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ShippingSurcharge;

    jest.mocked(mockSurchargePort.findActiveByRateId).mockResolvedValue([mockSurcharge]);

    const result = await calculator.calculate({
      rate: mockRate,
      orderSubtotalCents: 100,
      itemCount: 2,
      totalWeight: 5,
    });

    expect(result.baseAmountCents).toBe(10);
    expect(result.surchargeAmountCents).toBe(5);
    expect(result.totalAmountCents).toBe(15);
    expect(result.surchargeBreakdown).toEqual([{ type: 'fuel', amountCents: 5 }]);
  });

  it('adds a percentage fuel surcharge', async () => {
    const mockSurcharge = {
      shippingSurchargeId: 'sc1',
      shippingRateId: 'rate1',
      type: 'fuel',
      calculationType: 'percentage',
      value: '10',
      conditions: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ShippingSurcharge;

    jest.mocked(mockSurchargePort.findActiveByRateId).mockResolvedValue([mockSurcharge]);

    const result = await calculator.calculate({
      rate: mockRate,
      orderSubtotalCents: 100,
      itemCount: 2,
      totalWeight: 5,
    });

    // 10% of baseRateCents 10 = 1
    expect(result.surchargeAmountCents).toBe(1);
    expect(result.totalAmountCents).toBe(11);
  });

  it('adds multiple surcharges', async () => {
    const fuelSurcharge = {
      shippingSurchargeId: 'sc1',
      shippingRateId: 'rate1',
      type: 'fuel',
      calculationType: 'percentage',
      value: '10',
      conditions: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ShippingSurcharge;

    const residentialSurcharge = {
      shippingSurchargeId: 'sc2',
      shippingRateId: 'rate1',
      type: 'residential',
      calculationType: 'flat',
      value: '3',
      conditions: [{ attribute: 'isResidential', operator: 'eq', value: true }],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ShippingSurcharge;

    jest.mocked(mockSurchargePort.findActiveByRateId).mockResolvedValue([fuelSurcharge, residentialSurcharge]);

    const result = await calculator.calculate({
      rate: mockRate,
      orderSubtotalCents: 100,
      itemCount: 2,
      totalWeight: 5,
      isResidential: true,
    });

    // fuel: 10% of 10 = 1, residential: 3 (flat) → total surcharge = 4
    expect(result.surchargeAmountCents).toBe(4);
    expect(result.totalAmountCents).toBe(14);
    expect(result.surchargeBreakdown).toHaveLength(2);
  });

  it('skips surcharges whose conditions do not match', async () => {
    const remoteSurcharge = {
      shippingSurchargeId: 'sc1',
      shippingRateId: 'rate1',
      type: 'remoteArea',
      calculationType: 'flat',
      value: '15',
      conditions: [{ attribute: 'isRemoteArea', operator: 'eq', value: true }],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ShippingSurcharge;

    jest.mocked(mockSurchargePort.findActiveByRateId).mockResolvedValue([remoteSurcharge]);

    const result = await calculator.calculate({
      rate: mockRate,
      orderSubtotalCents: 100,
      itemCount: 2,
      totalWeight: 5,
      isRemoteArea: false,
    });

    expect(result.surchargeAmountCents).toBe(0);
    expect(result.totalAmountCents).toBe(10);
    expect(result.surchargeBreakdown).toEqual([]);
  });

  it('skips inactive surcharges', async () => {
    const inactiveSurcharge = {
      shippingSurchargeId: 'sc1',
      shippingRateId: 'rate1',
      type: 'fuel',
      calculationType: 'flat',
      value: '5',
      conditions: null,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ShippingSurcharge;

    jest.mocked(mockSurchargePort.findActiveByRateId).mockResolvedValue([inactiveSurcharge]);

    const result = await calculator.calculate({
      rate: mockRate,
      orderSubtotalCents: 100,
      itemCount: 2,
      totalWeight: 5,
    });

    expect(result.surchargeAmountCents).toBe(0);
    expect(result.totalAmountCents).toBe(10);
  });
});
