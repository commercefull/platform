/**
 * Unit Tests for AdjustStock Use Case
 */

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { AdjustStockUseCase } from './AdjustStock';
import { InventoryValidationError } from '../../domain/errors/InventoryErrors';
import { eventBus } from '../../../../libs/events/eventBus';

describe('AdjustStockUseCase', () => {
  let useCase: AdjustStockUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByProduct: jest.fn(),
      updateQuantity: jest.fn(),
      create: jest.fn(),
      recordTransaction: jest.fn(),
    };
    useCase = new AdjustStockUseCase(mockRepo as never as ConstructorParameters<typeof AdjustStockUseCase>[0]);
    jest.mocked(eventBus.emit).mockClear();
  });

  it('should set quantity when adjustmentType is "set"', async () => {
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'inv-1',
      quantity: 50,
      lowStockThreshold: 5,
    });
    mockRepo.updateQuantity.mockResolvedValue({ inventoryItemId: 'inv-1', quantity: 80 });

    const result = await useCase.execute({
      productId: 'prod-1',
      locationId: 'loc-1',
      adjustmentType: 'set',
      quantity: 80,
      reason: 'correction',
    });

    expect(result.previousQuantity).toBe(50);
    expect(result.newQuantity).toBe(80);
    expect(result.adjustmentAmount).toBe(30);
    expect(mockRepo.updateQuantity).toHaveBeenCalledWith('inv-1', 80);
    expect(mockRepo.recordTransaction).toHaveBeenCalledWith(expect.objectContaining({
      type: 'adjustment',
      reason: 'correction',
    }));
  });

  it('should increment quantity', async () => {
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'inv-1',
      quantity: 50,
      lowStockThreshold: 5,
    });

    const result = await useCase.execute({
      productId: 'prod-1',
      locationId: 'loc-1',
      adjustmentType: 'increment',
      quantity: 20,
      reason: 'received',
    });

    expect(result.newQuantity).toBe(70);
    expect(result.adjustmentAmount).toBe(20);
  });

  it('should decrement quantity and floor at zero', async () => {
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'inv-1',
      quantity: 10,
      lowStockThreshold: 5,
    });

    const result = await useCase.execute({
      productId: 'prod-1',
      locationId: 'loc-1',
      adjustmentType: 'decrement',
      quantity: 25,
      reason: 'shrinkage',
    });

    expect(result.newQuantity).toBe(0);
    expect(result.adjustmentAmount).toBe(-10);
  });

  it('should create new inventory record when none exists', async () => {
    mockRepo.findByProduct.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({
      inventoryItemId: 'inv-new',
      quantity: 30,
      lowStockThreshold: 5,
    });

    const result = await useCase.execute({
      productId: 'prod-1',
      locationId: 'loc-1',
      adjustmentType: 'set',
      quantity: 30,
      reason: 'manual',
    });

    expect(result.previousQuantity).toBe(0);
    expect(result.newQuantity).toBe(30);
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'prod-1',
      locationId: 'loc-1',
      quantity: 30,
    }));
  });

  it('should emit inventory.low event when quantity drops below threshold', async () => {
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'inv-1',
      quantity: 15,
      lowStockThreshold: 10,
    });
    mockRepo.updateQuantity.mockResolvedValue({ inventoryItemId: 'inv-1', quantity: 8 });

    await useCase.execute({
      productId: 'prod-1',
      locationId: 'loc-1',
      adjustmentType: 'set',
      quantity: 8,
      reason: 'damage',
    });

    expect(eventBus.emit).toHaveBeenCalledWith('inventory.low', expect.objectContaining({
      productId: 'prod-1',
      currentQuantity: 8,
    }));
  });

  it('should emit inventory.out_of_stock when quantity is zero', async () => {
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'inv-1',
      quantity: 5,
      lowStockThreshold: 3,
    });
    mockRepo.updateQuantity.mockResolvedValue({ inventoryItemId: 'inv-1', quantity: 0 });

    await useCase.execute({
      productId: 'prod-1',
      locationId: 'loc-1',
      adjustmentType: 'set',
      quantity: 0,
      reason: 'expired',
    });

    expect(eventBus.emit).toHaveBeenCalledWith('inventory.out_of_stock', expect.objectContaining({
      productId: 'prod-1',
    }));
  });

  it('should throw for invalid adjustment type', async () => {
    mockRepo.findByProduct.mockResolvedValue({
      inventoryItemId: 'inv-1',
      quantity: 50,
      lowStockThreshold: 5,
    });

    await expect(
      useCase.execute({
        productId: 'prod-1',
        locationId: 'loc-1',
        adjustmentType: 'invalid' as never as 'set' | 'increment' | 'decrement',
        quantity: 10,
        reason: 'manual',
      }),
    ).rejects.toThrow(InventoryValidationError);
  });
});
