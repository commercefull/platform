import { createShippingRatePort, createShippingRate } from '../../tests/testUtils';
import { ManageShippingRatesUseCase } from './ManageShippingRates';

describe('ManageShippingRatesUseCase', () => {
  let useCase: ManageShippingRatesUseCase;
  let rateRepo: ReturnType<typeof createShippingRatePort>;

  beforeEach(() => {
    rateRepo = createShippingRatePort();
    useCase = new ManageShippingRatesUseCase(rateRepo);
  });

  it('should find active rates for a zone and method', async () => {
    rateRepo.findActive.mockResolvedValue([createShippingRate()]);

    const result = await useCase.findActive('z1', 'm1');

    expect(result).toHaveLength(1);
    expect(rateRepo.findActive).toHaveBeenCalledWith('z1', 'm1');
  });

  it('should find a rate by ID', async () => {
    rateRepo.findById.mockResolvedValue(createShippingRate({ shippingRateId: 'r1' }));

    const result = await useCase.findById('r1');

    expect(result?.shippingRateId).toBe('r1');
  });

  it('should create a rate', async () => {
    rateRepo.create.mockImplementation(async input => createShippingRate({ ...input, shippingRateId: 'r2' }));

    const { shippingRateId: _r, createdAt: _c, updatedAt: _u, ...input } = createShippingRate({ baseRate: '10.00' });

    const result = await useCase.create(input);

    expect(result.shippingRateId).toBe('r2');
  });

  it('should activate a rate', async () => {
    rateRepo.activate.mockResolvedValue(createShippingRate({ isActive: true }));

    const result = await useCase.activate('r1');

    expect(result?.isActive).toBe(true);
  });

  it('should find a rate by zone and method', async () => {
    rateRepo.findByZoneAndMethod.mockResolvedValue(createShippingRate({ shippingRateId: 'r1' }));

    const result = await useCase.findByZoneAndMethod('z1', 'm1');

    expect(result?.shippingRateId).toBe('r1');
  });

  it('should calculate a flat rate using the domain service', () => {
    const result = useCase.calculateRate(createShippingRate({ rateType: 'flat', baseRate: '12.50' }), 100, 2, 5);

    expect(result).toBe(12.5);
  });
});
