import { GetProductVariantsUseCase, GetProductVariantsCommand } from './GetProductVariants';
import { createProductVariantRow, lazyMock } from '../../tests/testUtils';

describe('GetProductVariantsUseCase', () => {
  let useCase: GetProductVariantsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof GetProductVariantsUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<ConstructorParameters<typeof GetProductVariantsUseCase>[0]>();
    mockRepo.findAll.mockResolvedValue({
      data: [createProductVariantRow({ name: 'Red', stockQuantity: 50, lowStockThreshold: 5 })],
      total: 1,
      limit: 20,
      offset: 0,
      hasMore: false,
      length: 1,
    });
    const pricingPort = lazyMock<ConstructorParameters<typeof GetProductVariantsUseCase>[1]>();
    pricingPort.listProductPrices.mockResolvedValue([]);
    useCase = new GetProductVariantsUseCase(mockRepo, pricingPort);
  });

  it('should get product variants (happy path)', async () => {
    const result = await useCase.execute(new GetProductVariantsCommand('p1'));

    expect(result).toHaveLength(1);
    expect(result[0].variantId).toBe('v1');
  });

  it('should include inactive variants when requested', async () => {
    await useCase.execute(new GetProductVariantsCommand('p1', true));

    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1' }),
      expect.objectContaining({ orderBy: 'sortOrder' }),
    );
  });

  describe('with stockAvailabilityPort', () => {
    let stockPort: jest.Mocked<NonNullable<ConstructorParameters<typeof GetProductVariantsUseCase>[2]>>;

    beforeEach(() => {
      stockPort = lazyMock();
      const pricingPort = lazyMock<ConstructorParameters<typeof GetProductVariantsUseCase>[1]>();
      pricingPort.listProductPrices.mockResolvedValue([]);
      useCase = new GetProductVariantsUseCase(mockRepo, pricingPort, stockPort);
    });

    it('should resolve inventory quantity from the inventory port when tracked', async () => {
      stockPort.checkAvailability.mockResolvedValue({ available: true, totalAvailable: 7, locationCount: 1 });

      const result = await useCase.execute(new GetProductVariantsCommand('p1'));

      expect(stockPort.checkAvailability).toHaveBeenCalledWith({
        productId: 'p1',
        productVariantId: 'v1',
        quantity: 1,
      });
      expect(result[0].inventoryQuantity).toBe(7);
      expect(result[0].isInStock).toBe(true);
      expect(result[0].isOutOfStock).toBe(false);
    });

    it('should report out of stock when the inventory port finds no availability', async () => {
      stockPort.checkAvailability.mockResolvedValue({ available: false, totalAvailable: 0, locationCount: 0 });

      const result = await useCase.execute(new GetProductVariantsCommand('p1'));

      expect(result[0].inventoryQuantity).toBe(0);
      expect(result[0].isInStock).toBe(false);
      expect(result[0].isOutOfStock).toBe(true);
    });

    it('should not query the inventory port for unlimited variants', async () => {
      mockRepo.findAll.mockResolvedValue({
        data: [createProductVariantRow({ inventoryPolicy: 'unlimited' })],
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
        length: 1,
      });

      const result = await useCase.execute(new GetProductVariantsCommand('p1'));

      expect(stockPort.checkAvailability).not.toHaveBeenCalled();
      expect(result[0].trackInventory).toBe(false);
    });

    it('should keep backorderable variants sellable when the inventory port reports zero stock', async () => {
      mockRepo.findAll.mockResolvedValue({
        data: [createProductVariantRow({ inventoryPolicy: 'backorderable' })],
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
        length: 1,
      });
      stockPort.checkAvailability.mockResolvedValue({ available: false, totalAvailable: 0, locationCount: 0 });

      const result = await useCase.execute(new GetProductVariantsCommand('p1'));

      expect(result[0].allowBackorders).toBe(true);
      expect(result[0].isInStock).toBe(true);
      expect(result[0].inventoryQuantity).toBe(0);
    });

    it('should fall back to catalog values when the inventory port fails', async () => {
      stockPort.checkAvailability.mockRejectedValue(new Error('inventory down'));

      const result = await useCase.execute(new GetProductVariantsCommand('p1'));

      expect(result[0].inventoryQuantity).toBe(50);
      expect(result[0].isInStock).toBe(true);
    });
  });
});
