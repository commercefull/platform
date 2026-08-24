jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/db', () => ({
  __esModule: true,
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

import { ProcessRefundUseCase, ProcessRefundCommand } from './ProcessRefund';
import { OrderNotFoundError, OrderCannotBeRefundedError, RefundAmountMustBePositiveError, RefundExceedsOrderTotalError } from '../../domain/errors/OrderErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ProcessRefundUseCase', () => {
  let useCase: ProcessRefundUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockOrder: Record<string, unknown>;

  beforeEach(() => {
    mockOrder = {
      orderId: 'o1', orderNumber: 'ORD-001', customerId: 'c1', status: 'processing',
      paymentStatus: 'paid', canBeRefunded: true, totalAmount: { amount: 100 },
      updatePaymentStatus: jest.fn(), updateStatus: jest.fn(), addAdminNote: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockOrder),
      save: jest.fn().mockResolvedValue(undefined),
      recordPaymentStatusChange: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ProcessRefundUseCase(mockRepo as never);
  });

  it('should process full refund (happy path)', async () => {
    const result = await useCase.execute(new ProcessRefundCommand('o1', 100, 'Customer request'));

    expect(result.orderId).toBe('o1');
    expect(result.isFullRefund).toBe(true);
    expect(mockOrder.updatePaymentStatus).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('order.refunded', expect.objectContaining({ orderId: 'o1', isFullRefund: true }));
  });

  it('should process partial refund', async () => {
    const result = await useCase.execute(new ProcessRefundCommand('o1', 50, 'Partial refund'));

    expect(result.isFullRefund).toBe(false);
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ProcessRefundCommand('missing', 50, 'Test'))).rejects.toThrow(OrderNotFoundError);
  });

  it('should throw OrderCannotBeRefundedError when order cannot be refunded', async () => {
    mockOrder.canBeRefunded = false;

    await expect(useCase.execute(new ProcessRefundCommand('o1', 50, 'Test'))).rejects.toThrow(OrderCannotBeRefundedError);
  });

  it('should throw RefundAmountMustBePositiveError for zero amount', async () => {
    await expect(useCase.execute(new ProcessRefundCommand('o1', 0, 'Test'))).rejects.toThrow(RefundAmountMustBePositiveError);
  });

  it('should throw RefundExceedsOrderTotalError when amount exceeds total', async () => {
    await expect(useCase.execute(new ProcessRefundCommand('o1', 200, 'Test'))).rejects.toThrow(RefundExceedsOrderTotalError);
  });
});
