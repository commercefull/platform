import { GetOrderDetailsUseCase, GetOrderDetailsCommand } from './GetOrderDetails';

describe('GetOrderDetailsUseCase', () => {
  let useCase: GetOrderDetailsUseCase;
  let mockOrderRepo: Record<string, jest.Mock>;
  let mockQueryRepo: Record<string, jest.Mock>;

  const makeOrder = () => ({
    orderId: 'o1', orderNumber: 'ORD-001', status: 'processing', paymentStatus: 'paid',
    fulfillmentStatus: 'unfulfilled', currencyCode: 'USD', customerEmail: 'test@test.com',
    subtotal: 100, discountTotal: 10, taxTotal: 8, shippingTotal: 5, totalAmount: 103,
    createdAt: new Date(), updatedAt: new Date(),
  });

  beforeEach(() => {
    mockOrderRepo = { findById: jest.fn().mockResolvedValue(makeOrder()) };
    mockQueryRepo = {
      findShippingByOrder: jest.fn().mockResolvedValue([]),
      findShippingRatesByOrder: jest.fn().mockResolvedValue([]),
      findTaxesByOrder: jest.fn().mockResolvedValue([]),
      findDiscountsByOrder: jest.fn().mockResolvedValue([]),
      findPaymentsByOrder: jest.fn().mockResolvedValue([]),
      findRefundsByOrder: jest.fn().mockResolvedValue([]),
    };
    useCase = new GetOrderDetailsUseCase(mockOrderRepo as never, mockQueryRepo as never);
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
