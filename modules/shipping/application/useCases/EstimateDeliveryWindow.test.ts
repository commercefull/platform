import { EstimateDeliveryWindowUseCase } from './EstimateDeliveryWindow';
import type { ShippingMethodPort } from '../../domain/repositories/ShippingConfigPorts';
import { ShippingMethodNotFoundError, ShippingValidationError } from '../../domain/errors/ShippingErrors';
import type { ShippingMethodRecord } from '../../domain/entities/ShippingModel';

const lazyMock = <T extends object>(): jest.Mocked<T> => {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_t, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
};

const makeMethod = (overrides: Partial<ShippingMethodRecord> = {}): ShippingMethodRecord => ({
  shippingMethodId: 'm-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  shippingCarrierId: null,
  name: 'Standard',
  code: 'STD',
  description: null,
  isActive: true,
  isDefault: false,
  serviceCode: null,
  domesticInternational: 'domestic',
  estimatedDeliveryDays: { min: 3, max: 5 },
  handlingDays: 1,
  priority: null,
  displayOnFrontend: true,
  allowFreeShipping: false,
  minWeight: null,
  maxWeight: null,
  minOrderValueCents: null,
  maxOrderValueCents: null,
  dimensionRestrictions: null,
  shippingClass: null,
  customFields: null,
  createdBy: null,
  ...overrides,
});

describe('EstimateDeliveryWindowUseCase', () => {
  let methods: jest.Mocked<ShippingMethodPort>;
  let useCase: EstimateDeliveryWindowUseCase;

  beforeEach(() => {
    methods = lazyMock<ShippingMethodPort>();
    useCase = new EstimateDeliveryWindowUseCase(methods);
  });

  it('should reject a missing methodId', async () => {
    await expect(useCase.execute({})).rejects.toBeInstanceOf(ShippingValidationError);
  });

  it('should reject an unknown method', async () => {
    methods.findById.mockResolvedValue(null);
    await expect(useCase.execute({ methodId: 'm-x' })).rejects.toBeInstanceOf(ShippingMethodNotFoundError);
  });

  it('should compute a range window from { min, max } transit days plus handling', async () => {
    methods.findById.mockResolvedValue(makeMethod());

    const result = await useCase.execute({ methodId: 'm-1' });

    expect(result.estimatedDaysMin).toBe(4);
    expect(result.estimatedDaysMax).toBe(6);
    expect(result.handlingDays).toBe(1);
    expect(result.methodName).toBe('Standard');
  });

  it('should handle a numeric transit-days value', async () => {
    methods.findById.mockResolvedValue(makeMethod({ estimatedDeliveryDays: 5, handlingDays: 0 }));

    const result = await useCase.execute({ methodId: 'm-1' });

    expect(result.estimatedDaysMin).toBe(5);
    expect(result.estimatedDaysMax).toBe(5);
  });

  it('should treat a min-only range as min/max equal', async () => {
    methods.findById.mockResolvedValue(makeMethod({ estimatedDeliveryDays: { min: 2 }, handlingDays: 0 }));

    const result = await useCase.execute({ methodId: 'm-1' });

    expect(result.estimatedDaysMin).toBe(2);
    expect(result.estimatedDaysMax).toBe(2);
  });
});
