jest.mock('../../../order/application/useCases/UpdateOrderStatus', () => ({
  __esModule: true,
  UpdateOrderStatusUseCase: jest.fn(),
  UpdateOrderStatusCommand: jest.fn(),
}));

import { CheckoutOrderStatusSyncAdapter } from './CheckoutOrderStatusSyncAdapter';
import { UpdateOrderStatusUseCase } from '../../../order/application/useCases/UpdateOrderStatus';
import type CheckoutRepo from '../../../checkout/infrastructure/repositories/CheckoutRepository';
import type { CheckoutSession } from '../../../checkout/domain/entities/CheckoutSession';
import type { Order } from '../../../order/domain/entities/Order';
import type { OrderRepository } from '../../../order/domain/repositories/OrderRepository';

describe('CheckoutOrderStatusSyncAdapter', () => {
  let adapter: CheckoutOrderStatusSyncAdapter;
  let mockCheckoutRepo: jest.Mocked<Pick<typeof CheckoutRepo, 'findByPaymentIntentId'>>;
  let mockOrderRepo: jest.Mocked<Pick<OrderRepository, 'findById' | 'save'>>;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    mockCheckoutRepo = { findByPaymentIntentId: jest.fn() };
    mockOrderRepo = { findById: jest.fn(), save: jest.fn() };
    mockExecute = jest.fn();
    (UpdateOrderStatusUseCase as unknown as jest.Mock).mockImplementation(() => ({
      execute: mockExecute,
    }));

    adapter = new CheckoutOrderStatusSyncAdapter(mockCheckoutRepo, mockOrderRepo as unknown as OrderRepository);
  });

  it('implements OrderStatusSyncPort', () => {
    expect(typeof adapter.findCheckoutByPaymentIntentId).toBe('function');
    expect(typeof adapter.markOrderPaid).toBe('function');
  });

  it('should map checkout session to CheckoutSyncSummary', async () => {
    mockCheckoutRepo.findByPaymentIntentId.mockResolvedValue({
      id: 'cs-1',
      orderId: 'ord-1',
      customerId: 'cust-1',
      total: { amount: 99.99 },
    } as unknown as CheckoutSession);
    mockOrderRepo.findById.mockResolvedValue({ orderNumber: 'ORD-100' } as unknown as Order);

    const result = await adapter.findCheckoutByPaymentIntentId('pi_123');

    expect(result).not.toBeNull();
    expect(result!.checkoutId).toBe('cs-1');
    expect(result!.orderId).toBe('ord-1');
    expect(result!.customerId).toBe('cust-1');
    expect(result!.totalAmount).toBe(99.99);
    expect(result!.orderNumber).toBe('ORD-100');
  });

  it('should return null when no checkout session found', async () => {
    mockCheckoutRepo.findByPaymentIntentId.mockResolvedValue(null);

    const result = await adapter.findCheckoutByPaymentIntentId('pi_123');

    expect(result).toBeNull();
  });

  it('should return null when session has no orderId', async () => {
    mockCheckoutRepo.findByPaymentIntentId.mockResolvedValue({
      id: 'cs-1',
      orderId: null,
      customerId: 'cust-1',
      total: { amount: 50 },
    } as unknown as CheckoutSession);

    const result = await adapter.findCheckoutByPaymentIntentId('pi_123');

    expect(result).toBeNull();
  });

  it('should mark order paid and return orderNumber', async () => {
    mockOrderRepo.findById.mockResolvedValue({ orderNumber: 'ORD-200', updatePaymentStatus: jest.fn() } as unknown as Order);

    const result = await adapter.markOrderPaid('ord-1');

    expect(mockExecute).toHaveBeenCalled();
    expect(result).toEqual({ orderNumber: 'ORD-200' });
  });

  it('should return null when order not found in markOrderPaid', async () => {
    mockOrderRepo.findById.mockResolvedValue(null);

    const result = await adapter.markOrderPaid('ord-1');

    expect(result).toBeNull();
  });
});
