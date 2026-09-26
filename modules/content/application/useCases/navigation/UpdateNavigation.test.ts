/**
 * Unit Tests for UpdateNavigation Use Case
 */

import { lazyMock, createContentNavigation, emitMock } from '../../../tests/testUtils';
import { UpdateNavigationUseCase, UpdateNavigationCommand } from './UpdateNavigation';
import { NavigationMenuNotFoundError } from '../../../domain/errors/ContentErrors';

describe('UpdateNavigationUseCase', () => {
  let useCase: UpdateNavigationUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof UpdateNavigationUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof UpdateNavigationUseCase>[0]>();
    useCase = new UpdateNavigationUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should update the navigation and emit the updated event', async () => {
    mockRepo.findNavigationById.mockResolvedValue(createContentNavigation({ contentNavigationId: 'nav-1' }));
    mockRepo.updateNavigation.mockResolvedValue(createContentNavigation({ contentNavigationId: 'nav-1', name: 'New Nav' }));

    const result = await useCase.execute(new UpdateNavigationCommand('nav-1', { name: 'New Nav' }));

    expect(result.name).toBe('New Nav');
    expect(emitMock).toHaveBeenCalledWith(
      'content.navigation.updated',
      expect.objectContaining({ navigationId: 'nav-1', name: 'New Nav' }),
    );
  });

  it('should throw NavigationMenuNotFoundError when the navigation does not exist', async () => {
    mockRepo.findNavigationById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateNavigationCommand('missing', {}))).rejects.toThrow(NavigationMenuNotFoundError);
    expect(mockRepo.updateNavigation).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
