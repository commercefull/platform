jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('inv-uuid'),
}));

import { CreateInventoryItemUseCase} from './CreateInventoryItem';
import { InventoryValidationError } from '../../domain/errors/InventoryErrors';

describe('CreateInventoryItemUseCase', () => {
  let useCase: CreateInventoryItemUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findBySkuAndWarehouse: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        inventoryId: 'inv-uuid', productId: 'p1', locationId: 'w1', sku: 'SKU1',
        quantity: 100, reservedQuantity: 0, createdAt: new Date(),
      }),
    };
    useCase = new CreateInventoryItemUseCase(mockRepo as never);
  });

  it('should create inventory item (happy path)', async () => {
    const result = await useCase.execute({
      productId: 'p1', warehouseId: 'w1', sku: 'SKU1', quantity: 100,
    });

    expect(result.inventoryItemId).toBe('inv-uuid');
    expect(result.sku).toBe('SKU1');
    expect(result.availableQuantity).toBe(100);
  });

  it('should throw InventoryValidationError when productId is empty', async () => {
    await expect(useCase.execute({ productId: '', warehouseId: 'w1', sku: 'SKU1', quantity: 10 })).rejects.toThrow(InventoryValidationError);
  });

  it('should throw InventoryValidationError when SKU already exists', async () => {
    mockRepo.findBySkuAndWarehouse.mockResolvedValue({ inventoryId: 'existing' });

    await expect(useCase.execute({ productId: 'p1', warehouseId: 'w1', sku: 'SKU1', quantity: 10 })).rejects.toThrow(InventoryValidationError);
  });
});
