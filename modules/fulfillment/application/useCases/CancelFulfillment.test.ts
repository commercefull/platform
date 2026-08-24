/**
 * Unit Tests for CancelFulfillment Use Case
 */

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CancelFulfillmentUseCase, CancelFulfillmentCommand } from './CancelFulfillment';
import { FulfillmentNotFoundError, FulfillmentValidationError } from '../../domain/errors/FulfillmentErrors';
import { Fulfillment } from '../../domain/entities/Fulfillment';
import { eventBus } from '../../../../libs/events/eventBus';

describe('CancelFulfillmentUseCase', () => {
  let useCase: CancelFulfillmentUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockImplementation(async (f: unknown) => f),
    };
    useCase = new CancelFulfillmentUseCase(mockRepo as never as ConstructorParameters<typeof CancelFulfillmentUseCase>[0]);
    jest.mocked(eventBus.emit).mockClear();
  });

  function createFulfillment(status: string): Fulfillment {
    return Fulfillment.fromPersistence({
      fulfillmentId: 'ful-1',
      orderId: 'ord-1',
      sourceType: 'warehouse',
      sourceId: 'wh-1',
      status: status as never as import('../../domain/entities/Fulfillment').FulfillmentStatus,
      shipFromAddress: { addressLine1: '123 St', city: 'Portland', postalCode: '97201', countryCode: 'US' },
      shipToAddress: { addressLine1: '456 Ave', city: 'Seattle', postalCode: '98101', countryCode: 'US' },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
  }

  it('should cancel a pending fulfillment', async () => {
    mockRepo.findById.mockResolvedValue(createFulfillment('pending'));

    const result = await useCase.execute(new CancelFulfillmentCommand('ful-1', 'Customer request'));

    expect(result.fulfillment.status).toBe('cancelled');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(eventBus.emit).toHaveBeenCalledWith('fulfillment.cancelled', expect.objectContaining({
      fulfillmentId: 'ful-1',
      orderId: 'ord-1',
      reason: 'Customer request',
    }));
  });

  it('should cancel a picking fulfillment', async () => {
    mockRepo.findById.mockResolvedValue(createFulfillment('picking'));

    const result = await useCase.execute(new CancelFulfillmentCommand('ful-1'));

    expect(result.fulfillment.status).toBe('cancelled');
  });

  it('should throw FulfillmentNotFoundError when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(new CancelFulfillmentCommand('ful-x')),
    ).rejects.toThrow(FulfillmentNotFoundError);
  });

  it('should throw when trying to cancel a delivered fulfillment', async () => {
    mockRepo.findById.mockResolvedValue(createFulfillment('delivered'));

    await expect(
      useCase.execute(new CancelFulfillmentCommand('ful-1')),
    ).rejects.toThrow(FulfillmentValidationError);
  });

  it('should pass reason to event', async () => {
    mockRepo.findById.mockResolvedValue(createFulfillment('pending'));

    await useCase.execute(new CancelFulfillmentCommand('ful-1', 'Out of stock'));

    expect(eventBus.emit).toHaveBeenCalledWith('fulfillment.cancelled', expect.objectContaining({
      reason: 'Out of stock',
    }));
  });
});
