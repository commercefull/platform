import { queryMock } from '../../tests/testUtils';
import productSearchService from './ProductSearchService';

describe('ProductSearchService', () => {
  beforeEach(() => {
    queryMock.mockResolvedValue([]);
    jest.clearAllMocks();
  });

  it('should search and return empty results when no data', async () => {
    const result = await productSearchService.search({ query: 'test' });

    expect(result.products).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should accept filters and return results', async () => {
    const result = await productSearchService.search({
      categoryId: 'cat1',
      minPriceCents: 1000,
      maxPriceCents: 10000,
      sortBy: 'price',
      sortOrder: 'asc',
      page: 1,
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.page).toBe(1);
  });
});
