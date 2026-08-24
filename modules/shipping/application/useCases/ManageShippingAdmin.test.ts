jest.mock('../../infrastructure/repositories/ShippingConfigRepository', () => ({
  __esModule: true,
  default: {
    carriers: {},
    methods: {
      findById: jest.fn().mockResolvedValue({ shippingMethodId: 'm1', name: 'Ground' }),
      findAll: jest.fn().mockResolvedValue([{ shippingMethodId: 'm1' }]),
      findByCarrier: jest.fn(),
      findByCode: jest.fn(),
      findDefault: jest.fn(),
      create: jest.fn().mockResolvedValue({ shippingMethodId: 'm2', name: 'Express' }),
      update: jest.fn().mockResolvedValue({ shippingMethodId: 'm1', name: 'Updated' }),
      activate: jest.fn().mockResolvedValue(true),
      deactivate: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
    },
    zones: {
      findById: jest.fn().mockResolvedValue({ shippingZoneId: 'z1', name: 'US' }),
      findAll: jest.fn().mockResolvedValue([{ shippingZoneId: 'z1' }]),
      findByLocation: jest.fn(),
      create: jest.fn().mockResolvedValue({ shippingZoneId: 'z2', name: 'EU' }),
      update: jest.fn().mockResolvedValue({ shippingZoneId: 'z1', name: 'Updated' }),
      activate: jest.fn().mockResolvedValue(true),
      deactivate: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
    },
    rates: {},
  },
}));

import { ManageShippingZonesUseCase, ManageShippingMethodsUseCase } from './ManageShippingAdmin';

describe('ManageShippingZonesUseCase', () => {
  let useCase: ManageShippingZonesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageShippingZonesUseCase();
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('z1');
    expect(result).toEqual({ shippingZoneId: 'z1', name: 'US' });
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should create', async () => {
    const result = await useCase.create({ name: 'EU' } as never);
    expect(result).toEqual({ shippingZoneId: 'z2', name: 'EU' });
  });

  it('should activate', async () => {
    const result = await useCase.activate('z1');
    expect(result).toBe(true);
  });

  it('should delete', async () => {
    const result = await useCase.delete('z1');
    expect(result).toBe(true);
  });
});

describe('ManageShippingMethodsUseCase', () => {
  let useCase: ManageShippingMethodsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageShippingMethodsUseCase();
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('m1');
    expect(result).toEqual({ shippingMethodId: 'm1', name: 'Ground' });
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should create', async () => {
    const result = await useCase.create({ name: 'Express' } as never);
    expect(result).toEqual({ shippingMethodId: 'm2', name: 'Express' });
  });

  it('should deactivate', async () => {
    const result = await useCase.deactivate('m1');
    expect(result).toBe(true);
  });
});
