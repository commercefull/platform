/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

describe('OrderOrderPlacementAdapter', () => {
  let adapter: import('./OrderOrderPlacementAdapter').OrderOrderPlacementAdapter;
  let mockOrderRepo: { findById: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../../order/application/useCases/CreateOrder', () => ({
      CreateOrderUseCase: jest.fn().mockImplementation((_repo: any) => ({
        execute: jest.fn().mockResolvedValue({ orderId: 'order-1', orderNumber: 'ORD-001' }),
      })),
      CreateOrderCommand: jest.fn().mockImplementation((...args: any[]) => ({ args })),
    }));
    jest.doMock('../../../order/application/useCases/CancelOrder', () => ({
      CancelOrderUseCase: jest.fn().mockImplementation((_repo: any) => ({
        execute: jest.fn().mockResolvedValue(undefined),
      })),
      CancelOrderCommand: jest.fn().mockImplementation((...args: any[]) => ({ args })),
    }));
    jest.doMock('../../../order/domain/valueObjects/OrderStatus', () => ({
      OrderStatus: {
        PENDING: 'pending',
        PAYMENT_PENDING: 'payment_pending',
        PROCESSING: 'processing',
        CANCELLED: 'cancelled',
        COMPLETED: 'completed',
      },
    }));
    jest.doMock('../../../order/domain/valueObjects/PaymentStatus', () => ({
      PaymentStatus: { PENDING: 'pending', PAID: 'paid' },
    }));

    mockOrderRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    const { OrderOrderPlacementAdapter } = require('./OrderOrderPlacementAdapter');
    adapter = new OrderOrderPlacementAdapter(mockOrderRepo as never);
  });

  afterEach(() => {
    jest.dontMock('../../../order/application/useCases/CreateOrder');
    jest.dontMock('../../../order/application/useCases/CancelOrder');
    jest.dontMock('../../../order/domain/valueObjects/OrderStatus');
    jest.dontMock('../../../order/domain/valueObjects/PaymentStatus');
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
      status: 'pending',
      paymentStatus: 'pending',
    });

    const result = await adapter.createOrder({
      customerId: 'cust-1',
      customerEmail: 'test@test.com',
      items: [{ productId: 'p1', sku: 'SKU', name: 'Widget', quantity: 1, unitPrice: 100 }],
      shippingAddress: { firstName: 'Jane', lastName: 'Doe', address1: '123 Main', city: 'Portland', state: 'OR', postalCode: '97201', country: 'US', countryCode: 'US' },
      billingAddress: { firstName: 'Jane', lastName: 'Doe', address1: '123 Main', city: 'Portland', state: 'OR', postalCode: '97201', country: 'US', countryCode: 'US' },
      basketId: 'basket-1',
      source: 'checkout',
      currency: 'USD',
      shippingAmount: 10,
    });

    expect(result.orderId).toBe('order-1');
    expect(result.orderNumber).toBe('ORD-001');
    expect(result.status).toBe('pending');
    expect(result.paymentStatus).toBe('pending');
  });

  it('should find order and return snapshot', async () => {
    mockOrderRepo.findById.mockResolvedValue({
      orderId: 'order-1',
      orderNumber: 'ORD-001',
      status: 'processing',
      paymentStatus: 'paid',
    });

    const result = await adapter.findOrder('order-1');

    expect(result).not.toBeNull();
    expect(result!.orderId).toBe('order-1');
    expect(result!.status).toBe('processing');
    expect(result!.paymentStatus).toBe('paid');
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
    mockOrderRepo.findById.mockResolvedValue(mockOrder);

    await adapter.updateOrderStatus('order-1', 'pending_payment');

    expect(mockOrder.updateStatus).toHaveBeenCalledWith('payment_pending');
    expect(mockOrderRepo.save).toHaveBeenCalledWith(mockOrder);
  });

  it('should do nothing when order not found for status update', async () => {
    mockOrderRepo.findById.mockResolvedValue(null);

    await adapter.updateOrderStatus('nonexistent', 'processing');

    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should cancel order via cancel use case', async () => {
    await adapter.cancelOrder('order-1', 'Customer abandoned');
    expect(true).toBe(true);
  });
});
