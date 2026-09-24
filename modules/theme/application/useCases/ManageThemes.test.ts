import '../../tests/testUtils';
import { CreateThemeCommand, ManageThemesUseCase } from './ManageThemes';
import {
  ThemeAlreadyExistsError, ThemeNotFoundError, BuiltInThemeCannotBeDeletedError,
} from '../../domain/errors/ThemeErrors';
import type { ThemeRepository } from '../../domain/repositories/ThemeRepository';
import { createTheme, emitMock, lazyMock, uuidMock } from '../../tests/testUtils';

const THEME_INPUT = {
  slug: 'my-theme', name: 'My Theme',
  settingsSchema: { groups: [] }, defaultSettings: {},
  layout: { regions: ['header', 'main', 'footer'], pageLayouts: [] },
  components: { components: [] },
};

describe('ManageThemesUseCase', () => {
  let repo: jest.Mocked<ThemeRepository>;
  let useCase: ManageThemesUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<ThemeRepository>();
    repo.save.mockImplementation(async t => t);
    uuidMock.mockReturnValue('uuid-1');
    useCase = new ManageThemesUseCase(repo);
  });

  it('should create a theme and emit theme.created when the slug is unused', async () => {
    repo.findBySlug.mockResolvedValue(null);

    const result = await useCase.create(new CreateThemeCommand(THEME_INPUT));

    expect(result.slug).toBe('my-theme');
    expect(emitMock).toHaveBeenCalledWith('theme.created', expect.objectContaining({ slug: 'my-theme' }));
  });

  it('should throw ThemeAlreadyExistsError when the slug is taken', async () => {
    repo.findBySlug.mockResolvedValue(createTheme());

    await expect(useCase.create(new CreateThemeCommand(THEME_INPUT))).rejects.toThrow(ThemeAlreadyExistsError);
  });

  it('should throw ThemeNotFoundError when the theme does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.getById('missing')).rejects.toThrow(ThemeNotFoundError);
  });

  it('should throw BuiltInThemeCannotBeDeletedError when deleting a built-in theme', async () => {
    repo.findById.mockResolvedValue(createTheme({ type: 'built_in' }));

    await expect(useCase.delete('t-1')).rejects.toThrow(BuiltInThemeCannotBeDeletedError);
  });

  it('should activate a theme and emit theme.activated', async () => {
    repo.findById.mockResolvedValue(createTheme());

    await useCase.activate('t-1');

    expect(emitMock).toHaveBeenCalledWith('theme.activated', expect.objectContaining({ themeId: 'theme-1' }));
  });
});
