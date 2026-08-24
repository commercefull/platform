import { SearchFAQUseCase} from './SearchFAQ';

describe('SearchFAQUseCase', () => {
  let useCase: SearchFAQUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      searchFAQ: jest.fn().mockResolvedValue([
        { faqId: 'f1', question: 'How to return?', answer: 'Use the returns page.', categoryName: 'Returns', helpfulness: 10 },
      ]),
    };
    useCase = new SearchFAQUseCase(mockRepo as never);
  });

  it('should search FAQ (happy path)', async () => {
    const result = await useCase.execute({ query: 'return' });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].faqId).toBe('f1');
    expect(result.total).toBe(1);
  });

  it('should return empty results for query shorter than 2 chars', async () => {
    const result = await useCase.execute({ query: 'a' });

    expect(result.results).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(mockRepo.searchFAQ).not.toHaveBeenCalled();
  });

  it('should return empty results for empty query', async () => {
    const result = await useCase.execute({ query: '' });

    expect(result.results).toHaveLength(0);
  });

  it('should pass categoryId and limit to repository', async () => {
    await useCase.execute({ query: 'shipping', categoryId: 'cat-1', limit: 5 });

    expect(mockRepo.searchFAQ).toHaveBeenCalledWith({ query: 'shipping', categoryId: 'cat-1', limit: 5 });
  });
});
