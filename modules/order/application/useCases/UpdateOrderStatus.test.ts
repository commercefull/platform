import { createOrder, emitMock } from '../../tests/testUtils';
import { UpdateOrderStatusUseCase, UpdateOrderStatusCommand } from './UpdateOrderStatus';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { Order } from '../../domain/entities/Order';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';

beforeEach(() => {
  emitMock.mockClear();
});

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;
  let mockRepo: jest.Mocked<Pick<OrderRepository, 'findById' | 'save' | 'recordStatusChange'>>;
  let order: Order;
  let updateStatusSpy: jest.SpyInstance;

  beforeEach(() => {
    order = createOrder({ orderId: 'o1', orderNumber: 'ORD-001' });
    updateStatusSpy = jest.spyOn(order, 'updateStatus');
    mockRepo = {
      findById: jest.fn().mockResolvedValue(order),
      save: jest.fn().mockResolvedValue(undefined as unknown as Order),
      recordStatusChange: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new UpdateOrderStatusUseCase(mockRepo as unknown as OrderRepository);
  });

  it('should update order status (happy path)', async () => {
    const result = await useCase.execute(new UpdateOrderStatusCommand('o1', OrderStatus.PROCESSING));

    expect(result.orderId).toBe('o1');
    expect(result.previousStatus).toBe('pending');
    expect(result.newStatus).toBe('processing');
    expect(updateStatusSpy).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('order.status_changed', expect.objectContaining({ orderId: 'o1' }));
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateOrderStatusCommand('missing', OrderStatus.PROCESSING))).rejects.toThrow(OrderNotFoundError);
  });
});
