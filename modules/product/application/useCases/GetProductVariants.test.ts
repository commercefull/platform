
import { GetProductVariantsUseCase, GetProductVariantsCommand } from './GetProductVariants';
import { createProductVariantRow, lazyMock } from '../../tests/testUtils';

;

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
});
