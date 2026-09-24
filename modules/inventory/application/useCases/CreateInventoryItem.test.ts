import { lazyMock, uuidMock } from '../../tests/testUtils';
import { CreateInventoryItemUseCase } from './CreateInventoryItem';
import { InventoryValidationError } from '../../domain/errors/InventoryErrors';

describe('CreateInventoryItemUseCase', () => {
  let useCase: CreateInventoryItemUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof CreateInventoryItemUseCase>[0]>;

  beforeEach(() => {
    uuidMock.mockReturnValue('inv-uuid');
    mockRepo = lazyMock<ConstructorParameters<typeof CreateInventoryItemUseCase>[0]>();
    mockRepo.findBySkuAndWarehouse.mockResolvedValue(null);
    mockRepo.create.mockImplementation(async (params) => ({
      inventoryId: 'inv-uuid',
      productId: params.productId,
      variantId: params.variantId,
      locationId: params.warehouseId,
      sku: params.sku,
      quantity: params.quantity,
      reservedQuantity: 0,
      createdAt: new Date(),
    }));
    useCase = new CreateInventoryItemUseCase(mockRepo);
  });

  it('should create inventory item (happy path)', async () => {
    const result = await useCase.execute({
      productId: 'p1',
      warehouseId: 'w1',
      sku: 'SKU1',
      quantity: 100,
    });

    expect(result.inventoryItemId).toBe('inv-uuid');
    expect(result.sku).toBe('SKU1');
    expect(result.availableQuantity).toBe(100);
  });

  it('should throw InventoryValidationError when productId is empty', async () => {
    await expect(useCase.execute({ productId: '', warehouseId: 'w1', sku: 'SKU1', quantity: 10 })).rejects.toThrow(
      InventoryValidationError,
    );
  });

  it('should throw InventoryValidationError when SKU already exists', async () => {
    mockRepo.findBySkuAndWarehouse.mockResolvedValue({
      inventoryId: 'existing',
      productId: 'p1',
      locationId: 'w1',
      sku: 'SKU1',
      quantity: 0,
      reservedQuantity: 0,
      createdAt: new Date(),
    });

    await expect(useCase.execute({ productId: 'p1', warehouseId: 'w1', sku: 'SKU1', quantity: 10 })).rejects.toThrow(
      InventoryValidationError,
    );
  });
});
