jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/db', () => ({
  __esModule: true,
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

import { CancelOrderUseCase, CancelOrderCommand } from './CancelOrder';
import { OrderNotFoundError, CancelOrderPermissionError, OrderCannotBeCancelledError } from '../../domain/errors/OrderErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CancelOrderUseCase', () => {
  let useCase: CancelOrderUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockOrder: Record<string, unknown>;

  beforeEach(() => {
    mockOrder = {
      orderId: 'o1', orderNumber: 'ORD-001', customerId: 'c1', status: 'pending',
      canBeCancelled: true, cancelledAt: null, totalAmount: { amount: 100 },
      cancel: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockOrder),
      save: jest.fn().mockResolvedValue(undefined),
      recordStatusChange: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new CancelOrderUseCase(mockRepo as never);
  });

  it('should cancel order (happy path)', async () => {
    mockOrder.cancelledAt = new Date();

    const result = await useCase.execute(new CancelOrderCommand('o1', 'Customer request'));

    expect(result.orderId).toBe('o1');
    expect(result.reason).toBe('Customer request');
    expect(mockOrder.cancel).toHaveBeenCalledWith('Customer request');
    expect(eventBus.emit).toHaveBeenCalledWith('order.cancelled', expect.objectContaining({ orderId: 'o1' }));
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new CancelOrderCommand('missing', 'Test'))).rejects.toThrow(OrderNotFoundError);
  });

  it('should throw CancelOrderPermissionError when customer mismatch', async () => {
    await expect(useCase.execute(new CancelOrderCommand('o1', 'Test', 'other-customer'))).rejects.toThrow(CancelOrderPermissionError);
  });

  it('should throw OrderCannotBeCancelledError when order cannot be cancelled', async () => {
    mockOrder.canBeCancelled = false;

    await expect(useCase.execute(new CancelOrderCommand('o1', 'Test'))).rejects.toThrow(OrderCannotBeCancelledError);
  });
});
