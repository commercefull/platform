import { createOrder } from '../../tests/testUtils';
import { UpdateFulfillmentStatusUseCase, UpdateFulfillmentStatusCommand } from './UpdateFulfillmentStatus';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';
import { BadRequestError } from '../../../../libs/errors';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { Order } from '../../domain/entities/Order';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';

describe('UpdateFulfillmentStatusUseCase', () => {
  let useCase: UpdateFulfillmentStatusUseCase;
  let mockRepo: jest.Mocked<Pick<OrderRepository, 'findById' | 'save' | 'recordFulfillmentStatusChange'>>;
  let order: Order;
  let updateFulfillmentStatusSpy: jest.SpyInstance;

  beforeEach(() => {
    order = createOrder({ orderId: 'o1', orderNumber: 'ORD-001' });
    updateFulfillmentStatusSpy = jest.spyOn(order, 'updateFulfillmentStatus');
    mockRepo = {
      findById: jest.fn().mockResolvedValue(order),
      save: jest.fn().mockResolvedValue(undefined as unknown as Order),
      recordFulfillmentStatusChange: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new UpdateFulfillmentStatusUseCase(mockRepo as unknown as OrderRepository);
  });

  it('should update fulfillment status and record the change', async () => {
    const result = await useCase.execute(new UpdateFulfillmentStatusCommand('o1', FulfillmentStatus.FULFILLED));

    expect(result.orderId).toBe('o1');
    expect(result.fulfillmentStatus).toBe(FulfillmentStatus.FULFILLED);
    expect(updateFulfillmentStatusSpy).toHaveBeenCalledWith(FulfillmentStatus.FULFILLED);
    expect(mockRepo.save).toHaveBeenCalledWith(order);
    expect(mockRepo.recordFulfillmentStatusChange).toHaveBeenCalledWith('o1', FulfillmentStatus.FULFILLED);
  });

  it('should throw BadRequestError when the status is not a valid fulfillment status', async () => {
    await expect(useCase.execute(new UpdateFulfillmentStatusCommand('o1', 'bogus' as FulfillmentStatus))).rejects.toThrow(BadRequestError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw OrderNotFoundError when the order does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateFulfillmentStatusCommand('missing', FulfillmentStatus.FULFILLED))).rejects.toThrow(OrderNotFoundError);
  });
});
