/**
 * Unit Tests for DeleteRedirect Use Case
 */

import { lazyMock, createContentRedirect, emitMock } from '../../../tests/testUtils';
import { DeleteRedirectUseCase } from './DeleteRedirect';
import { RedirectNotFoundError } from '../../../domain/errors/ContentErrors';

describe('DeleteRedirectUseCase', () => {
  let useCase: DeleteRedirectUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof DeleteRedirectUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof DeleteRedirectUseCase>[0]>();
    useCase = new DeleteRedirectUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should delete the redirect and emit the deleted event', async () => {
    mockRepo.findRedirectById.mockResolvedValue(createContentRedirect({ contentRedirectId: 'red-1', sourceUrl: '/old' }));
    mockRepo.deleteRedirect.mockResolvedValue(true);

    await useCase.execute('red-1');

    expect(mockRepo.deleteRedirect).toHaveBeenCalledWith('red-1');
    expect(emitMock).toHaveBeenCalledWith('content.redirect.deleted', { redirectId: 'red-1', sourceUrl: '/old' });
  });

  it('should throw RedirectNotFoundError when the redirect does not exist', async () => {
    mockRepo.findRedirectById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(RedirectNotFoundError);
    expect(mockRepo.deleteRedirect).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
