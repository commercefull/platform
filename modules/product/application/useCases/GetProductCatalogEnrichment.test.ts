import {
  GetProductCatalogEnrichmentUseCase,
  GetProductCatalogEnrichmentCommand,
  GetProductCatalogEnrichmentUseCaseDeps,
} from './GetProductCatalogEnrichment';
import { ProductNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';
import {
  createProductCategory,
  createProductLookup,
  createProductQa,
  createProductQaAnswer,
  createProductTag,
  createProductToCategory,
  lazyMock,
} from '../../tests/testUtils';

describe('GetProductCatalogEnrichmentUseCase', () => {
  let useCase: GetProductCatalogEnrichmentUseCase;
  let mockRepo1: jest.Mocked<GetProductCatalogEnrichmentUseCaseDeps['productRepo']>;
  let mockRepo2: jest.Mocked<GetProductCatalogEnrichmentUseCaseDeps['productToCategoryRepo']>;
  let mockRepo3: jest.Mocked<GetProductCatalogEnrichmentUseCaseDeps['productCategoryRepo']>;
  let mockRepo4: jest.Mocked<GetProductCatalogEnrichmentUseCaseDeps['productTagRepo']>;
  let mockRepo5: jest.Mocked<GetProductCatalogEnrichmentUseCaseDeps['productQaRepo']>;
  let mockRepo6: jest.Mocked<GetProductCatalogEnrichmentUseCaseDeps['productQaAnswerRepo']>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo1 = lazyMock<GetProductCatalogEnrichmentUseCaseDeps['productRepo']>();
    mockRepo1.findById.mockResolvedValue(createProductLookup());
    mockRepo2 = lazyMock<GetProductCatalogEnrichmentUseCaseDeps['productToCategoryRepo']>();
    mockRepo2.findByProduct.mockResolvedValue([createProductToCategory({ productCategoryId: 'cat1' })]);
    mockRepo3 = lazyMock<GetProductCatalogEnrichmentUseCaseDeps['productCategoryRepo']>();
    mockRepo3.findById.mockResolvedValue(createProductCategory({ productCategoryId: 'cat1' }));
    mockRepo4 = lazyMock<GetProductCatalogEnrichmentUseCaseDeps['productTagRepo']>();
    mockRepo4.findAll.mockResolvedValue([createProductTag({ name: 'new' })]);
    mockRepo5 = lazyMock<GetProductCatalogEnrichmentUseCaseDeps['productQaRepo']>();
    mockRepo5.findByProduct.mockResolvedValue([createProductQa()]);
    mockRepo6 = lazyMock<GetProductCatalogEnrichmentUseCaseDeps['productQaAnswerRepo']>();
    mockRepo6.findByQuestion.mockResolvedValue([createProductQaAnswer({ answer: 'Yes!' })]);
    useCase = new GetProductCatalogEnrichmentUseCase({
      productRepo: mockRepo1,
      productToCategoryRepo: mockRepo2,
      productCategoryRepo: mockRepo3,
      productTagRepo: mockRepo4,
      productQaRepo: mockRepo5,
      productQaAnswerRepo: mockRepo6,
    });
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
