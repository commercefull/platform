import { createFaqSearchRepository } from '../../tests/testUtils';
import { SearchFAQUseCase } from './SearchFAQ';

describe('SearchFAQUseCase', () => {
  let useCase: SearchFAQUseCase;
  let supportRepository: ReturnType<typeof createFaqSearchRepository>;

  beforeEach(() => {
    supportRepository = createFaqSearchRepository();
    supportRepository.searchFAQ.mockResolvedValue([
      { faqId: 'f1', question: 'How to return?', answer: 'Within 30 days', categoryName: 'Returns', helpfulness: 5 },
    ]);
    useCase = new SearchFAQUseCase(supportRepository);
  });

  it('should return mapped FAQ results when matches exist', async () => {
    const result = await useCase.execute({ query: 'return order' });

    expect(result.results).toEqual([
      { faqId: 'f1', question: 'How to return?', answer: 'Within 30 days', categoryName: 'Returns', helpfulness: 5 },
    ]);
    expect(result.total).toBe(1);
  });

  it('should return empty results without searching when the query is shorter than 2 chars', async () => {
    const result = await useCase.execute({ query: 'a' });

    expect(result).toEqual({ results: [], total: 0 });
    expect(supportRepository.searchFAQ).not.toHaveBeenCalled();
  });

  it('should return empty results without searching when the query is blank', async () => {
    const result = await useCase.execute({ query: '   ' });

    expect(result).toEqual({ results: [], total: 0 });
    expect(supportRepository.searchFAQ).not.toHaveBeenCalled();
  });

  it('should pass the trimmed query, category, and limit to the repository', async () => {
    await useCase.execute({ query: '  return  ', categoryId: 'cat-1', limit: 5 });

    expect(supportRepository.searchFAQ).toHaveBeenCalledWith({ query: 'return', categoryId: 'cat-1', limit: 5 });
  });
});
