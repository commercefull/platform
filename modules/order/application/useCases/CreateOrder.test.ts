jest.mock('../../../../libs/uuid', () => ({
  generateUUID: jest.fn().mockReturnValue('order-uuid-1'),
}));

jest.mock('../../../../libs/db', () => ({
  withTransaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    return fn({});
  }),
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn().mockResolvedValue(undefined) },
}));

import { CreateOrderUseCase, CreateOrderCommand } from './CreateOrder';
import { OrderMustContainItemsError, CustomerEmailRequiredError} from '../../domain/errors/OrderErrors';

const mockOrderRepository = {
  save: jest.fn().mockResolvedValue({
    orderId: 'o1', orderNumber: 'ORD-001', status: 'pending',
    paymentStatus: 'pending', fulfillmentStatus: 'unfulfilled',
    customerId: 'c1', customerEmail: 'test@test.com',
    storeId: undefined, channelId: undefined, createdByUserId: undefined, orderSource: undefined,
    subtotal: { amount: 100 }, discountTotal: { amount: 0 },
    taxTotal: { amount: 0 }, shippingTotal: { amount: 0 },
    totalAmount: { amount: 100 }, totalItems: 1, totalQuantity: 2,
    currencyCode: 'USD', items: [], createdAt: new Date('2026-01-01'),
  }),
  recordStatusChange: jest.fn().mockResolvedValue(undefined),
  recordPaymentStatusChange: jest.fn().mockResolvedValue(undefined),
  recordFulfillmentStatusChange: jest.fn().mockResolvedValue(undefined),
};

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateOrderUseCase(mockOrderRepository as never);
  });

  it('should create order (happy path)', async () => {
    const result = await useCase.execute(new CreateOrderCommand(
      'c1', 'test@test.com',
      [{ productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 2, unitPrice: 50 }],
      { firstName: 'John', lastName: 'Doe', address1: '123 Main', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US', countryCode: 'US' },
    ));

    expect(result.orderId).toBe('o1');
    expect(result.orderNumber).toBe('ORD-001');
  });

  it('should throw OrderMustContainItemsError for empty items', async () => {
    await expect(useCase.execute(new CreateOrderCommand(
      'c1', 'test@test.com', [],
      { firstName: 'John', lastName: 'Doe', address1: '123 Main', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US', countryCode: 'US' },
    ))).rejects.toThrow(OrderMustContainItemsError);
  });

  it('should throw CustomerEmailRequiredError when email missing', async () => {
    await expect(useCase.execute(new CreateOrderCommand(
      'c1', '',
      [{ productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 1, unitPrice: 50 }],
      { firstName: 'John', lastName: 'Doe', address1: '123 Main', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US', countryCode: 'US' },
    ))).rejects.toThrow(CustomerEmailRequiredError);
  });
});
