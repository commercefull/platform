/**
 * Unit Tests for ReserveStock Use Case
 */

import { lazyMock, emitMock } from '../../tests/testUtils';
import { ReserveStockUseCase } from './ReserveStock';

describe('ReserveStockUseCase', () => {
  let useCase: ReserveStockUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ReserveStockUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof ReserveStockUseCase>[0]>();
    mockRepo.findReservationsByOrderId.mockResolvedValue([]);
    // Simulate the row-locked DB clamp: apply the delta against the most
    // recently resolved inventory record (or the first store location) and
    // report the post-update quantities.
    (mockRepo.reserveStockAtomically as jest.Mock).mockImplementation(async (_itemId, delta, allowBackorder) => {
      const lastResolved = async (mock: jest.Mock) => {
        const record = mock.mock.results[mock.mock.results.length - 1];
        return record && record.type === 'return' ? await record.value : null;
      };
      const productInventory = await lastResolved(mockRepo.findByProduct as unknown as jest.Mock);
      const storeInventory = await lastResolved(mockRepo.findStoreLocations as unknown as jest.Mock);
      const resolved =
        productInventory ?? (Array.isArray(storeInventory) ? ((storeInventory[0] ?? null) as typeof productInventory) : storeInventory);
      if (!resolved) return null;
      const inventory = resolved as { quantity: number; reservedQuantity: number };
      const applied = allowBackorder ? delta : Math.min(delta, Math.max(0, inventory.quantity - (inventory.reservedQuantity || 0)));
      inventory.reservedQuantity = (inventory.reservedQuantity || 0) + applied;
      return {
        appliedQuantity: applied,
        quantity: inventory.quantity,
        reservedQuantity: inventory.reservedQuantity,
        availableQuantity: inventory.quantity - inventory.reservedQuantity,
      };
    });
    useCase = new ReserveStockUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should reserve stock when inventory is available', async () => {
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'inv-1',
      quantity: 100,
      reservedQuantity: 10,
    });

    const result = await useCase.execute({
      orderId: 'ord-1',
      items: [{ productId: 'prod-1', quantity: 20 }],
    });

    expect(result.allReserved).toBe(true);
    expect(result.results[0].reservedQuantity).toBe(20);
    expect(result.results[0].availableQuantity).toBe(70);
    expect(result.results[0].isFullyReserved).toBe(true);
    expect(mockRepo.createReservation).toHaveBeenCalledTimes(1);
    expect(mockRepo.reserveStockAtomically).toHaveBeenCalledWith('inv-1', 20, false);
    expect(mockRepo.updateReservedQuantity).not.toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith(
      'inventory.reserved',
      expect.objectContaining({
        orderId: 'ord-1',
        allReserved: true,
      }),
    );
  });

  it('should partially reserve when stock is insufficient', async () => {
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'inv-1',
      quantity: 15,
      reservedQuantity: 10,
    });

    const result = await useCase.execute({
      orderId: 'ord-1',
      items: [{ productId: 'prod-1', quantity: 20 }],
    });

    expect(result.allReserved).toBe(false);
    expect(result.results[0].reservedQuantity).toBe(5);
    expect(result.results[0].isFullyReserved).toBe(false);
  });

  it('should return zero reserved when inventory not found', async () => {
    mockRepo.findByProduct.mockResolvedValue(null);

    const result = await useCase.execute({
      orderId: 'ord-1',
      items: [{ productId: 'prod-1', quantity: 10 }],
    });

    expect(result.allReserved).toBe(false);
    expect(result.results[0].reservedQuantity).toBe(0);
    expect(result.results[0].availableQuantity).toBe(0);
    expect(mockRepo.createReservation).not.toHaveBeenCalled();
  });

  it('should handle multiple items with mixed availability', async () => {
    mockRepo.findByProduct
      .mockResolvedValueOnce({ inventoryItemId: 'inv-1', quantity: 50, reservedQuantity: 0 })
      .mockResolvedValueOnce(null);

    const result = await useCase.execute({
      orderId: 'ord-1',
      items: [
        { productId: 'prod-1', quantity: 10 },
        { productId: 'prod-2', quantity: 5 },
      ],
    });

    expect(result.allReserved).toBe(false);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].isFullyReserved).toBe(true);
    expect(result.results[1].isFullyReserved).toBe(false);
  });

  it('should use default 30-minute expiration when not provided', async () => {
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'inv-1',
      quantity: 100,
      reservedQuantity: 0,
    });

    const result = await useCase.execute({
      orderId: 'ord-1',
      items: [{ productId: 'prod-1', quantity: 10 }],
    });

    const expiresAt = new Date(result.expiresAt);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    expect(diffMs).toBeGreaterThan(25 * 60 * 1000);
    expect(diffMs).toBeLessThan(35 * 60 * 1000);
  });

  it('should use provided expiration date', async () => {
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'inv-1',
      quantity: 100,
      reservedQuantity: 0,
    });

    const customExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const result = await useCase.execute({
      orderId: 'ord-1',
      items: [{ productId: 'prod-1', quantity: 10 }],
      expiresAt: customExpiry,
    });

    expect(result.expiresAt).toBe(customExpiry.toISOString());
  });

  it('should fully reserve digital and unlimited items without touching stock', async () => {
    const result = await useCase.execute({
      orderId: 'ord-1',
      items: [
        { productId: 'prod-1', quantity: 5, isDigital: true },
        { productId: 'prod-2', quantity: 3, inventoryPolicy: 'unlimited' },
      ],
    });

    expect(result.allReserved).toBe(true);
    expect(result.results.every(r => r.isFullyReserved)).toBe(true);
    expect(mockRepo.findByProduct).not.toHaveBeenCalled();
    expect(mockRepo.createReservation).not.toHaveBeenCalled();
  });

  it('should fully reserve backorderable items even past available stock', async () => {
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'inv-1',
      quantity: 4,
      reservedQuantity: 4,
    });

    const result = await useCase.execute({
      orderId: 'ord-1',
      items: [{ productId: 'prod-1', quantity: 6, inventoryPolicy: 'backorderable' }],
    });

    expect(result.allReserved).toBe(true);
    expect(result.results[0].reservedQuantity).toBe(6);
    expect(mockRepo.reserveStockAtomically).toHaveBeenCalledWith('inv-1', 6, true);
  });

  it('should treat a missing stock record as reservable for backorderable items', async () => {
    mockRepo.findByProduct.mockResolvedValue(null);

    const result = await useCase.execute({
      orderId: 'ord-1',
      items: [{ productId: 'prod-1', quantity: 2, inventoryPolicy: 'backorderable' }],
    });

    expect(result.allReserved).toBe(true);
    expect(result.results[0].isFullyReserved).toBe(true);
    expect(mockRepo.createReservation).not.toHaveBeenCalled();
  });

  it('should route to the store warehouse location with the most available stock', async () => {
    (mockRepo.findStoreLocations as jest.Mock).mockResolvedValue([
      { inventoryItemId: 'loc-a', quantity: 10, reservedQuantity: 2, locationId: 'warehouse-a' },
      { inventoryItemId: 'loc-b', quantity: 50, reservedQuantity: 0, locationId: 'warehouse-b' },
    ]);

    const result = await useCase.execute({
      orderId: 'ord-1',
      storeId: 'store-1',
      items: [{ productId: 'prod-1', quantity: 5 }],
    });

    expect(result.allReserved).toBe(true);
    expect(mockRepo.createReservation).toHaveBeenCalledWith(
      expect.objectContaining({ inventoryItemId: 'loc-a', locationId: 'warehouse-a' }),
    );
  });

  it('should not double-reserve items already covered by existing reservations', async () => {
    mockRepo.findReservationsByOrderId.mockResolvedValue([
      {
        reservationId: 'res-existing',
        inventoryItemId: 'inv-1',
        productId: 'prod-1',
        quantity: 5,
        locationId: 'loc-1',
        status: 'active',
      },
    ]);

    const result = await useCase.execute({
      orderId: 'ord-1',
      items: [{ productId: 'prod-1', quantity: 5 }],
    });

    expect(result.allReserved).toBe(true);
    expect(result.results[0].isFullyReserved).toBe(true);
    expect(mockRepo.createReservation).not.toHaveBeenCalled();
    expect(mockRepo.updateReservedQuantity).not.toHaveBeenCalled();
  });

  it('should reserve only the uncovered remainder when the event path partially reserved', async () => {
    // The order.created handler races checkout and writes 'reserved' rows.
    mockRepo.findReservationsByOrderId.mockResolvedValue([
      {
        reservationId: 'res-event',
        inventoryItemId: 'loc-1',
        productId: 'prod-1',
        quantity: 2,
        locationId: 'loc-1',
        status: 'reserved',
      },
    ]);
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'loc-1',
      quantity: 10,
      reservedQuantity: 2,
      locationId: 'wh-1',
    });

    const result = await useCase.execute({
      orderId: 'ord-1',
      items: [{ productId: 'prod-1', quantity: 5 }],
    });

    expect(result.allReserved).toBe(true);
    expect(result.results[0].reservedQuantity).toBe(5);
    expect(mockRepo.createReservation).toHaveBeenCalledWith(expect.objectContaining({ quantity: 3 }));
    expect(mockRepo.reserveStockAtomically).toHaveBeenCalledWith('loc-1', 3, false);
  });

  describe('atomic reserve path', () => {
    it('should create a reservation for the atomically-applied quantity without a second stock update', async () => {
      mockRepo.findByProduct.mockResolvedValue({ inventoryItemId: 'inv-1', quantity: 100, reservedQuantity: 10 });

      const result = await useCase.execute({ orderId: 'ord-1', items: [{ productId: 'prod-1', quantity: 20 }] });

      expect(result.allReserved).toBe(true);
      expect(result.results[0].availableQuantity).toBe(70);
      expect(mockRepo.createReservation).toHaveBeenCalledWith(expect.objectContaining({ quantity: 20 }));
      expect(mockRepo.updateReservedQuantity).not.toHaveBeenCalled();
    });

    it('should reserve only the clamped delta the database actually applied', async () => {
      mockRepo.findByProduct.mockResolvedValue({ inventoryItemId: 'inv-1', quantity: 15, reservedQuantity: 10 });

      const result = await useCase.execute({ orderId: 'ord-1', items: [{ productId: 'prod-1', quantity: 20 }] });

      expect(result.allReserved).toBe(false);
      expect(result.results[0].reservedQuantity).toBe(5);
      expect(mockRepo.createReservation).toHaveBeenCalledWith(expect.objectContaining({ quantity: 5 }));
    });

    it('should persist the order line the reservation covers', async () => {
      mockRepo.findByProduct.mockResolvedValue({ inventoryItemId: 'inv-1', quantity: 100, reservedQuantity: 0 });

      await useCase.execute({
        orderId: 'ord-1',
        items: [{ productId: 'prod-1', quantity: 2, orderItemId: 'oi-1' }],
      });

      expect(mockRepo.createReservation).toHaveBeenCalledWith(expect.objectContaining({ orderItemId: 'oi-1' }));
    });

    it('should attach the order line to reservations already covering the item', async () => {
      mockRepo.findReservationsByOrderId.mockResolvedValue([
        { reservationId: 'res-1', inventoryItemId: 'inv-1', productId: 'prod-1', quantity: 2, status: 'reserved' },
      ]);

      await useCase.execute({
        orderId: 'ord-1',
        items: [{ productId: 'prod-1', quantity: 2, orderItemId: 'oi-1' }],
      });

      expect(mockRepo.attachOrderItem).toHaveBeenCalledWith('ord-1', 'prod-1', undefined, 'oi-1');
      expect(mockRepo.createReservation).not.toHaveBeenCalled();
    });
  });
});
