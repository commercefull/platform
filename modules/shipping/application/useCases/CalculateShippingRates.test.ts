import {
  createShippingZonePort,
  createShippingMethodPort,
  createShippingRatePort,
  createShippingZone,
  createShippingMethod,
  createShippingRate,
} from '../../tests/testUtils';
import { CalculateShippingRatesUseCase, CalculateShippingRatesCommand } from './CalculateShippingRates';

describe('CalculateShippingRatesUseCase', () => {
  let useCase: CalculateShippingRatesUseCase;
  let zoneRepo: ReturnType<typeof createShippingZonePort>;
  let methodRepo: ReturnType<typeof createShippingMethodPort>;
  let rateRepo: ReturnType<typeof createShippingRatePort>;

  beforeEach(() => {
    zoneRepo = createShippingZonePort();
    methodRepo = createShippingMethodPort();
    rateRepo = createShippingRatePort();
    useCase = new CalculateShippingRatesUseCase(zoneRepo, methodRepo, rateRepo);
  });

  it('should return error when destination country is missing', async () => {
    const result = await useCase.execute(new CalculateShippingRatesCommand({ country: '' }, { subtotalCents: 100, itemCount: 1 }));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('country_required');
    expect(zoneRepo.findByLocation).not.toHaveBeenCalled();
  });

  it('should return error when no shipping zone matches the destination', async () => {
    zoneRepo.findByLocation.mockResolvedValue([]);

    const result = await useCase.execute(new CalculateShippingRatesCommand({ country: 'XX' }, { subtotalCents: 100, itemCount: 1 }));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('no_zone_found');
  });

  it('should return error when no shipping methods are available', async () => {
    zoneRepo.findByLocation.mockResolvedValue([createShippingZone()]);
    methodRepo.findAll.mockResolvedValue([]);

    const result = await useCase.execute(new CalculateShippingRatesCommand({ country: 'US' }, { subtotalCents: 100, itemCount: 1 }));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('no_methods_available');
  });

  it('should calculate rates for matching methods', async () => {
    zoneRepo.findByLocation.mockResolvedValue([createShippingZone()]);
    methodRepo.findAll.mockResolvedValue([createShippingMethod({ name: 'Standard Shipping', code: 'STANDARD' })]);
    rateRepo.findByZoneAndMethod.mockResolvedValue(createShippingRate({ rateType: 'flat', baseRateCents: 999 }));

    const result = await useCase.execute(
      new CalculateShippingRatesCommand({ country: 'US', state: 'CA' }, { subtotalCents: 100, itemCount: 2 }),
    );

    expect(result.success).toBe(true);
    expect(result.rates).toHaveLength(1);
    expect(result.rates[0].amountCents).toBe(999);
    expect(result.rates[0].shippingMethodName).toBe('Standard Shipping');
    expect(methodRepo.findAll).toHaveBeenCalledWith(true, true);
  });

  it('should flag free shipping when the calculated amountCents is zero', async () => {
    zoneRepo.findByLocation.mockResolvedValue([createShippingZone()]);
    methodRepo.findAll.mockResolvedValue([createShippingMethod({ name: 'Free Shipping', code: 'FREE', shippingCarrierId: null })]);
    rateRepo.findByZoneAndMethod.mockResolvedValue(createShippingRate({ rateType: 'free', baseRateCents: 0 }));

    const result = await useCase.execute(new CalculateShippingRatesCommand({ country: 'US' }, { subtotalCents: 100, itemCount: 1 }));

    expect(result.success).toBe(true);
    expect(result.rates[0].isFreeShipping).toBe(true);
    expect(result.rates[0].amountCents).toBe(0);
  });

  it('should skip methods outside the order value range', async () => {
    zoneRepo.findByLocation.mockResolvedValue([createShippingZone()]);
    methodRepo.findAll.mockResolvedValue([createShippingMethod({ minOrderValueCents: 20000 })]);

    const result = await useCase.execute(new CalculateShippingRatesCommand({ country: 'US' }, { subtotalCents: 100, itemCount: 1 }));

    expect(result.success).toBe(true);
    expect(result.rates).toHaveLength(0);
    expect(rateRepo.findByZoneAndMethod).not.toHaveBeenCalled();
  });
});
