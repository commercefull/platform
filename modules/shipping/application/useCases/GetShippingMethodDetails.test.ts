jest.mock('../../infrastructure/repositories/ShippingConfigRepository', () => ({
  __esModule: true,
  default: {
    carriers: {},
    methods: {
      findById: jest.fn().mockResolvedValue({
        shippingMethodId: 'm1', name: 'Ground', estimatedDeliveryDays: 5,
      }),
      findDefault: jest.fn().mockResolvedValue({
        shippingMethodId: 'm0', name: 'Standard', estimatedDeliveryDays: 3,
      }),
      findAll: jest.fn(),
      findByCarrier: jest.fn(),
      findByCode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      delete: jest.fn(),
    },
    zones: {},
    rates: {
      findById: jest.fn(),
      findActive: jest.fn(),
      findByMethod: jest.fn().mockResolvedValue([{ baseRate: '15.00' }]),
      findByZoneAndMethod: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      delete: jest.fn(),
      calculateRate: jest.fn(),
    },
  },
}));

import { GetShippingMethodDetailsUseCase } from './GetShippingMethodDetails';
import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';

const mockRepo = shippingConfigRepository as unknown as { methods: Record<string, jest.Mock> };

describe('GetShippingMethodDetailsUseCase', () => {
  let useCase: GetShippingMethodDetailsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetShippingMethodDetailsUseCase();
  });

  it('should get method details by ID (happy path)', async () => {
    const result = await useCase.getShippingMethod('m1');

    expect(result.shippingMethodId).toBe('m1');
    expect(result.name).toBe('Ground');
    expect(result.cost).toBe('15.00');
  });

  it('should return default method when no ID provided', async () => {
    const result = await useCase.getShippingMethod('');

    expect(result.shippingMethodId).toBe('m0');
    expect(result.name).toBe('Standard');
  });

  it('should return fallback when method not found', async () => {
    mockRepo.methods.findById.mockResolvedValueOnce(null);

    const result = await useCase.getShippingMethod('nonexistent');

    expect(result.name).toBe('Standard Shipping');
    expect(result.cost).toBe('0.00');
  });
});
