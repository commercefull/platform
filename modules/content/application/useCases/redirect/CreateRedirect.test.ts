import { lazyMock, createContentRedirect, emitMock } from '../../../tests/testUtils';
import { CreateRedirectUseCase, CreateRedirectCommand } from './CreateRedirect';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('CreateRedirectUseCase', () => {
  let useCase: CreateRedirectUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof CreateRedirectUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof CreateRedirectUseCase>[0]>();
    mockRepo.createRedirect.mockResolvedValue(createContentRedirect({ contentRedirectId: 'r1' }));
    useCase = new CreateRedirectUseCase(mockRepo);
  });

  it('should create a redirect successfully', async () => {
    const result = await useCase.execute(new CreateRedirectCommand({ sourceUrl: '/old', targetUrl: '/new' }));

    expect(result.id).toBe('r1');
    expect(emitMock).toHaveBeenCalledWith('content.redirect.created', expect.objectContaining({ redirectId: 'r1' }));
  });

  it('should throw ContentValidationError when source or target missing', async () => {
    await expect(useCase.execute(new CreateRedirectCommand({ sourceUrl: '', targetUrl: '/new' }))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new CreateRedirectCommand({ sourceUrl: '/old', targetUrl: '' }))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentValidationError when source equals target', async () => {
    await expect(useCase.execute(new CreateRedirectCommand({ sourceUrl: '/same', targetUrl: '/same' }))).rejects.toThrow(
      ContentValidationError,
    );
  });

  it('should throw ContentValidationError for invalid regex', async () => {
    await expect(
      useCase.execute(new CreateRedirectCommand({ sourceUrl: '[invalid', targetUrl: '/new', statusCode: 301, isRegex: true })),
    ).rejects.toThrow(ContentValidationError);
  });
});
