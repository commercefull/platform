jest.mock('../../infrastructure/repositories/ShippingConfigRepository', () => ({
  __esModule: true,
  default: {
    carriers: {},
    methods: {
      findAll: jest.fn().mockResolvedValue([{ shippingMethodId: 'm1' }]),
      findById: jest.fn().mockResolvedValue({ shippingMethodId: 'm1', name: 'Ground' }),
    },
    zones: {
      findAll: jest.fn().mockResolvedValue([{ shippingZoneId: 'z1' }]),
      findById: jest.fn().mockResolvedValue({ shippingZoneId: 'z1', name: 'US' }),
    },
    rates: {
      findActive: jest.fn().mockResolvedValue([{ shippingRateId: 'r1' }]),
      findById: jest.fn().mockResolvedValue({ shippingRateId: 'r1', baseRate: 10 }),
      create: jest.fn().mockResolvedValue({ shippingRateId: 'r2' }),
      update: jest.fn().mockResolvedValue({ shippingRateId: 'r1', baseRate: 15 }),
      activate: jest.fn().mockResolvedValue(true),
      deactivate: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
      findByZoneAndMethod: jest.fn().mockResolvedValue({ shippingRateId: 'r1' }),
      calculateRate: jest.fn().mockReturnValue(12.5),
    },
  },
}));

import { ManageShippingRatesUseCase } from './ManageShippingRates';

describe('ManageShippingRatesUseCase', () => {
  let useCase: ManageShippingRatesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageShippingRatesUseCase();
  });

  it('should find active rates', async () => {
    const result = await useCase.findActive('z1', 'm1');
    expect(result).toHaveLength(1);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('r1');
    expect(result).toEqual({ shippingRateId: 'r1', baseRate: 10 });
  });

  it('should create', async () => {
    const result = await useCase.create({ baseRate: 10 } as never);
    expect(result).toEqual({ shippingRateId: 'r2' });
  });

  it('should activate', async () => {
    const result = await useCase.activate('r1');
    expect(result).toBe(true);
  });

  it('should find by zone and method', async () => {
    const result = await useCase.findByZoneAndMethod('z1', 'm1');
    expect(result).toEqual({ shippingRateId: 'r1' });
  });

  it('should calculate rate', () => {
    const result = useCase.calculateRate({ baseRate: 10 } as never, 100, 2, 5);
    expect(result).toBe(12.5);
  });
});
