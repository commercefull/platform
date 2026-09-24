import { emitMock, lazyMock, createShippingMethodEntity, createShippingZoneEntity } from '../../tests/testUtils';
import { CalculateRatesUseCase } from './CalculateRates';

type ShippingRepository = ConstructorParameters<typeof CalculateRatesUseCase>[0];

describe('CalculateRatesUseCase', () => {
  let useCase: CalculateRatesUseCase;
  let repo: jest.Mocked<ShippingRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<ShippingRepository>();
    repo.findZonesForAddress.mockResolvedValue([createShippingZoneEntity()]);
    repo.findDefaultZone.mockResolvedValue(null);
    repo.findMethodsForZones.mockResolvedValue([
      createShippingMethodEntity({ shippingMethodId: 'm1', basePriceCents: 9.99, isDefault: true }),
      createShippingMethodEntity({ shippingMethodId: 'm2', name: 'Express', code: 'exp', basePriceCents: 19.99, isDefault: false }),
    ]);
    useCase = new CalculateRatesUseCase(repo);
  });

  it('should calculate rates for all available methods', async () => {
    const result = await useCase.execute({
      destinationAddress: { countryCode: 'US', stateCode: 'CA' },
      items: [{ productId: 'p1', quantity: 2, weight: 1.5, price: 50 }],
      orderValueCents: 100,
    });

    expect(result.rates).toHaveLength(2);
    expect(result.rates[0].rateCents).toBe(9.99);
    expect(result.defaultRateId).toBe('m1');
    expect(emitMock).toHaveBeenCalledWith('shipping.rate_calculated', expect.objectContaining({ destinationCountry: 'US' }));
  });

  it('should fall back to the default zone when no zones match', async () => {
    repo.findZonesForAddress.mockResolvedValue([]);
    repo.findDefaultZone.mockResolvedValue(createShippingZoneEntity({ shippingZoneId: 'default-z' }));

    await useCase.execute({
      destinationAddress: { countryCode: 'XX' },
      items: [{ productId: 'p1', quantity: 1, price: 10 }],
      orderValueCents: 10,
    });

    expect(repo.findDefaultZone).toHaveBeenCalled();
    expect(repo.findMethodsForZones).toHaveBeenCalledWith(['default-z'], expect.anything());
  });

  it('should skip methods unavailable for the order weight', async () => {
    repo.findMethodsForZones.mockResolvedValue([
      createShippingMethodEntity({ shippingMethodId: 'm1', maxWeight: 10 }),
      createShippingMethodEntity({ shippingMethodId: 'm2', code: 'exp', basePriceCents: 19.99 }),
    ]);

    const result = await useCase.execute({
      destinationAddress: { countryCode: 'US' },
      items: [{ productId: 'p1', quantity: 1, weight: 100, price: 10 }],
      orderValueCents: 10,
    });

    expect(result.rates).toHaveLength(1);
    expect(result.rates[0].code).toBe('exp');
  });

  it('should use the cheapest rate as default when no method is marked default', async () => {
    repo.findMethodsForZones.mockResolvedValue([
      createShippingMethodEntity({ shippingMethodId: 'm1', basePriceCents: 9.99, isDefault: false }),
      createShippingMethodEntity({ shippingMethodId: 'm2', code: 'exp', basePriceCents: 19.99, isDefault: false }),
    ]);

    const result = await useCase.execute({
      destinationAddress: { countryCode: 'US' },
      items: [{ productId: 'p1', quantity: 1, price: 10 }],
      orderValueCents: 10,
    });

    expect(result.defaultRateId).toBe('m1');
  });
});
