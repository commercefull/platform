/**
 * Unit Tests for GetInventoryItem Use Case
 */

import { GetInventoryItemUseCase } from './GetInventoryItem';
import { InventoryValidationError } from '../../domain/errors/InventoryErrors';

describe('GetInventoryItemUseCase', () => {
  let useCase: GetInventoryItemUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findBySkuAndWarehouse: jest.fn(),
      findByProductAndWarehouse: jest.fn(),
    };
    useCase = new GetInventoryItemUseCase(mockRepo as never as ConstructorParameters<typeof GetInventoryItemUseCase>[0]);
  });

  function createInventoryRecord() {
    return {
      inventoryId: 'inv-1',
      productId: 'prod-1',
      variantId: 'var-1',
      locationId: 'wh-1',
      sku: 'SKU-001',
      quantity: 100,
      reservedQuantity: 20,
      reorderPoint: 10,
      reorderQuantity: 50,
      binLocation: 'A-1',
      cost: 15.99,
      updatedAt: new Date('2024-06-01'),
      createdAt: new Date('2024-01-01'),
    };
  }

  it('should find by inventoryItemId', async () => {
    mockRepo.findById.mockResolvedValue(createInventoryRecord());

    const result = await useCase.execute({ inventoryItemId: 'inv-1' });

    expect(result.found).toBe(true);
    expect(result.item!.inventoryItemId).toBe('inv-1');
    expect(result.item!.availableQuantity).toBe(80);
    expect(result.item!.isLowStock).toBe(false);
    expect(result.item!.isOutOfStock).toBe(false);
    expect(mockRepo.findById).toHaveBeenCalledWith('inv-1');
  });

  it('should find by sku and warehouseId', async () => {
    mockRepo.findBySkuAndWarehouse.mockResolvedValue(createInventoryRecord());

    const result = await useCase.execute({ sku: 'SKU-001', warehouseId: 'wh-1' });

    expect(result.found).toBe(true);
    expect(result.item!.sku).toBe('SKU-001');
    expect(mockRepo.findBySkuAndWarehouse).toHaveBeenCalledWith('SKU-001', 'wh-1');
  });

  it('should find by productId and warehouseId', async () => {
    mockRepo.findByProductAndWarehouse.mockResolvedValue(createInventoryRecord());

    const result = await useCase.execute({ productId: 'prod-1', warehouseId: 'wh-1' });

    expect(result.found).toBe(true);
    expect(result.item!.productId).toBe('prod-1');
    expect(mockRepo.findByProductAndWarehouse).toHaveBeenCalledWith('prod-1', 'wh-1', undefined);
  });

  it('should find by productId, warehouseId, and variantId', async () => {
    mockRepo.findByProductAndWarehouse.mockResolvedValue(createInventoryRecord());

    const result = await useCase.execute({ productId: 'prod-1', warehouseId: 'wh-1', variantId: 'var-1' });

    expect(result.found).toBe(true);
    expect(mockRepo.findByProductAndWarehouse).toHaveBeenCalledWith('prod-1', 'wh-1', 'var-1');
  });

  it('should return found=false when item not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ inventoryItemId: 'inv-x' });

    expect(result.found).toBe(false);
    expect(result.item).toBeUndefined();
  });

  it('should throw when no lookup criteria provided', async () => {
    await expect(useCase.execute({})).rejects.toThrow(InventoryValidationError);
  });

  it('should report isLowStock when available <= reorderPoint', async () => {
    const record = createInventoryRecord();
    record.quantity = 25;
    record.reservedQuantity = 20;
    mockRepo.findById.mockResolvedValue(record);

    const result = await useCase.execute({ inventoryItemId: 'inv-1' });

    expect(result.item!.availableQuantity).toBe(5);
    expect(result.item!.isLowStock).toBe(true);
  });

  it('should report isOutOfStock when available <= 0', async () => {
    const record = createInventoryRecord();
    record.quantity = 10;
    record.reservedQuantity = 10;
    mockRepo.findById.mockResolvedValue(record);

    const result = await useCase.execute({ inventoryItemId: 'inv-1' });

    expect(result.item!.availableQuantity).toBe(0);
    expect(result.item!.isOutOfStock).toBe(true);
  });
});
