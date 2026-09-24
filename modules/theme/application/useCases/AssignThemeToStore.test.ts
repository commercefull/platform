import '../../tests/testUtils';
import { AssignThemeToStoreCommand, AssignThemeToStoreUseCase } from './AssignThemeToStore';
import { ThemeValidationError, ThemeNotFoundError, ThemeAssignmentNotFoundError } from '../../domain/errors/ThemeErrors';
import type { ThemeRepository } from '../../domain/repositories/ThemeRepository';
import { createTheme, emitMock, lazyMock } from '../../tests/testUtils';

describe('AssignThemeToStoreUseCase', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should emit theme.assigned when the theme is active', async () => {
    const repo = lazyMock<ThemeRepository>();
    const theme = createTheme();
    theme.activate();
    repo.findById.mockResolvedValue(theme);
    repo.assignThemeToStore.mockResolvedValue(undefined);

    await new AssignThemeToStoreUseCase(repo).execute(new AssignThemeToStoreCommand('s-1', 't-1', 'org-1'));

    expect(emitMock).toHaveBeenCalledWith('theme.assigned', { storeId: 's-1', themeId: 't-1' });
  });

  it('should throw ThemeValidationError when the theme is not active', async () => {
    const repo = lazyMock<ThemeRepository>();
    repo.findById.mockResolvedValue(createTheme());

    await expect(new AssignThemeToStoreUseCase(repo).execute(new AssignThemeToStoreCommand('s-1', 't-1', 'org-1')))
      .rejects.toThrow(ThemeValidationError);
  });

  it('should throw ThemeNotFoundError when the theme does not exist', async () => {
    const repo = lazyMock<ThemeRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(new AssignThemeToStoreUseCase(repo).execute(new AssignThemeToStoreCommand('s-1', 'missing', 'org-1')))
      .rejects.toThrow(ThemeNotFoundError);
  });

  it('should throw ThemeAssignmentNotFoundError when unassigning a store with no theme', async () => {
    const repo = lazyMock<ThemeRepository>();
    repo.findThemeAssignment.mockResolvedValue(null);

    await expect(new AssignThemeToStoreUseCase(repo).unassign('s-1'))
      .rejects.toThrow(ThemeAssignmentNotFoundError);
  });
});
