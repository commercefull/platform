import { emitMock } from '../../tests/testUtils';
import { CreateOrderUseCase, CreateOrderCommand } from './CreateOrder';
import { OrderMustContainItemsError, CustomerEmailRequiredError, ShippingAddressRequiredError } from '../../domain/errors/OrderErrors';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { Order } from '../../domain/entities/Order';
import type { AddressInput } from './CreateOrder';

const mockOrderRepository: jest.Mocked<
  Pick<OrderRepository, 'save' | 'recordStatusChange' | 'recordPaymentStatusChange' | 'recordFulfillmentStatusChange'>
> = {
  save: jest.fn().mockResolvedValue({
    orderId: 'o1',
    orderNumber: 'ORD-001',
    status: 'pending',
    paymentStatus: 'pending',
    fulfillmentStatus: 'unfulfilled',
    customerId: 'c1',
    customerEmail: 'test@test.com',
    storeId: undefined,
    channelId: undefined,
    createdByUserId: undefined,
    orderSource: undefined,
    subtotal: { cents: 10000 },
    discountTotal: { cents: 0 },
    taxTotal: { cents: 0 },
    shippingTotal: { cents: 0 },
    totalAmount: { cents: 10000 },
    totalItems: 1,
    totalQuantity: 2,
    currencyCode: 'USD',
    items: [],
    createdAt: new Date('2026-01-01'),
  } as unknown as Order),
  recordStatusChange: jest.fn().mockResolvedValue(undefined),
  recordPaymentStatusChange: jest.fn().mockResolvedValue(undefined),
  recordFulfillmentStatusChange: jest.fn().mockResolvedValue(undefined),
};

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateOrderUseCase(mockOrderRepository as unknown as OrderRepository);
  });

  it('should create order (happy path)', async () => {
    const result = await useCase.execute(
      new CreateOrderCommand('c1', 'test@test.com', [{ productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 2, unitPriceCents: 5000 }], {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main',
        city: 'NYC',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        countryCode: 'US',
      }),
    );

    expect(result.orderId).toBe('o1');
    expect(result.orderNumber).toBe('ORD-001');
    expect(emitMock).toHaveBeenCalledWith('order.created', expect.objectContaining({ orderId: 'o1', orderNumber: 'ORD-001' }));
  });

  it('should throw OrderMustContainItemsError for empty items', async () => {
    await expect(
      useCase.execute(
        new CreateOrderCommand('c1', 'test@test.com', [], {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main',
          city: 'NYC',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          countryCode: 'US',
        }),
      ),
    ).rejects.toThrow(OrderMustContainItemsError);
  });

  it('should throw CustomerEmailRequiredError when email missing', async () => {
    await expect(
      useCase.execute(
        new CreateOrderCommand('c1', '', [{ productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 1, unitPriceCents: 5000 }], {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main',
          city: 'NYC',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          countryCode: 'US',
        }),
      ),
    ).rejects.toThrow(CustomerEmailRequiredError);
  });

  it('should throw ShippingAddressRequiredError when address is missing', async () => {
    await expect(
      useCase.execute(
        new CreateOrderCommand('c1', 'test@test.com', [{ productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 1, unitPriceCents: 5000 }], undefined as unknown as AddressInput),
      ),
    ).rejects.toThrow(ShippingAddressRequiredError);
  });
});
