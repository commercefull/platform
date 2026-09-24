import {
  createShippingMethodPort,
  createShippingRatePort,
  createShippingMethod,
  createShippingRate,
} from '../../tests/testUtils';
import { GetShippingMethodDetailsUseCase } from './GetShippingMethodDetails';

describe('GetShippingMethodDetailsUseCase', () => {
  let useCase: GetShippingMethodDetailsUseCase;
  let methodRepo: ReturnType<typeof createShippingMethodPort>;
  let rateRepo: ReturnType<typeof createShippingRatePort>;

  beforeEach(() => {
    methodRepo = createShippingMethodPort();
    rateRepo = createShippingRatePort();
    useCase = new GetShippingMethodDetailsUseCase(methodRepo, rateRepo);
  });

  it('should return method details with the rate costCents', async () => {
    methodRepo.findById.mockResolvedValue(createShippingMethod({ shippingMethodId: 'm1', name: 'Ground' }));
    rateRepo.findByMethod.mockResolvedValue([createShippingRate({ baseRateCents: 1500 })]);

    const result = await useCase.getShippingMethod('m1');

    expect(result.shippingMethodId).toBe('m1');
    expect(result.name).toBe('Ground');
    expect(result.costCents).toBe(1500);
  });

  it('should return the default method when no ID is provided', async () => {
    methodRepo.findDefault.mockResolvedValue(createShippingMethod({ shippingMethodId: 'm0', name: 'Standard' }));
    rateRepo.findByMethod.mockResolvedValue([createShippingRate({ baseRateCents: 500 })]);

    const result = await useCase.getShippingMethod('');

    expect(result.shippingMethodId).toBe('m0');
    expect(result.name).toBe('Standard');
    expect(methodRepo.findById).not.toHaveBeenCalled();
  });

  it('should return fallback details when the method does not exist', async () => {
    methodRepo.findById.mockResolvedValue(null);

    const result = await useCase.getShippingMethod('nonexistent');

    expect(result.name).toBe('Standard Shipping');
    expect(result.costCents).toBe(0);
  });

  it('should return fallback details when no default method exists', async () => {
    methodRepo.findDefault.mockResolvedValue(null);

    const result = await useCase.getShippingMethod('');

    expect(result.name).toBe('Standard Shipping');
    expect(result.costCents).toBe(0);
  });

  it('should default the costCents to zero when the method has no rates', async () => {
    methodRepo.findById.mockResolvedValue(createShippingMethod({ shippingMethodId: 'm1' }));
    rateRepo.findByMethod.mockResolvedValue([]);

    const result = await useCase.getShippingMethod('m1');

    expect(result.costCents).toBe(0);
  });
});
