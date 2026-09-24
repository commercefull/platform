

import { GetProductCatalogEnrichmentUseCase, GetProductCatalogEnrichmentCommand } from './GetProductCatalogEnrichment';
import { ProductNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';
import { createProductCategory, createProductLookup, createProductQa, createProductQaAnswer, createProductTag, createProductToCategory, lazyMock } from '../../tests/testUtils';

describe('GetProductCatalogEnrichmentUseCase', () => {
  let useCase: GetProductCatalogEnrichmentUseCase;
  let mockRepo1: jest.Mocked<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[0]>;
  let mockRepo2: jest.Mocked<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[1]>;
  let mockRepo3: jest.Mocked<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[2]>;
  let mockRepo4: jest.Mocked<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[3]>;
  let mockRepo5: jest.Mocked<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[4]>;
  let mockRepo6: jest.Mocked<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[5]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo1 = lazyMock<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[0]>();
    mockRepo1.findById.mockResolvedValue(createProductLookup());
    mockRepo2 = lazyMock<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[1]>();
    mockRepo2.findByProduct.mockResolvedValue([createProductToCategory({ productCategoryId: 'cat1' })]);
    mockRepo3 = lazyMock<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[2]>();
    mockRepo3.findById.mockResolvedValue(createProductCategory({ productCategoryId: 'cat1' }));
    mockRepo4 = lazyMock<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[3]>();
    mockRepo4.findAll.mockResolvedValue([createProductTag({ name: 'new' })]);
    mockRepo5 = lazyMock<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[4]>();
    mockRepo5.findByProduct.mockResolvedValue([createProductQa()]);
    mockRepo6 = lazyMock<ConstructorParameters<typeof GetProductCatalogEnrichmentUseCase>[5]>();
    mockRepo6.findByQuestion.mockResolvedValue([createProductQaAnswer({ answer: 'Yes!' })]);
    useCase = new GetProductCatalogEnrichmentUseCase(mockRepo1, mockRepo2, mockRepo3, mockRepo4, mockRepo5, mockRepo6);
  });

  it('should return enriched product (happy path)', async () => {
    const result = await useCase.execute(new GetProductCatalogEnrichmentCommand('p1'));

    expect(result.product.productId).toBe('p1');
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe('Electronics');
    expect(result.tags).toHaveLength(1);
    expect(result.qa).toHaveLength(1);
    expect(result.qa[0].answers).toHaveLength(1);
  });

  it('should throw ProductValidationError when productId is empty', async () => {
    await expect(useCase.execute(new GetProductCatalogEnrichmentCommand(''))).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductNotFoundError when product not found', async () => {
    mockRepo1.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute(new GetProductCatalogEnrichmentCommand('nonexistent'))).rejects.toThrow(ProductNotFoundError);
  });
});
