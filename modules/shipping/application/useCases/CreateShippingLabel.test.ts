jest.mock('../../infrastructure/repositories/ShippingConfigRepository', () => ({
  __esModule: true,
  default: {
    carriers: {
      findById: jest.fn().mockResolvedValue({
        shippingCarrierId: 'c1', name: 'UPS', isActive: true,
      }),
    },
    methods: {},
    zones: {},
    rates: {},
  },
}));

jest.mock('../../infrastructure/repositories/ShippingLabelAggregateRepository', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue({
      shippingLabelId: 'l1', shippingCarrierId: 'c1', trackingNumber: 'TRK123',
      carrierName: 'UPS', labelFormat: 'PDF', orderId: 'o1',
    }),
  },
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

import { CreateShippingLabelUseCase } from './CreateShippingLabel';
import { ShippingCarrierNotFoundError, ShippingValidationError } from '../../domain/errors/ShippingErrors';
import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';
import { eventBus } from '../../../../libs/events/eventBus';

const mockCarrierRepo = shippingConfigRepository as unknown as { carriers: Record<string, jest.Mock> };

describe('CreateShippingLabelUseCase', () => {
  let useCase: CreateShippingLabelUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateShippingLabelUseCase();
  });

  it('should create shipping label (happy path)', async () => {
    const result = await useCase.execute({
      shippingCarrierId: 'c1', trackingNumber: 'TRK123', orderId: 'o1',
    });

    expect(result.shippingLabelId).toBe('l1');
    expect(result.trackingNumber).toBe('TRK123');
    expect(eventBus.emit).toHaveBeenCalledWith('shipping.label_created', expect.objectContaining({
      shippingLabelId: 'l1',
    }));
  });

  it('should throw ShippingCarrierNotFoundError when carrier not found', async () => {
    mockCarrierRepo.carriers.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute({
      shippingCarrierId: 'nonexistent', trackingNumber: 'TRK123',
    })).rejects.toThrow(ShippingCarrierNotFoundError);
  });

  it('should throw ShippingValidationError when carrier is inactive', async () => {
    mockCarrierRepo.carriers.findById.mockResolvedValueOnce({
      shippingCarrierId: 'c1', name: 'UPS', isActive: false,
    });

    await expect(useCase.execute({
      shippingCarrierId: 'c1', trackingNumber: 'TRK123',
    })).rejects.toThrow(ShippingValidationError);
  });
});
