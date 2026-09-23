import { GetOrderDetailsUseCase, GetOrderDetailsCommand } from './GetOrderDetails';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { OrderQueryRepository } from '../../domain/repositories/OrderQueryRepository';
import { createOrder } from '../../tests/testUtils';

describe('GetOrderDetailsUseCase', () => {
  let useCase: GetOrderDetailsUseCase;
  let mockOrderRepo: jest.Mocked<Pick<OrderRepository, 'findById'>>;
  let mockQueryRepo: jest.Mocked<
    Pick<
      OrderQueryRepository,
      'findShippingByOrder' | 'findShippingRatesByOrder' | 'findTaxesByOrder' | 'findDiscountsByOrder' | 'findPaymentsByOrder' | 'findRefundsByOrder'
    >
  >;

  beforeEach(() => {
    mockOrderRepo = { findById: jest.fn().mockResolvedValue(createOrder({ orderId: 'o1', orderNumber: 'ORD-001' })) };
    mockQueryRepo = {
      findShippingByOrder: jest.fn().mockResolvedValue([]),
      findShippingRatesByOrder: jest.fn().mockResolvedValue([]),
      findTaxesByOrder: jest.fn().mockResolvedValue([]),
      findDiscountsByOrder: jest.fn().mockResolvedValue([]),
      findPaymentsByOrder: jest.fn().mockResolvedValue([]),
      findRefundsByOrder: jest.fn().mockResolvedValue([]),
    };
    useCase = new GetOrderDetailsUseCase(
      mockOrderRepo as unknown as OrderRepository,
      mockQueryRepo as unknown as OrderQueryRepository,
    );
  });

  it('should get order details (happy path)', async () => {
    const result = await useCase.execute(new GetOrderDetailsCommand('o1'));

    expect(result).not.toBeNull();
    expect(result!.orderId).toBe('o1');
    expect(result!.orderNumber).toBe('ORD-001');
    expect(result!.shipping).toEqual([]);
    expect(result!.payments).toEqual([]);
  });

  it('should return null when order not found', async () => {
    mockOrderRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute(new GetOrderDetailsCommand('missing'));

    expect(result).toBeNull();
  });
});
