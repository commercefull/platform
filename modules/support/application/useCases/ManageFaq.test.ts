import { createFaqPort, createFaqArticleRecord } from '../../tests/testUtils';
import { ManageFaqUseCase } from './ManageFaq';

describe('ManageFaqUseCase', () => {
  let useCase: ManageFaqUseCase;
  let faqRepo: ReturnType<typeof createFaqPort>;

  beforeEach(() => {
    faqRepo = createFaqPort();
    useCase = new ManageFaqUseCase(faqRepo);
  });

  it('should list articles with filters and pagination', async () => {
    faqRepo.getArticles.mockResolvedValue({ data: [createFaqArticleRecord()], total: 1 });

    const result = await useCase.getArticles({ isPublished: true }, { limit: 10 });

    expect(faqRepo.getArticles).toHaveBeenCalledWith({ isPublished: true }, { limit: 10 });
    expect(result.total).toBe(1);
  });

  it('should save the article and return it', async () => {
    const saved = createFaqArticleRecord({ faqArticleId: 'faq-9' });
    faqRepo.saveArticle.mockResolvedValue(saved);

    const result = await useCase.saveArticle({ title: 'New FAQ', content: 'Content' });

    expect(result).toBe(saved);
    expect(faqRepo.saveArticle).toHaveBeenCalledWith({ title: 'New FAQ', content: 'Content' });
  });

  it('should delete the article', async () => {
    await useCase.deleteArticle('faq-1');

    expect(faqRepo.deleteArticle).toHaveBeenCalledWith('faq-1');
  });
});
