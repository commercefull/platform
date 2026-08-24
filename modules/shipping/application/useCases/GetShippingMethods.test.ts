jest.mock('../../infrastructure/repositories/ShippingConfigRepository', () => ({
  __esModule: true,
  default: {
    carriers: {
      findById: jest.fn().mockResolvedValue(null),
      findByCode: jest.fn().mockResolvedValue({
        shippingCarrierId: 'c1', name: 'UPS', code: 'ups', isActive: true,
        supportedServices: ['ground'], supportedRegions: ['US'], hasApiIntegration: true, requiresContract: false,
      }),
    },
    methods: {
      findById: jest.fn().mockResolvedValue({ shippingMethodId: 'm1', name: 'Ground' }),
      findAll: jest.fn().mockResolvedValue([{ shippingMethodId: 'm1', name: 'Ground', code: 'ground', shippingCarrierId: 'c1' }]),
      findByCarrier: jest.fn().mockResolvedValue([{ shippingMethodId: 'm1' }]),
      findDefault: jest.fn().mockResolvedValue(null),
      findByCode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      delete: jest.fn(),
    },
    zones: {
      findById: jest.fn().mockResolvedValue({ shippingZoneId: 'z1', name: 'US Zone' }),
      findAll: jest.fn().mockResolvedValue([{ shippingZoneId: 'z1' }]),
      findByLocation: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      delete: jest.fn(),
    },
    rates: {
      findById: jest.fn(),
      findActive: jest.fn(),
      findByMethod: jest.fn().mockResolvedValue([]),
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

import { GetShippingMethodsUseCase, GetShippingMethodsQuery } from './GetShippingMethods';

describe('GetShippingMethodsUseCase', () => {
  let useCase: GetShippingMethodsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetShippingMethodsUseCase();
  });

  it('should get all shipping methods (happy path)', async () => {
    const result = await useCase.execute(new GetShippingMethodsQuery());

    expect(result.success).toBe(true);
    expect(result.methods).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should filter by carrier ID', async () => {
    const result = await useCase.execute(new GetShippingMethodsQuery(true, false, 'c1'));

    expect(result.success).toBe(true);
    expect(result.methods).toHaveLength(1);
  });
});
