/**
 * Unit Tests for UpdateRedirect Use Case
 */

import { lazyMock, createContentRedirect, emitMock } from '../../../tests/testUtils';
import { UpdateRedirectUseCase, UpdateRedirectCommand } from './UpdateRedirect';
import { RedirectNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

describe('UpdateRedirectUseCase', () => {
  let useCase: UpdateRedirectUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof UpdateRedirectUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof UpdateRedirectUseCase>[0]>();
    useCase = new UpdateRedirectUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should update the redirect and emit the updated event', async () => {
    mockRepo.findRedirectById.mockResolvedValue(
      createContentRedirect({ contentRedirectId: 'red-1', sourceUrl: '/old', targetUrl: '/new' }),
    );
    mockRepo.updateRedirect.mockResolvedValue(
      createContentRedirect({ contentRedirectId: 'red-1', sourceUrl: '/old', targetUrl: '/newer' }),
    );

    const result = await useCase.execute(new UpdateRedirectCommand('red-1', { targetUrl: '/newer' }));

    expect(result.targetUrl).toBe('/newer');
    expect(emitMock).toHaveBeenCalledWith(
      'content.redirect.updated',
      expect.objectContaining({ redirectId: 'red-1', targetUrl: '/newer' }),
    );
  });

  it('should throw ContentValidationError when source and target become identical', async () => {
    mockRepo.findRedirectById.mockResolvedValue(
      createContentRedirect({ contentRedirectId: 'red-1', sourceUrl: '/same', targetUrl: '/new' }),
    );

    await expect(useCase.execute(new UpdateRedirectCommand('red-1', { targetUrl: '/same' }))).rejects.toThrow(
      ContentValidationError,
    );
    expect(mockRepo.updateRedirect).not.toHaveBeenCalled();
  });

  it('should throw RedirectNotFoundError when the redirect does not exist', async () => {
    mockRepo.findRedirectById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateRedirectCommand('missing', {}))).rejects.toThrow(RedirectNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });
});
