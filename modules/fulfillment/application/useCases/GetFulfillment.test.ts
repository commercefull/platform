/**
 * Unit Tests for GetFulfillment Use Case
 */

import { GetFulfillmentUseCase } from './GetFulfillment';
import { FulfillmentValidationError } from '../../domain/errors/FulfillmentErrors';
import { Fulfillment } from '../../domain/entities/Fulfillment';
import { FulfillmentItem } from '../../domain/entities/FulfillmentItem';

describe('GetFulfillmentUseCase', () => {
  let useCase: GetFulfillmentUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findByTrackingNumber: jest.fn(),
      findItemsByFulfillmentId: jest.fn(),
    };
    useCase = new GetFulfillmentUseCase(mockRepo as never as ConstructorParameters<typeof GetFulfillmentUseCase>[0]);
  });

  function createFulfillment(): Fulfillment {
    return Fulfillment.fromPersistence({
      fulfillmentId: 'ful-1',
      orderId: 'ord-1',
      sourceType: 'warehouse',
      sourceId: 'wh-1',
      status: 'pending',
      shipFromAddress: { addressLine1: '123 St', city: 'Portland', postalCode: '97201', countryCode: 'US' },
      shipToAddress: { addressLine1: '456 Ave', city: 'Seattle', postalCode: '98101', countryCode: 'US' },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
  }

  it('should find by fulfillmentId and return items', async () => {
    mockRepo.findById.mockResolvedValue(createFulfillment());
    mockRepo.findItemsByFulfillmentId.mockResolvedValue([]);

    const result = await useCase.execute({ fulfillmentId: 'ful-1' });

    expect(result.fulfillment).not.toBeNull();
    expect(result.fulfillment!.fulfillmentId).toBe('ful-1');
    expect(result.items).toEqual([]);
    expect(mockRepo.findById).toHaveBeenCalledWith('ful-1');
  });

  it('should find by trackingNumber', async () => {
    mockRepo.findByTrackingNumber.mockResolvedValue(createFulfillment());
    mockRepo.findItemsByFulfillmentId.mockResolvedValue([]);

    const result = await useCase.execute({ trackingNumber: 'TRK-123' });

    expect(result.fulfillment).not.toBeNull();
    expect(mockRepo.findByTrackingNumber).toHaveBeenCalledWith('TRK-123');
  });

  it('should return null fulfillment when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ fulfillmentId: 'ful-x' });

    expect(result.fulfillment).toBeNull();
    expect(result.items).toEqual([]);
  });

  it('should throw when neither fulfillmentId nor trackingNumber provided', async () => {
    await expect(useCase.execute({})).rejects.toThrow(FulfillmentValidationError);
  });

  it('should return items for found fulfillment', async () => {
    mockRepo.findById.mockResolvedValue(createFulfillment());
    const item = FulfillmentItem.fromPersistence({
      fulfillmentItemId: 'item-1',
      fulfillmentId: 'ful-1',
      orderItemId: 'oi-1',
      productId: 'prod-1',
      sku: 'SKU-1',
      name: 'Widget',
      quantityOrdered: 5,
      quantityFulfilled: 0,
      isPicked: false,
      isPacked: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
    mockRepo.findItemsByFulfillmentId.mockResolvedValue([item]);

    const result = await useCase.execute({ fulfillmentId: 'ful-1' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].sku).toBe('SKU-1');
  });
});
