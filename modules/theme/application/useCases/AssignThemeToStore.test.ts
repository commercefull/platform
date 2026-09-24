import '../../tests/testUtils';
import { AssignThemeToStoreCommand, AssignThemeToStoreUseCase } from './AssignThemeToStore';
import { ThemeValidationError } from '../../domain/errors/ThemeErrors';
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
});
