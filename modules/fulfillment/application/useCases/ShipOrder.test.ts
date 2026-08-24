/**
 * Unit Tests for ShipOrder Use Case
 */

jest.mock('../../domain/events/FulfillmentEvents', () => ({
  __esModule: true,
  emitFulfillmentShipped: jest.fn(),
}));

import { ShipOrderUseCase } from './ShipOrder';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';
import { Fulfillment } from '../../domain/entities/Fulfillment';
import { emitFulfillmentShipped } from '../../domain/events/FulfillmentEvents';

describe('ShipOrderUseCase', () => {
  let useCase: ShipOrderUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockImplementation(async (f: unknown) => f),
    };
    useCase = new ShipOrderUseCase(mockRepo as never as ConstructorParameters<typeof ShipOrderUseCase>[0]);
    jest.mocked(emitFulfillmentShipped).mockClear();
  });

  function createFulfillment(status: string): Fulfillment {
    return Fulfillment.fromPersistence({
      fulfillmentId: 'ful-1',
      orderId: 'ord-1',
      orderNumber: 'ORD-001',
      sourceType: 'warehouse',
      sourceId: 'wh-1',
      status: status as never as import('../../domain/entities/Fulfillment').FulfillmentStatus,
      shipFromAddress: { addressLine1: '123 St', city: 'Portland', postalCode: '97201', countryCode: 'US' },
      shipToAddress: { addressLine1: '456 Ave', city: 'Seattle', postalCode: '98101', countryCode: 'US' },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
  }

  it('should ship from packed status', async () => {
    mockRepo.findById.mockResolvedValue(createFulfillment('packed'));

    const result = await useCase.execute({
      fulfillmentId: 'ful-1',
      trackingNumber: 'TRK-123',
      carrierId: 'fedex',
      carrierName: 'FedEx',
    });

    expect(result.fulfillment.status).toBe('shipped');
    expect(result.fulfillment.trackingNumber).toBe('TRK-123');
    expect(result.fulfillment.carrierName).toBe('FedEx');
  });

  it('should ship from ready_to_ship status', async () => {
    mockRepo.findById.mockResolvedValue(createFulfillment('ready_to_ship'));

    const result = await useCase.execute({
      fulfillmentId: 'ful-1',
      trackingNumber: 'TRK-456',
    });

    expect(result.fulfillment.status).toBe('shipped');
  });

  it('should throw FulfillmentNotFoundError when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ fulfillmentId: 'ful-x', trackingNumber: 'TRK-1' }),
    ).rejects.toThrow(FulfillmentNotFoundError);
  });

  it('should emit fulfillment.shipped event', async () => {
    mockRepo.findById.mockResolvedValue(createFulfillment('packed'));

    await useCase.execute({
      fulfillmentId: 'ful-1',
      trackingNumber: 'TRK-123',
      trackingUrl: 'https://track.example.com/TRK-123',
      carrierName: 'FedEx',
    });

    expect(emitFulfillmentShipped).toHaveBeenCalledWith(expect.objectContaining({
      fulfillmentId: 'ful-1',
      orderId: 'ord-1',
      trackingNumber: 'TRK-123',
      trackingUrl: 'https://track.example.com/TRK-123',
      carrierName: 'FedEx',
    }));
  });

  it('should save the fulfillment after shipping', async () => {
    mockRepo.findById.mockResolvedValue(createFulfillment('packed'));

    await useCase.execute({ fulfillmentId: 'ful-1', trackingNumber: 'TRK-123' });

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });
});
