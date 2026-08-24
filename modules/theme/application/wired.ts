import { ThemeRepositoryImpl } from '../infrastructure/repositories/ThemeRepositoryImpl';
import {
  ManageThemesUseCase,
  ManageThemeOverridesUseCase,
  AssignThemeToStoreUseCase,
  ResolveStoreThemeUseCase,
} from './useCases/Theme';

const themeRepository = new ThemeRepositoryImpl();

export const manageThemesUseCase = new ManageThemesUseCase(themeRepository);
export const manageOverridesUseCase = new ManageThemeOverridesUseCase(themeRepository);
export const assignThemeUseCase = new AssignThemeToStoreUseCase(themeRepository);
export const resolveThemeUseCase = new ResolveStoreThemeUseCase(themeRepository);
