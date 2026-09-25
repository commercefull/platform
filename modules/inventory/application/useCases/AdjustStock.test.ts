/**
 * Unit tests for AdjustStockUseCase (stock-location model).
 */

import { eventBus } from '../../../../libs/events/eventBus';
import type { InventoryLocation } from '../../../../libs/db/types';
import { AdjustStockUseCase, type AdjustStockLocationPort } from './AdjustStock';
import { InventoryLocationNotFoundError, InventoryValidationError } from '../../domain/errors/InventoryErrors';

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn(), registerHandler: jest.fn() },
}));

const emitMock = jest.mocked(eventBus.emit);

function makeLocation(overrides: Partial<InventoryLocation> = {}): InventoryLocation {
  return {
    inventoryLocationId: 'loc-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    distributionWarehouseId: 'wh-1',
    distributionWarehouseBinId: 'bin-1',
    storeId: null,
    productId: 'prod-1',
    productVariantId: 'var-1',
    sku: 'SKU-1',
    quantity: 10,
    reservedQuantity: 0,
    availableQuantity: 10,
    minimumStockLevel: 5,
    maximumStockLevel: null,
    lotNumber: null,
    serialNumber: null,
    expiryDate: null,
    receivedDate: null,
    status: 'active',
    lastCountDate: null,
    ...overrides,
  };
}

function makePort(location: InventoryLocation | null = makeLocation()): jest.Mocked<AdjustStockLocationPort> {
  return {
    findLocationById: jest.fn().mockResolvedValue(location),
    adjustQuantity: jest
      .fn()
      .mockImplementation(async (_id: string, delta: number) =>
        location ? { ...location, quantity: location.quantity + delta } : null,
      ),
    createTransaction: jest.fn().mockResolvedValue({ inventoryTransactionId: 'txn-1' }),
    findTransactionTypeByCode: jest
      .fn()
      .mockImplementation(async (code: string) => ({ inventoryTransactionTypeId: `tt-${code}` })),
  };
}

describe('AdjustStockUseCase', () => {
  beforeEach(() => emitMock.mockClear());

  it('should set quantity when adjustmentType is "set"', async () => {
    const port = makePort();
    const result = await new AdjustStockUseCase(port).execute({
      inventoryLocationId: 'loc-1',
      adjustmentType: 'set',
      quantity: 42,
      reason: 'count',
    });

    expect(port.adjustQuantity).toHaveBeenCalledWith('loc-1', 32, 'count'); // 42 - 10
    expect(result.newQuantity).toBe(42);
    expect(result.previousQuantity).toBe(10);
    expect(result.adjustmentAmount).toBe(32);
    expect(result.adjustmentId).toBe('txn-1');
    expect(result.productId).toBe('prod-1');
    expect(result.sku).toBe('SKU-1');
  });

  it('should increment quantity', async () => {
    const port = makePort();
    const result = await new AdjustStockUseCase(port).execute({
      inventoryLocationId: 'loc-1',
      adjustmentType: 'increment',
      quantity: 5,
      reason: 'received',
    });

    expect(port.adjustQuantity).toHaveBeenCalledWith('loc-1', 5, 'received');
    expect(result.newQuantity).toBe(15);
    expect(result.adjustmentAmount).toBe(5);
    expect(port.findTransactionTypeByCode).toHaveBeenCalledWith('ADJUST_UP');
  });

  it('should decrement quantity and floor at zero', async () => {
    const port = makePort();
    const result = await new AdjustStockUseCase(port).execute({
      inventoryLocationId: 'loc-1',
      adjustmentType: 'decrement',
      quantity: 25,
      reason: 'damage',
    });

    // floored: 10 -> 0, delta = -10
    expect(port.adjustQuantity).toHaveBeenCalledWith('loc-1', -10, 'damage');
    expect(result.adjustmentAmount).toBe(-10);
    expect(port.findTransactionTypeByCode).toHaveBeenCalledWith('ADJUST_DOWN');
  });

  it('should use the explicit transactionTypeCode when provided', async () => {
    const port = makePort();
    await new AdjustStockUseCase(port).execute({
      inventoryLocationId: 'loc-1',
      adjustmentType: 'increment',
      quantity: 3,
      reason: 'count',
      transactionTypeCode: 'COUNT',
    });

    expect(port.findTransactionTypeByCode).toHaveBeenCalledWith('COUNT');
    expect(port.createTransaction).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'tt-COUNT' }));
  });

  it('should throw InventoryLocationNotFoundError when the location does not exist', async () => {
    const port = makePort(null);
    port.findLocationById.mockResolvedValue(null);

    await expect(
      new AdjustStockUseCase(port).execute({
        inventoryLocationId: 'missing',
        adjustmentType: 'increment',
        quantity: 1,
        reason: 'manual',
      }),
    ).rejects.toBeInstanceOf(InventoryLocationNotFoundError);
    expect(port.adjustQuantity).not.toHaveBeenCalled();
  });

  it('should throw InventoryValidationError for a negative quantity', async () => {
    const port = makePort();

    await expect(
      new AdjustStockUseCase(port).execute({
        inventoryLocationId: 'loc-1',
        adjustmentType: 'increment',
        quantity: -5,
        reason: 'manual',
      }),
    ).rejects.toBeInstanceOf(InventoryValidationError);
    expect(port.findLocationById).not.toHaveBeenCalled();
  });

  it('should throw for an invalid adjustment type', async () => {
    const port = makePort();

    await expect(
      new AdjustStockUseCase(port).execute({
        inventoryLocationId: 'loc-1',
        adjustmentType: 'bogus' as 'set',
        quantity: 1,
        reason: 'manual',
      }),
    ).rejects.toBeInstanceOf(InventoryValidationError);
    expect(port.adjustQuantity).not.toHaveBeenCalled();
  });

  it('should emit inventory.low when the new quantity is at or below minimumStockLevel', async () => {
    const location = makeLocation({ quantity: 8, minimumStockLevel: 5 });
    const port = makePort(location);
    port.adjustQuantity.mockResolvedValue({ ...location, quantity: 4 });

    await new AdjustStockUseCase(port).execute({
      inventoryLocationId: 'loc-1',
      adjustmentType: 'decrement',
      quantity: 4,
      reason: 'damage',
    });

    expect(emitMock).toHaveBeenCalledWith(
      'inventory.low',
      expect.objectContaining({ productId: 'prod-1', currentQuantity: 4, threshold: 5 }),
    );
  });

  it('should emit inventory.out_of_stock and not inventory.low when quantity reaches zero', async () => {
    const location = makeLocation({ quantity: 5 });
    const port = makePort(location);
    port.adjustQuantity.mockResolvedValue({ ...location, quantity: 0 });

    await new AdjustStockUseCase(port).execute({
      inventoryLocationId: 'loc-1',
      adjustmentType: 'decrement',
      quantity: 5,
      reason: 'shrinkage',
    });

    expect(emitMock).toHaveBeenCalledWith('inventory.out_of_stock', expect.objectContaining({ productId: 'prod-1' }));
    expect(emitMock).not.toHaveBeenCalledWith('inventory.low', expect.anything());
  });

  it('should not emit alerts for an ordinary restock above threshold', async () => {
    const location = makeLocation({ quantity: 10, minimumStockLevel: 5 });
    const port = makePort(location);
    port.adjustQuantity.mockResolvedValue({ ...location, quantity: 15 });

    await new AdjustStockUseCase(port).execute({
      inventoryLocationId: 'loc-1',
      adjustmentType: 'increment',
      quantity: 5,
      reason: 'received',
    });

    expect(emitMock).not.toHaveBeenCalledWith('inventory.low', expect.anything());
    expect(emitMock).not.toHaveBeenCalledWith('inventory.out_of_stock', expect.anything());
  });

  it('should skip transaction recording when no transaction type exists but still adjust', async () => {
    const port = makePort();
    port.findTransactionTypeByCode.mockResolvedValue(null);

    const result = await new AdjustStockUseCase(port).execute({
      inventoryLocationId: 'loc-1',
      adjustmentType: 'increment',
      quantity: 2,
      reason: 'manual',
    });

    expect(port.createTransaction).not.toHaveBeenCalled();
    expect(result.newQuantity).toBe(12);
    expect(result.adjustmentId).toMatch(/^adj_/);
  });
});
