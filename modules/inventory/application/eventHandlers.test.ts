/**
 * Tests for inventory event handlers — return.completed restocking.
 *
 * When a return completes, items flagged restockItem are returned to stock
 * unless they failed inspection. Stock is adjusted on the product's existing
 * location and a RETURN transaction is recorded for audit.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { registerInventoryEventHandlers, type InventoryEventHandlerDeps } from './eventHandlers';
import { ReturnRequest, type ReturnRequestProps, type ReturnItem } from '../../returns/domain/entities/ReturnRequest';
import { Order } from '../../order/domain/entities/Order';
import { OrderItem } from '../../order/domain/entities/OrderItem';
import { Money } from '../../order/domain/valueObjects/Money';
import type { InventoryLocation } from '../domain/entities/Inventory';

jest.mock('../../../libs/db', () => ({
  __esModule: true,
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

jest.mock('../../../libs/jobs/cronScheduler', () => ({
  __esModule: true,
  JobScheduler: { scheduleNotification: jest.fn(), schedule: jest.fn() },
}));

function makeReturnItem(overrides: Partial<ReturnItem>): ReturnItem {
  return {
    orderReturnItemId: 'ret-item-1',
    orderReturnId: 'ret-1',
    orderItemId: 'oi-1',
    quantity: 2,
    returnReason: 'damaged',
    condition: 'used',
    restockItem: true,
    warrantyStatus: 'none',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function makeReturn(overrides: Partial<ReturnRequestProps> = {}): ReturnRequest {
  return ReturnRequest.reconstitute({
    orderReturnId: 'ret-1',
    orderId: 'ord-1',
    returnNumber: 'RET-001',
    customerId: 'cust-1',
    status: 'completed',
    returnType: 'refund',
    requestedAt: new Date('2024-01-01'),
    returnShippingPaid: false,
    returnCarrier: 'custom',
    requiresInspection: true,
    items: [makeReturnItem({})],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

function makeOrder(): Order {
  const order = Order.create({ orderId: 'ord-1', customerEmail: 't@e.com' });
  order.addItem(
    OrderItem.create({
      orderItemId: 'oi-1',
      orderId: 'ord-1',
      productId: 'prod-1',
      productVariantId: 'var-1',
      sku: 'SKU-1',
      name: 'Widget',
      quantity: 5,
      unitPrice: Money.create(1000, 'USD'),
    }),
  );
  return order;
}

const location = {
  inventoryLocationId: 'loc-1',
  productId: 'prod-1',
  productVariantId: 'var-1',
  distributionWarehouseId: 'wh-1',
  distributionWarehouseBinId: 'bin-1',
  sku: 'SKU-1',
  quantity: 10,
} as unknown as InventoryLocation;

describe('Inventory event handlers: return.completed', () => {
  let deps: InventoryEventHandlerDeps;
  let stock: jest.Mocked<InventoryEventHandlerDeps['stock']>;
  let returns: { findById: jest.Mock };
  let orders: { findById: jest.Mock };

  beforeEach(() => {
    (eventBus as unknown as { handlers: Map<string, unknown> }).handlers.clear();
    orders = { findById: jest.fn().mockResolvedValue(makeOrder()) };
    returns = { findById: jest.fn().mockResolvedValue(makeReturn()) };
    stock = {
      checkProductAvailability: jest.fn(),
      findLocationsByProductId: jest.fn().mockResolvedValue([location]),
      adjustQuantity: jest.fn().mockResolvedValue({ ...location, quantity: 12 }),
      createTransaction: jest.fn().mockResolvedValue({}),
      findTransactionTypeByCode: jest
        .fn()
        .mockImplementation(async (code: string) =>
          code === 'RETURN' ? ({ inventoryTransactionTypeId: 'tt-return' } as never) : null,
        ),
    } as unknown as jest.Mocked<InventoryEventHandlerDeps['stock']>;
    deps = {
      orders,
      returns: returns as unknown as InventoryEventHandlerDeps['returns'],
      stock,
      reservations: { createAtomic: jest.fn(), releaseByOrder: jest.fn() },
    };
    registerInventoryEventHandlers(deps);
  });

  afterEach(() => {
    (eventBus as unknown as { handlers: Map<string, unknown> }).handlers.clear();
  });

  it('should restock a restockItem return item and record a RETURN transaction', async () => {
    await eventBus.emit('return.completed', { orderReturnId: 'ret-1' });

    expect(stock.adjustQuantity).toHaveBeenCalledWith('loc-1', 2, 'customer_return');
    expect(stock.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        typeId: 'tt-return',
        productId: 'prod-1',
        productVariantId: 'var-1',
        quantity: 2,
        referenceType: 'return',
        referenceId: 'ret-1',
        reason: 'customer_return',
      }),
    );
  });

  it('should skip items that failed inspection', async () => {
    returns.findById.mockResolvedValue(
      makeReturn({ inspectionFailedItems: { 'ret-item-1': { reason: 'damaged beyond repair' } } }),
    );

    await eventBus.emit('return.completed', { orderReturnId: 'ret-1' });

    expect(stock.adjustQuantity).not.toHaveBeenCalled();
    expect(stock.createTransaction).not.toHaveBeenCalled();
  });

  it('should skip items flagged restockItem: false', async () => {
    returns.findById.mockResolvedValue(makeReturn({ items: [makeReturnItem({ restockItem: false })] }));

    await eventBus.emit('return.completed', { orderReturnId: 'ret-1' });

    expect(stock.findLocationsByProductId).not.toHaveBeenCalled();
    expect(stock.adjustQuantity).not.toHaveBeenCalled();
  });

  it('should do nothing when the return request is not found', async () => {
    returns.findById.mockResolvedValue(null);

    await eventBus.emit('return.completed', { orderReturnId: 'missing' });

    expect(stock.adjustQuantity).not.toHaveBeenCalled();
  });

  it('should skip restock when the order item cannot be resolved', async () => {
    orders.findById.mockResolvedValue(Order.create({ orderId: 'ord-1', customerEmail: 't@e.com' }));

    await eventBus.emit('return.completed', { orderReturnId: 'ret-1' });

    expect(stock.findLocationsByProductId).not.toHaveBeenCalled();
    expect(stock.adjustQuantity).not.toHaveBeenCalled();
  });

  it('should skip restock when no stock location exists for the product', async () => {
    stock.findLocationsByProductId.mockResolvedValue([]);

    await eventBus.emit('return.completed', { orderReturnId: 'ret-1' });

    expect(stock.adjustQuantity).not.toHaveBeenCalled();
  });

  it('should fall back to ADJUST_UP transaction type when RETURN is undefined', async () => {
    stock.findTransactionTypeByCode.mockImplementation(async (code: string) =>
      code === 'ADJUST_UP' ? ({ inventoryTransactionTypeId: 'tt-adjust' } as never) : null,
    );

    await eventBus.emit('return.completed', { orderReturnId: 'ret-1' });

    expect(stock.createTransaction).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'tt-adjust' }));
  });
});
