import { createOrder, emitMock } from '../../tests/testUtils';
import { CancelOrderUseCase, CancelOrderCommand } from './CancelOrder';
import { OrderNotFoundError, CancelOrderPermissionError, OrderCannotBeCancelledError } from '../../domain/errors/OrderErrors';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { Order } from '../../domain/entities/Order';

beforeEach(() => {
  emitMock.mockClear();
});

describe('CancelOrderUseCase', () => {
  let useCase: CancelOrderUseCase;
  let mockRepo: jest.Mocked<Pick<OrderRepository, 'findById' | 'save' | 'recordStatusChange'>>;
  let order: Order;
  let cancelSpy: jest.SpyInstance;

  beforeEach(() => {
    order = createOrder({ orderId: 'o1', orderNumber: 'ORD-001', customerId: 'c1' });
    cancelSpy = jest.spyOn(order, 'cancel');
    mockRepo = {
      findById: jest.fn().mockResolvedValue(order),
      save: jest.fn().mockResolvedValue(undefined as unknown as Order),
      recordStatusChange: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new CancelOrderUseCase(mockRepo as unknown as OrderRepository);
  });

  it('should cancel order (happy path)', async () => {
    const result = await useCase.execute(new CancelOrderCommand('o1', 'Customer request'));

    expect(result.orderId).toBe('o1');
    expect(result.reason).toBe('Customer request');
    expect(cancelSpy).toHaveBeenCalledWith('Customer request');
    expect(order.cancelledAt).not.toBeNull();
    expect(emitMock).toHaveBeenCalledWith('order.cancelled', expect.objectContaining({ orderId: 'o1' }));
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new CancelOrderCommand('missing', 'Test'))).rejects.toThrow(OrderNotFoundError);
  });

  it('should throw CancelOrderPermissionError when customer mismatch', async () => {
    await expect(useCase.execute(new CancelOrderCommand('o1', 'Test', 'other-customer'))).rejects.toThrow(CancelOrderPermissionError);
  });

  it('should throw OrderCannotBeCancelledError when order cannot be cancelled', async () => {
    order.cancel('already cancelled');

    await expect(useCase.execute(new CancelOrderCommand('o1', 'Test'))).rejects.toThrow(OrderCannotBeCancelledError);
  });
});
