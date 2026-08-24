import { ListProductsForContextUseCase, ListProductsForContextCommand } from './ListProductsForContext';
import { ProductValidationError } from '../../domain/errors/ProductErrors';

const mockProductRepository = {
  findAll: jest.fn().mockResolvedValue({
    data: [{
      productId: 'p1', name: 'Widget', slug: 'widget', sku: 'SKU1',
      status: 'active', visibility: 'visible',
      price: { basePrice: 100, salePrice: 80, effectivePrice: 80, isOnSale: true },
      isFeatured: false, hasVariants: false,
      primaryImage: null, categoryId: null,
      createdAt: new Date('2026-01-01'),
    }],
    total: 1, limit: 20, offset: 0, hasMore: false,
  }),
};

const mockStoreLookupPort = {
  findById: jest.fn().mockResolvedValue({ storeId: 's1', organizationId: 'org1' }),
};

const mockSystemConfigPort = {
  findActive: jest.fn().mockResolvedValue({ isMarketplace: false, isMultiStore: false, isSingleStore: true }),
};

const mockOrganizationLookupPort = {
  findById: jest.fn().mockResolvedValue({ organizationId: 'org1' }),
  findAll: jest.fn().mockResolvedValue([{ id: 'org1' }]),
};

describe('ListProductsForContextUseCase', () => {
  let useCase: ListProductsForContextUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListProductsForContextUseCase(
      mockProductRepository as never,
      mockStoreLookupPort as never,
      mockSystemConfigPort as never,
      mockOrganizationLookupPort as never,
    );
  });

  it('should list products for context (happy path)', async () => {
    const result = await useCase.execute(new ListProductsForContextCommand({
      organizationId: 'org1',
    }));

    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should list products with store context', async () => {
    const result = await useCase.execute(new ListProductsForContextCommand({
      storeId: 's1',
    }));

    expect(result.products).toHaveLength(1);
  });

  it('should throw ProductValidationError when no org lookup port in single-store mode', async () => {
    const useCaseNoOrg = new ListProductsForContextUseCase(
      mockProductRepository as never,
      mockStoreLookupPort as never,
      mockSystemConfigPort as never,
    );

    await expect(useCaseNoOrg.execute(new ListProductsForContextCommand({})))
      .rejects.toThrow(ProductValidationError);
  });
});
