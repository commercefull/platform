import { OrderOrderPlacementAdapter } from './OrderOrderPlacementAdapter';
import type { OrderRepository } from '../../../order/domain/repositories/OrderRepository';
import type { Order } from '../../../order/domain/entities/Order';
import type { CreateOrderUseCase } from '../../../order/application/useCases/CreateOrder';
import type { CancelOrderUseCase } from '../../../order/application/useCases/CancelOrder';
import { OrderStatus } from '../../../order/domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../../order/domain/valueObjects/PaymentStatus';

describe('OrderOrderPlacementAdapter', () => {
  let adapter: OrderOrderPlacementAdapter;
  let mockOrderRepo: jest.Mocked<Pick<OrderRepository, 'findById' | 'save'>>;
  let createOrderUseCase: jest.Mocked<Pick<CreateOrderUseCase, 'execute'>>;
  let cancelOrderUseCase: jest.Mocked<Pick<CancelOrderUseCase, 'execute'>>;

  beforeEach(() => {
    mockOrderRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    createOrderUseCase = {
      execute: jest.fn().mockResolvedValue({ orderId: 'order-1', orderNumber: 'ORD-001' }),
    };
    cancelOrderUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    };
    adapter = new OrderOrderPlacementAdapter(
      mockOrderRepo as unknown as OrderRepository,
      createOrderUseCase as unknown as CreateOrderUseCase,
      cancelOrderUseCase as unknown as CancelOrderUseCase,
    );
  });

  it('implements OrderPlacementPort', () => {
    expect(typeof adapter.createOrder).toBe('function');
    expect(typeof adapter.findOrder).toBe('function');
    expect(typeof adapter.updateOrderStatus).toBe('function');
    expect(typeof adapter.cancelOrder).toBe('function');
  });

  it('should create order and return snapshot', async () => {
    mockOrderRepo.findById.mockResolvedValue({
      orderId: 'order-1',
      orderNumber: 'ORD-001',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    } as unknown as Order);

    const result = await adapter.createOrder({
      customerId: 'cust-1',
      customerEmail: 'test@test.com',
      items: [{ productId: 'p1', sku: 'SKU', name: 'Widget', quantity: 1, unitPriceCents: 100 }],
      shippingAddress: {
        firstName: 'Jane',
        lastName: 'Doe',
        address1: '123 Main',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
        countryCode: 'US',
      },
      billingAddress: {
        firstName: 'Jane',
        lastName: 'Doe',
        address1: '123 Main',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
        countryCode: 'US',
      },
      basketId: 'basket-1',
      source: 'checkout',
      currency: 'USD',
      shippingAmountCents: 10,
    });

    expect(createOrderUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust-1',
        customerEmail: 'test@test.com',
        basketId: 'basket-1',
      }),
    );
    expect(result.orderId).toBe('order-1');
    expect(result.orderNumber).toBe('ORD-001');
    expect(result.status).toBe(OrderStatus.PENDING);
    expect(result.paymentStatus).toBe(PaymentStatus.PENDING);
  });

  it('should find order and return snapshot', async () => {
    mockOrderRepo.findById.mockResolvedValue({
      orderId: 'order-1',
      orderNumber: 'ORD-001',
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.PAID,
    } as unknown as Order);

    const result = await adapter.findOrder('order-1');

    expect(result).not.toBeNull();
    expect(result!.orderId).toBe('order-1');
    expect(result!.status).toBe(OrderStatus.PROCESSING);
    expect(result!.paymentStatus).toBe(PaymentStatus.PAID);
  });

  it('should return null when order not found', async () => {
    mockOrderRepo.findById.mockResolvedValue(null);
    const result = await adapter.findOrder('nonexistent');
    expect(result).toBeNull();
  });

  it('should update order status via repository', async () => {
    const mockOrder = {
      orderId: 'order-1',
      updateStatus: jest.fn(),
    };
    mockOrderRepo.findById.mockResolvedValue(mockOrder as unknown as Order);

    await adapter.updateOrderStatus('order-1', 'pending_payment');

    expect(mockOrder.updateStatus).toHaveBeenCalledWith(OrderStatus.PAYMENT_PENDING);
    expect(mockOrderRepo.save).toHaveBeenCalledWith(mockOrder);
  });

  it('should do nothing when order not found for status update', async () => {
    mockOrderRepo.findById.mockResolvedValue(null);

    await adapter.updateOrderStatus('nonexistent', 'processing');

    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should cancel order via cancel use case', async () => {
    await adapter.cancelOrder('order-1', 'Customer abandoned');

    expect(cancelOrderUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-1', reason: 'Customer abandoned' }),
    );
  });
});
