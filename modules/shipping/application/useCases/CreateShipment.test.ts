jest.mock('../../infrastructure/repositories/ShippingConfigRepository', () => ({
  __esModule: true,
  default: {
    carriers: {
      findById: jest.fn().mockResolvedValue(null),
      findByCode: jest.fn().mockImplementation((code: string) => {
        if (code === 'ups') return Promise.resolve({
          shippingCarrierId: 'c1', name: 'UPS', code: 'ups', isActive: true,
          supportedServices: ['ground'], supportedRegions: ['US'], hasApiIntegration: true, requiresContract: false,
        });
        return Promise.resolve(null);
      }),
    },
    methods: {
      findById: jest.fn().mockResolvedValue(null),
      findByCode: jest.fn().mockImplementation((code: string) => {
        if (code === 'ground') return Promise.resolve({
          shippingMethodId: 'm1', name: 'Ground', code: 'ground', shippingCarrierId: 'c1',
          isActive: true, estimatedDeliveryDays: 5, handlingDays: 2,
        });
        return Promise.resolve(null);
      }),
      findAll: jest.fn().mockResolvedValue([]),
      findDefault: jest.fn().mockResolvedValue(null),
      findByCarrier: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      delete: jest.fn(),
    },
    zones: {
      findById: jest.fn(),
      findAll: jest.fn(),
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
      findByZoneAndMethod: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      delete: jest.fn(),
      calculateRate: jest.fn().mockReturnValue(10),
    },
  },
}));

jest.mock('../../../../libs/uuid', () => ({
  generateUUID: jest.fn().mockReturnValue('shipment-uuid-1'),
}));

import { CreateShipmentUseCase } from './CreateShipment';
import { ShippingCarrierNotFoundError, ShippingMethodNotFoundError } from '../../domain/errors/ShippingErrors';

describe('CreateShipmentUseCase', () => {
  let useCase: CreateShipmentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateShipmentUseCase();
  });

  it('should create shipment (happy path)', async () => {
    const result = await useCase.execute({
      orderId: 'o1',
      fromAddress: { street1: '123 Main', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US' },
      toAddress: { street1: '456 Oak', city: 'LA', state: 'CA', postalCode: '90001', country: 'US' },
      packages: [{ weight: 2, length: 10, width: 5, height: 3, value: 100 }],
      carrierCode: 'ups',
      serviceCode: 'ground',
    });

    expect(result.shipmentId).toBe('shipment-uuid-1');
    expect(result.trackingNumber).toContain('UPS');
    expect(result.status).toBe('pending');
    expect(result.labels).toHaveLength(1);
  });

  it('should throw ShippingCarrierNotFoundError when carrier not found', async () => {
    await expect(useCase.execute({
      orderId: 'o1',
      fromAddress: { street1: '123 Main', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US' },
      toAddress: { street1: '456 Oak', city: 'LA', state: 'CA', postalCode: '90001', country: 'US' },
      packages: [{ weight: 2, length: 10, width: 5, height: 3 }],
      carrierCode: 'nonexistent',
      serviceCode: 'ground',
    })).rejects.toThrow(ShippingCarrierNotFoundError);
  });

  it('should throw ShippingMethodNotFoundError when method not found', async () => {
    await expect(useCase.execute({
      orderId: 'o1',
      fromAddress: { street1: '123 Main', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US' },
      toAddress: { street1: '456 Oak', city: 'LA', state: 'CA', postalCode: '90001', country: 'US' },
      packages: [{ weight: 2, length: 10, width: 5, height: 3 }],
      carrierCode: 'ups',
      serviceCode: 'nonexistent',
    })).rejects.toThrow(ShippingMethodNotFoundError);
  });
});
