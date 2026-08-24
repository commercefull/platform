import { ProcessRedirectUseCase, ProcessRedirectQuery } from './ProcessRedirect';

describe('ProcessRedirectUseCase', () => {
  let useCase: ProcessRedirectUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findMatchingRedirect: jest.fn().mockResolvedValue(null),
      recordHit: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ProcessRedirectUseCase(mockRepo as never);
  });

  it('should return redirect when match found', async () => {
    mockRepo.findMatchingRedirect.mockResolvedValue({
      contentRedirectId: 'r1', sourceUrl: '/old', targetUrl: '/new', statusCode: '301', isRegex: false,
    });

    const result = await useCase.execute(new ProcessRedirectQuery('/old'));

    expect(result.shouldRedirect).toBe(true);
    expect(result.targetUrl).toBe('/new');
    expect(result.statusCode).toBe(301);
  });

  it('should return shouldRedirect=false when no match', async () => {
    const result = await useCase.execute(new ProcessRedirectQuery('/nope'));

    expect(result.shouldRedirect).toBe(false);
  });

  it('should return shouldRedirect=false when url is empty', async () => {
    const result = await useCase.execute(new ProcessRedirectQuery(''));

    expect(result.shouldRedirect).toBe(false);
  });

  it('should handle regex redirects with replacement', async () => {
    mockRepo.findMatchingRedirect.mockResolvedValue({
      contentRedirectId: 'r1', sourceUrl: '/old/(.*)', targetUrl: '/new/$1', statusCode: '301', isRegex: true,
    });

    const result = await useCase.execute(new ProcessRedirectQuery('/old/page'));

    expect(result.shouldRedirect).toBe(true);
    expect(result.targetUrl).toBe('/new/page');
  });
});
