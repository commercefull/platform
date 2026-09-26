import { createOrder } from '../../tests/testUtils';
import { UpdatePaymentStatusUseCase, UpdatePaymentStatusCommand } from './UpdatePaymentStatus';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';
import { BadRequestError } from '../../../../libs/errors';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { Order } from '../../domain/entities/Order';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';

describe('UpdatePaymentStatusUseCase', () => {
  let useCase: UpdatePaymentStatusUseCase;
  let mockRepo: jest.Mocked<Pick<OrderRepository, 'findById' | 'save' | 'recordPaymentStatusChange'>>;
  let order: Order;
  let updatePaymentStatusSpy: jest.SpyInstance;

  beforeEach(() => {
    order = createOrder({ orderId: 'o1', orderNumber: 'ORD-001' });
    updatePaymentStatusSpy = jest.spyOn(order, 'updatePaymentStatus');
    mockRepo = {
      findById: jest.fn().mockResolvedValue(order),
      save: jest.fn().mockResolvedValue(undefined as unknown as Order),
      recordPaymentStatusChange: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new UpdatePaymentStatusUseCase(mockRepo as unknown as OrderRepository);
  });

  it('should update payment status and record the change', async () => {
    const result = await useCase.execute(new UpdatePaymentStatusCommand('o1', PaymentStatus.PAID));

    expect(result.orderId).toBe('o1');
    expect(result.paymentStatus).toBe(PaymentStatus.PAID);
    expect(updatePaymentStatusSpy).toHaveBeenCalledWith(PaymentStatus.PAID);
    expect(mockRepo.save).toHaveBeenCalledWith(order);
    expect(mockRepo.recordPaymentStatusChange).toHaveBeenCalledWith('o1', PaymentStatus.PAID);
  });

  it('should throw BadRequestError when the status is not a valid payment status', async () => {
    await expect(useCase.execute(new UpdatePaymentStatusCommand('o1', 'bogus' as PaymentStatus))).rejects.toThrow(BadRequestError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw OrderNotFoundError when the order does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdatePaymentStatusCommand('missing', PaymentStatus.PAID))).rejects.toThrow(OrderNotFoundError);
  });
});
