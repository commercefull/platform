/**
 * Unit Tests for ReserveStock Use Case
 */

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ReserveStockUseCase } from './ReserveStock';
import { eventBus } from '../../../../libs/events/eventBus';

describe('ReserveStockUseCase', () => {
  let useCase: ReserveStockUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByProduct: jest.fn(),
      createReservation: jest.fn(),
      updateReservedQuantity: jest.fn(),
    };
    useCase = new ReserveStockUseCase(mockRepo as never as ConstructorParameters<typeof ReserveStockUseCase>[0]);
    jest.mocked(eventBus.emit).mockClear();
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
    expect(result.results[0].availableQuantity).toBe(90);
    expect(result.results[0].isFullyReserved).toBe(true);
    expect(mockRepo.createReservation).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateReservedQuantity).toHaveBeenCalledWith('inv-1', 30);
    expect(eventBus.emit).toHaveBeenCalledWith('inventory.reserved', expect.objectContaining({
      orderId: 'ord-1',
      allReserved: true,
    }));
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
});
