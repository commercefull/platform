jest.mock('../../infrastructure/repositories/productRepo', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockResolvedValue({ productId: 'p1', name: 'Widget', sku: 'SKU1' }),
  },
}));

jest.mock('../../infrastructure/repositories/productToCategoryRepo', () => ({
  __esModule: true,
  default: {
    findByProduct: jest.fn().mockResolvedValue([{ productCategoryId: 'cat1' }]),
  },
}));

jest.mock('../../infrastructure/repositories/productCategoryRepo', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockResolvedValue({ productCategoryId: 'cat1', name: 'Electronics' }),
  },
}));

jest.mock('../../infrastructure/repositories/productTagRepo', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn().mockResolvedValue([{ productTagId: 't1', name: 'new' }]),
  },
}));

jest.mock('../../infrastructure/repositories/productQaRepo', () => ({
  __esModule: true,
  default: {
    findByProduct: jest.fn().mockResolvedValue([{ productQaId: 'q1', question: 'Is it good?' }]),
  },
}));

jest.mock('../../infrastructure/repositories/productQaAnswerRepo', () => ({
  __esModule: true,
  default: {
    findByQuestion: jest.fn().mockResolvedValue([{ productQaAnswerId: 'a1', answer: 'Yes!' }]),
  },
}));

import { GetProductCatalogEnrichmentUseCase, GetProductCatalogEnrichmentCommand } from './GetProductCatalogEnrichment';
import { ProductNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';
import productRepo from '../../infrastructure/repositories/productRepo';
import productToCategoryRepo from '../../infrastructure/repositories/productToCategoryRepo';
import productCategoryRepo from '../../infrastructure/repositories/productCategoryRepo';
import productTagRepo from '../../infrastructure/repositories/productTagRepo';
import productQaRepo from '../../infrastructure/repositories/productQaRepo';
import productQaAnswerRepo from '../../infrastructure/repositories/productQaAnswerRepo';

const mockProductRepo = productRepo as unknown as { findById: jest.Mock };

describe('GetProductCatalogEnrichmentUseCase', () => {
  let useCase: GetProductCatalogEnrichmentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetProductCatalogEnrichmentUseCase(
      productRepo,
      productToCategoryRepo,
      productCategoryRepo,
      productTagRepo,
      productQaRepo,
      productQaAnswerRepo,
    );
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
    await expect(useCase.execute(new GetProductCatalogEnrichmentCommand('')))
      .rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductNotFoundError when product not found', async () => {
    mockProductRepo.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute(new GetProductCatalogEnrichmentCommand('nonexistent')))
      .rejects.toThrow(ProductNotFoundError);
  });
});
