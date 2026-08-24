/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

jest.mock('../../../checkout/infrastructure/repositories/CheckoutRepository', () => ({
  __esModule: true,
  default: {
    findByPaymentIntentId: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  },
}));

jest.mock('../../../order/infrastructure/repositories/OrderDataRepository', () => ({
  __esModule: true,
  default: {
    commands: {
      findById: jest.fn(),
      save: jest.fn(),
    },
  },
}));

jest.mock('../../../order/application/useCases/UpdateOrderStatus', () => ({
  __esModule: true,
  UpdateOrderStatusUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn(),
  })),
  UpdateOrderStatusCommand: jest.fn(),
}));

import { CheckoutOrderStatusSyncAdapter } from './CheckoutOrderStatusSyncAdapter';

describe('CheckoutOrderStatusSyncAdapter', () => {
  let adapter: CheckoutOrderStatusSyncAdapter;
  let mockCheckoutRepo: any;
  let mockOrderRepo: any;
  let mockExecute: any;

  beforeEach(() => {
    mockCheckoutRepo = require('../../../checkout/infrastructure/repositories/CheckoutRepository').default;
    mockOrderRepo = require('../../../order/infrastructure/repositories/OrderDataRepository').default.commands;
    const { UpdateOrderStatusUseCase } = require('../../../order/application/useCases/UpdateOrderStatus');
    mockExecute = jest.fn();
    UpdateOrderStatusUseCase.mockImplementation(() => ({
      execute: mockExecute,
    }));

    adapter = new CheckoutOrderStatusSyncAdapter();
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
    });
    mockOrderRepo.findById.mockResolvedValue({ orderNumber: 'ORD-100' });

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
    });

    const result = await adapter.findCheckoutByPaymentIntentId('pi_123');

    expect(result).toBeNull();
  });

  it('should mark order paid and return orderNumber', async () => {
    mockOrderRepo.findById.mockResolvedValue({ orderNumber: 'ORD-200', updatePaymentStatus: jest.fn() });

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
