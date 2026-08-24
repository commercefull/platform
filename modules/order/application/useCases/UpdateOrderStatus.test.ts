jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/db', () => ({
  __esModule: true,
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

import { UpdateOrderStatusUseCase, UpdateOrderStatusCommand } from './UpdateOrderStatus';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockOrder: Record<string, unknown>;

  beforeEach(() => {
    mockOrder = {
      orderId: 'o1', orderNumber: 'ORD-001', status: 'pending', updatedAt: new Date(),
      updateStatus: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockOrder),
      save: jest.fn().mockResolvedValue(undefined),
      recordStatusChange: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new UpdateOrderStatusUseCase(mockRepo as never);
  });

  it('should update order status (happy path)', async () => {
    const result = await useCase.execute(new UpdateOrderStatusCommand('o1', 'processing' as never));

    expect(result.orderId).toBe('o1');
    expect(result.previousStatus).toBe('pending');
    expect(result.newStatus).toBe('processing');
    expect(mockOrder.updateStatus).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('order.status_changed', expect.objectContaining({ orderId: 'o1' }));
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateOrderStatusCommand('missing', 'processing' as never))).rejects.toThrow(OrderNotFoundError);
  });
});
