import '../../tests/testUtils';
import { CreateThemeOverrideCommand, ManageThemeOverridesUseCase } from './ManageThemeOverrides';
import {
  ThemeNotFoundError, ThemeOverrideNotFoundError,
} from '../../domain/errors/ThemeErrors';
import type { ThemeRepository } from '../../domain/repositories/ThemeRepository';
import { createTheme, emitMock, lazyMock, uuidMock } from '../../tests/testUtils';

describe('ManageThemeOverridesUseCase', () => {
  let repo: jest.Mocked<ThemeRepository>;
  let useCase: ManageThemeOverridesUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<ThemeRepository>();
    repo.saveOverride.mockImplementation(async o => o);
    uuidMock.mockReturnValue('uuid-1');
    useCase = new ManageThemeOverridesUseCase(repo);
  });

  it('should create an override and emit theme.override.created when the theme exists', async () => {
    repo.findById.mockResolvedValue(createTheme());

    await useCase.create(new CreateThemeOverrideCommand({
      themeId: 't-1', storeId: 's-1', organizationId: 'org-1', settings: {},
    }));

    expect(emitMock).toHaveBeenCalledWith('theme.override.created', expect.objectContaining({ storeId: 's-1' }));
  });

  it('should throw ThemeNotFoundError when the theme does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.create(new CreateThemeOverrideCommand({
      themeId: 'missing', storeId: 's-1', organizationId: 'org-1', settings: {},
    }))).rejects.toThrow(ThemeNotFoundError);
  });

  it('should throw ThemeOverrideNotFoundError when updating a missing override', async () => {
    repo.findOverrideById.mockResolvedValue(null);

    await expect(useCase.update('missing', {})).rejects.toThrow(ThemeOverrideNotFoundError);
  });
});
