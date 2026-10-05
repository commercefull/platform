import { ThemeRepository } from '../../domain/repositories/ThemeRepository';
import { themeRegistry, ResolvedTheme } from '../../domain/services/ThemeRegistry';

// ============================================================================
// Resolve Store Theme
// ============================================================================

export class ResolveStoreThemeUseCase {
  constructor(private readonly themeRepository: ThemeRepository) {}

  async execute(storeId: string): Promise<ResolvedTheme | null> {
    return themeRegistry.resolveThemeForStore(storeId, this.themeRepository);
  }

  async executeBySlug(slug: string, overrides?: Record<string, string | number | boolean>): Promise<ResolvedTheme | null> {
    return themeRegistry.resolveThemeForSlug(slug, overrides, this.themeRepository);
  }
}
