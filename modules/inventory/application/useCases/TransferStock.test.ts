/**
 * Unit Tests for TransferStock Use Case
 */

import { TransferStockUseCase } from './TransferStock';
import { InventoryLocationNotFoundError } from '../../domain/errors/InventoryErrors';

describe('TransferStockUseCase', () => {
  let useCase: TransferStockUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findLocationById: jest.fn(),
      findByProduct: jest.fn(),
      updateQuantity: jest.fn(),
      create: jest.fn(),
      recordTransaction: jest.fn(),
    };
    useCase = new TransferStockUseCase(mockRepo as never as ConstructorParameters<typeof TransferStockUseCase>[0]);
  });

  it('should transfer stock between locations', async () => {
    mockRepo.findLocationById.mockResolvedValue({ locationId: 'loc-1', name: 'Warehouse A' });
    mockRepo.findByProduct
      .mockResolvedValueOnce({ inventoryId: 'inv-1', productId: 'prod-1', locationId: 'loc-1', sku: 'SKU-1', quantity: 100, reservedQuantity: 10 })
      .mockResolvedValueOnce({ inventoryId: 'inv-2', productId: 'prod-1', locationId: 'loc-2', sku: 'SKU-1', quantity: 20, reservedQuantity: 0 });

    const result = await useCase.execute({
      sourceLocationId: 'loc-1',
      destinationLocationId: 'loc-2',
      items: [{ productId: 'prod-1', quantity: 30 }],
    });

    expect(result.allTransferred).toBe(true);
    expect(result.results[0].transferredQuantity).toBe(30);
    expect(result.results[0].sourceRemainingQuantity).toBe(70);
    expect(result.results[0].destinationNewQuantity).toBe(50);
    expect(mockRepo.updateQuantity).toHaveBeenCalledTimes(2);
    expect(mockRepo.recordTransaction).toHaveBeenCalledWith(expect.objectContaining({
      type: 'transfer',
      fromLocationId: 'loc-1',
      toLocationId: 'loc-2',
    }));
  });

  it('should throw when source location not found', async () => {
    mockRepo.findLocationById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ locationId: 'loc-2', name: 'Warehouse B' });

    await expect(
      useCase.execute({
        sourceLocationId: 'loc-x',
        destinationLocationId: 'loc-2',
        items: [{ productId: 'prod-1', quantity: 10 }],
      }),
    ).rejects.toThrow(InventoryLocationNotFoundError);
  });

  it('should throw when destination location not found', async () => {
    mockRepo.findLocationById
      .mockResolvedValueOnce({ locationId: 'loc-1', name: 'Warehouse A' })
      .mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        sourceLocationId: 'loc-1',
        destinationLocationId: 'loc-x',
        items: [{ productId: 'prod-1', quantity: 10 }],
      }),
    ).rejects.toThrow(InventoryLocationNotFoundError);
  });

  it('should report failure when product not at source', async () => {
    mockRepo.findLocationById.mockResolvedValue({ locationId: 'loc-1', name: 'Warehouse A' });
    mockRepo.findByProduct.mockResolvedValue(null);

    const result = await useCase.execute({
      sourceLocationId: 'loc-1',
      destinationLocationId: 'loc-2',
      items: [{ productId: 'prod-1', quantity: 10 }],
    });

    expect(result.allTransferred).toBe(false);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toBe('Product not found at source location');
  });

  it('should partially transfer when available is less than requested', async () => {
    mockRepo.findLocationById.mockResolvedValue({ locationId: 'loc-1', name: 'Warehouse A' });
    mockRepo.findByProduct
      .mockResolvedValueOnce({ inventoryId: 'inv-1', productId: 'prod-1', locationId: 'loc-1', sku: 'SKU-1', quantity: 20, reservedQuantity: 15 })
      .mockResolvedValueOnce(null);

    const result = await useCase.execute({
      sourceLocationId: 'loc-1',
      destinationLocationId: 'loc-2',
      items: [{ productId: 'prod-1', quantity: 10 }],
    });

    expect(result.allTransferred).toBe(false);
    expect(result.results[0].transferredQuantity).toBe(5);
    expect(result.results[0].success).toBe(false);
  });

  it('should create inventory at destination when none exists', async () => {
    mockRepo.findLocationById.mockResolvedValue({ locationId: 'loc-1', name: 'Warehouse A' });
    mockRepo.findByProduct
      .mockResolvedValueOnce({ inventoryId: 'inv-1', productId: 'prod-1', locationId: 'loc-1', sku: 'SKU-1', quantity: 100, reservedQuantity: 0 })
      .mockResolvedValueOnce(null);

    const result = await useCase.execute({
      sourceLocationId: 'loc-1',
      destinationLocationId: 'loc-2',
      items: [{ productId: 'prod-1', quantity: 30 }],
    });

    expect(result.results[0].destinationNewQuantity).toBe(30);
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'prod-1',
      warehouseId: 'loc-2',
      quantity: 30,
    }));
  });
});
