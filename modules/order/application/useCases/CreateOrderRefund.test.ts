/**
 * Unit Tests for CreateOrderRefund Use Case
 */

import { CreateOrderRefundUseCase, CreateOrderRefundCommand } from './CreateOrderRefund';
import {
  OrderPaymentNotFoundError,
  RefundAmountMustBePositiveError,
  RefundExceedsRefundableBalanceError,
} from '../../domain/errors/OrderErrors';

import type { OrderQueryRepository, OrderPayment, OrderPaymentRefund } from '../../domain/repositories/OrderQueryRepository';

function createMockPayment(overrides: Partial<OrderPayment> = {}): OrderPayment {
  return {
    orderPaymentId: 'pay-1',
    orderId: 'o-1',
    paymentMethod: 'card',
    amount: 100,
    refundedAmount: 0,
    status: 'paid',
    ...overrides,
  } as OrderPayment;
}

function createMockQueryRepo(
  payment: OrderPayment | null = createMockPayment(),
): jest.Mocked<OrderQueryRepository> {
  return {
    findNotesByOrder: jest.fn().mockResolvedValue([]),
    createNote: jest.fn(),
    softDeleteNote: jest.fn(),
    findDiscountsByOrder: jest.fn().mockResolvedValue([]),
    createDiscount: jest.fn(),
    findShippingByOrder: jest.fn().mockResolvedValue([]),
    createShipping: jest.fn(),
    updateShipping: jest.fn(),
    findShippingRatesByOrder: jest.fn().mockResolvedValue([]),
    createShippingRate: jest.fn(),
    findTaxesByOrder: jest.fn().mockResolvedValue([]),
    createTax: jest.fn(),
    findPaymentsByOrder: jest.fn().mockResolvedValue([]),
    findPaymentById: jest.fn().mockResolvedValue(payment),
    createPayment: jest.fn(),
    findRefundsByOrder: jest.fn().mockResolvedValue([]),
    findRefundById: jest.fn().mockResolvedValue(null),
    createRefund: jest.fn().mockResolvedValue({
      orderPaymentRefundId: 'ref-1',
      orderPaymentId: 'pay-1',
      amount: 50,
      reason: 'partial',
      notes: undefined,
      transactionId: undefined,
      status: 'pending',
      refundedBy: 'admin-1',
      createdAt: new Date().toISOString(),
    } as OrderPaymentRefund),
  } as never as jest.Mocked<OrderQueryRepository>;
}

describe('CreateOrderRefundUseCase', () => {
  it('should create a refund for a valid payment', async () => {
    const queryRepo = createMockQueryRepo();
    const useCase = new CreateOrderRefundUseCase(queryRepo);

    const result = await useCase.execute(
      new CreateOrderRefundCommand('pay-1', 50, 'partial refund'),
    );

    expect(result.orderPaymentRefundId).toBe('ref-1');
    expect(result.amount).toBe(50);
    expect(queryRepo.createRefund).toHaveBeenCalled();
  });

  it('should throw OrderPaymentNotFoundError when payment does not exist', async () => {
    const queryRepo = createMockQueryRepo(null);
    const useCase = new CreateOrderRefundUseCase(queryRepo);

    await expect(
      useCase.execute(new CreateOrderRefundCommand('nonexistent', 50)),
    ).rejects.toThrow(OrderPaymentNotFoundError);
  });

  it('should throw RefundAmountMustBePositiveError for zero amount', async () => {
    const queryRepo = createMockQueryRepo();
    const useCase = new CreateOrderRefundUseCase(queryRepo);

    await expect(
      useCase.execute(new CreateOrderRefundCommand('pay-1', 0)),
    ).rejects.toThrow(RefundAmountMustBePositiveError);
  });

  it('should throw RefundExceedsRefundableBalanceError when amount exceeds refundable', async () => {
    const payment = createMockPayment({ amount: 100, refundedAmount: 80 });
    const queryRepo = createMockQueryRepo(payment);
    const useCase = new CreateOrderRefundUseCase(queryRepo);

    await expect(
      useCase.execute(new CreateOrderRefundCommand('pay-1', 50)),
    ).rejects.toThrow(RefundExceedsRefundableBalanceError);
  });
});
