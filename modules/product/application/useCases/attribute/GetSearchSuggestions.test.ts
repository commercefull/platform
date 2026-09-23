import { GetSearchSuggestionsUseCase } from './GetSearchSuggestions';
import type { ProductSearchServicePort } from './SearchProducts';
import { lazyMock } from '../../../tests/testUtils';

describe('GetSearchSuggestionsUseCase', () => {
  let useCase: GetSearchSuggestionsUseCase;
  let mockService: jest.Mocked<ProductSearchServicePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = lazyMock<ProductSearchServicePort>();
    useCase = new GetSearchSuggestionsUseCase(mockService);
  });

  it('should return suggestions for a valid query', async () => {
    mockService.getSuggestions.mockResolvedValue(['red shoes', 'red dress']);

    const result = await useCase.execute({ query: 'red' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(['red shoes', 'red dress']);
    expect(mockService.getSuggestions).toHaveBeenCalledWith('red', 10);
  });

  it('should forward an explicit limit', async () => {
    mockService.getSuggestions.mockResolvedValue([]);

    await useCase.execute({ query: 'shoes', limit: 3 });

    expect(mockService.getSuggestions).toHaveBeenCalledWith('shoes', 3);
  });

  it('should return empty without calling the service when the query is too short', async () => {
    const result = await useCase.execute({ query: 'a' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(mockService.getSuggestions).not.toHaveBeenCalled();
  });

  it('should return failure when the search service throws', async () => {
    mockService.getSuggestions.mockRejectedValue(new Error('suggest index down'));

    const result = await useCase.execute({ query: 'red shoes' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('suggest index down');
  });
});
