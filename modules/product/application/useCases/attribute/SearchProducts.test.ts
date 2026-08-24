jest.mock('../../services/ProductSearchService', () => ({
  __esModule: true,
  default: {
    search: jest.fn().mockResolvedValue({
      products: [{ productId: 'p1', name: 'Widget' }],
      total: 1,
      page: 1,
      limit: 20,
      facets: {},
    }),
  },
}));

import { SearchProductsUseCase } from './SearchProducts';
import productSearchService from '../../services/ProductSearchService';

const mockService = productSearchService as unknown as { search: jest.Mock };

describe('SearchProductsUseCase', () => {
  let useCase: SearchProductsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new SearchProductsUseCase();
  });

  it('should search products (happy path)', async () => {
    const result = await useCase.execute({ query: 'widget' });

    expect(result.success).toBe(true);
    expect(result.data?.products).toHaveLength(1);
    expect(result.data?.total).toBe(1);
  });

  it('should use default filters when none provided', async () => {
    const result = await useCase.execute({});

    expect(result.success).toBe(true);
  });

  it('should return error on failure', async () => {
    mockService.search.mockRejectedValueOnce(new Error('Search failed'));

    const result = await useCase.execute({ query: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
