import { ProcessRedirectUseCase, ProcessRedirectQuery } from './ProcessRedirect';
import { lazyMock, createContentRedirect } from '../../../tests/testUtils';

describe('ProcessRedirectUseCase', () => {
  let useCase: ProcessRedirectUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ProcessRedirectUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof ProcessRedirectUseCase>[0]>();
    mockRepo.findMatchingRedirect.mockResolvedValue(null);
    mockRepo.recordHit.mockResolvedValue(undefined);
    useCase = new ProcessRedirectUseCase(mockRepo);
  });

  it('should return redirect when match found', async () => {
    mockRepo.findMatchingRedirect.mockResolvedValue(
      createContentRedirect({ contentRedirectId: 'r1', sourceUrl: '/old', targetUrl: '/new' }),
    );

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
    mockRepo.findMatchingRedirect.mockResolvedValue(
      createContentRedirect({ contentRedirectId: 'r1', sourceUrl: '/old/(.*)', targetUrl: '/new/$1', isRegex: true }),
    );

    const result = await useCase.execute(new ProcessRedirectQuery('/old/page'));

    expect(result.shouldRedirect).toBe(true);
    expect(result.targetUrl).toBe('/new/page');
  });
});
