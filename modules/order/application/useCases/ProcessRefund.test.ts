import { createOrder, createOrderItem, emitMock } from '../../tests/testUtils';
import { ProcessRefundUseCase, ProcessRefundCommand } from './ProcessRefund';
import {
  OrderNotFoundError,
  OrderCannotBeRefundedError,
  RefundAmountMustBePositiveError,
  RefundExceedsOrderTotalError,
} from '../../domain/errors/OrderErrors';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { Order } from '../../domain/entities/Order';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { Money } from '../../domain/valueObjects/Money';

beforeEach(() => {
  emitMock.mockClear();
});

describe('ProcessRefundUseCase', () => {
  let useCase: ProcessRefundUseCase;
  let mockRepo: jest.Mocked<Pick<OrderRepository, 'findById' | 'save' | 'recordPaymentStatusChange'>>;
  let order: Order;
  let updatePaymentStatusSpy: jest.SpyInstance;

  const paidOrder = (): Order => {
    const o = createOrder({ orderId: 'o1', orderNumber: 'ORD-001', customerId: 'c1' });
    o.addItem(createOrderItem({ unitPrice: Money.create(100, 'USD') }));
    o.updateStatus(OrderStatus.PROCESSING);
    o.updatePaymentStatus(PaymentStatus.PAID);
    return o;
  };

  beforeEach(() => {
    order = paidOrder();
    updatePaymentStatusSpy = jest.spyOn(order, 'updatePaymentStatus');
    mockRepo = {
      findById: jest.fn().mockResolvedValue(order),
      save: jest.fn().mockResolvedValue(undefined as unknown as Order),
      recordPaymentStatusChange: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ProcessRefundUseCase(mockRepo as unknown as OrderRepository);
  });

  it('should process full refund (happy path)', async () => {
    const result = await useCase.execute(new ProcessRefundCommand('o1', 100, 'Customer request'));

    expect(result.orderId).toBe('o1');
    expect(result.isFullRefund).toBe(true);
    expect(updatePaymentStatusSpy).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('order.refunded', expect.objectContaining({ orderId: 'o1', isFullRefund: true }));
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
    mockRepo.findById.mockResolvedValue(createOrder({ orderId: 'o1' }));

    await expect(useCase.execute(new ProcessRefundCommand('o1', 50, 'Test'))).rejects.toThrow(OrderCannotBeRefundedError);
  });

  it('should throw RefundAmountMustBePositiveError for zero amount', async () => {
    await expect(useCase.execute(new ProcessRefundCommand('o1', 0, 'Test'))).rejects.toThrow(RefundAmountMustBePositiveError);
  });

  it('should throw RefundExceedsOrderTotalError when amount exceeds total', async () => {
    await expect(useCase.execute(new ProcessRefundCommand('o1', 200, 'Test'))).rejects.toThrow(RefundExceedsOrderTotalError);
  });
});
