import {
  createShippingMethodPort,
  createShippingCarrierPort,
  createShippingMethod,
  createShippingCarrier,
} from '../../tests/testUtils';
import { GetShippingMethodsUseCase, GetShippingMethodsQuery } from './GetShippingMethods';

describe('GetShippingMethodsUseCase', () => {
  let useCase: GetShippingMethodsUseCase;
  let methodRepo: ReturnType<typeof createShippingMethodPort>;
  let carrierRepo: ReturnType<typeof createShippingCarrierPort>;

  beforeEach(() => {
    methodRepo = createShippingMethodPort();
    carrierRepo = createShippingCarrierPort();
    useCase = new GetShippingMethodsUseCase(methodRepo, carrierRepo);
  });

  it('should return all shipping methods', async () => {
    methodRepo.findAll.mockResolvedValue([
      createShippingMethod({ shippingMethodId: 'm1', shippingCarrierId: null }),
      createShippingMethod({ shippingMethodId: 'm2', shippingCarrierId: 'carrier-1' }),
    ]);
    carrierRepo.findById.mockResolvedValue(createShippingCarrier({ shippingCarrierId: 'carrier-1', name: 'UPS' }));

    const result = await useCase.execute(new GetShippingMethodsQuery());

    expect(result.success).toBe(true);
    expect(result.methods).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter methods by carrier', async () => {
    methodRepo.findByCarrier.mockResolvedValue([createShippingMethod({ shippingMethodId: 'm1' })]);

    const result = await useCase.execute(new GetShippingMethodsQuery(true, false, 'carrier-1'));

    expect(result.success).toBe(true);
    expect(result.methods).toHaveLength(1);
    expect(methodRepo.findByCarrier).toHaveBeenCalledWith('carrier-1', true);
  });

  it('should enrich methods with carrier info', async () => {
    const carrier = createShippingCarrier({ shippingCarrierId: 'carrier-1', name: 'UPS' });
    methodRepo.findAll.mockResolvedValue([createShippingMethod({ shippingCarrierId: 'carrier-1' })]);
    carrierRepo.findById.mockResolvedValue(carrier);

    const result = await useCase.execute(new GetShippingMethodsQuery(true, false));

    expect(result.success).toBe(true);
    expect(result.methods[0].carrier).toEqual(carrier);
  });

  it('should return an empty list when no methods exist', async () => {
    methodRepo.findAll.mockResolvedValue([]);

    const result = await useCase.execute(new GetShippingMethodsQuery(true, true));

    expect(result.success).toBe(true);
    expect(result.methods).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should return failure when the repository throws', async () => {
    methodRepo.findAll.mockRejectedValue(new Error('db down'));

    const result = await useCase.execute(new GetShippingMethodsQuery());

    expect(result.success).toBe(false);
    expect(result.message).toBe('db down');
  });
});
