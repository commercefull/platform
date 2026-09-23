import { ThemeRepositoryImpl } from '../infrastructure/repositories/ThemeRepositoryImpl';
import { ManageThemesUseCase } from './useCases/ManageThemes';
import { ManageThemeOverridesUseCase } from './useCases/ManageThemeOverrides';
import { AssignThemeToStoreUseCase } from './useCases/AssignThemeToStore';
import { ResolveStoreThemeUseCase } from './useCases/ResolveStoreTheme';

const themeRepository = new ThemeRepositoryImpl();

export const manageThemesUseCase = new ManageThemesUseCase(themeRepository);
export const manageOverridesUseCase = new ManageThemeOverridesUseCase(themeRepository);
export const assignThemeUseCase = new AssignThemeToStoreUseCase(themeRepository);
export const resolveThemeUseCase = new ResolveStoreThemeUseCase(themeRepository);

export { ThemeRepositoryImpl };
