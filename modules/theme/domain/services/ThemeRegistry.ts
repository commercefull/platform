/**
 * Theme Registry Service
 *
 * In-memory registry for themes. Built-in themes are registered at boot.
 * Custom themes are loaded from the repository on demand.
 * Provides override resolution: theme defaults → store overrides → final settings.
 */

import { Theme } from '../entities/Theme';
import { ThemeOverride } from '../entities/ThemeOverride';
import { ThemeRepository } from '../repositories/ThemeRepository';
import { createBuiltInThemes } from '../builtInThemes';
import { ThemeNotFoundError } from '../errors/ThemeErrors';

export interface ResolvedTheme {
  theme: Theme;
  override?: ThemeOverride;
  settings: Record<string, string | number | boolean>;
  cssVariables: Record<string, string>;
  customCss?: string;
  customLogoUrl?: string;
  customFaviconUrl?: string;
  customBannerUrl?: string;
  customHeadTags?: string[];
  customBodyAttributes?: Record<string, string>;
}

export class ThemeRegistry {
  private themes = new Map<string, Theme>();
  private themesBySlug = new Map<string, Theme>();
  private initialized = false;

  /**
   * Register built-in themes. Called at boot.
   */
  registerBuiltInThemes(): void {
    if (this.initialized) return;
    const builtIn = createBuiltInThemes();
    for (const theme of builtIn) {
      theme.activate();
      this.registerTheme(theme);
    }
    this.initialized = true;
  }

  /**
   * Register a single theme.
   */
  registerTheme(theme: Theme): void {
    this.themes.set(theme.themeId, theme);
    this.themesBySlug.set(theme.slug, theme);
  }

  /**
   * Unregister a theme (only non-built-in).
   */
  unregisterTheme(themeId: string): void {
    const theme = this.themes.get(themeId);
    if (theme && !theme.isBuiltIn()) {
      this.themes.delete(themeId);
      this.themesBySlug.delete(theme.slug);
    }
  }

  /**
   * Get a theme by ID from registry.
   */
  getTheme(themeId: string): Theme | undefined {
    return this.themes.get(themeId);
  }

  /**
   * Get a theme by slug from registry.
   */
  getThemeBySlug(slug: string): Theme | undefined {
    return this.themesBySlug.get(slug);
  }

  /**
   * List all registered themes.
   */
  listThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  /**
   * List active themes only.
   */
  listActiveThemes(): Theme[] {
    return this.listThemes().filter(t => t.isActive());
  }

  /**
   * List built-in themes.
   */
  listBuiltInThemes(): Theme[] {
    return this.listThemes().filter(t => t.isBuiltIn());
  }

  /**
   * Resolve the complete theme configuration for a store.
   * This is the main entry point for storefront rendering.
   */
  async resolveThemeForStore(
    storeId: string,
    repository: ThemeRepository,
  ): Promise<ResolvedTheme | null> {
    const assignment = await repository.findThemeAssignment(storeId);
    if (!assignment) return null;

    const theme = this.themes.get(assignment.themeId);
    if (!theme) return null;

    let override: ThemeOverride | undefined;
    if (assignment.overrideId) {
      const found = await repository.findOverrideById(assignment.overrideId);
      if (found && found.isActive) override = found;
    }

    if (!override) {
      // Try to find active override by store
      const found = await repository.findOverrideByStore(storeId);
      if (found && found.isActive) override = found;
    }

    const settings = theme.resolveSettings(override?.settings);
    const cssVariables = theme.toCSSVariables(override?.settings);

    return {
      theme,
      override,
      settings,
      cssVariables,
      customCss: override?.customCss,
      customLogoUrl: override?.customLogoUrl,
      customFaviconUrl: override?.customFaviconUrl,
      customBannerUrl: override?.customBannerUrl,
      customHeadTags: override?.customHeadTags,
      customBodyAttributes: override?.customBodyAttributes,
    };
  }

  /**
   * Generate the CSS string for a resolved theme.
   */
  generateCSS(resolved: ResolvedTheme): string {
    const vars = Object.entries(resolved.cssVariables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    let css = `:root {\n${vars}\n}`;

    if (resolved.customCss) {
      css += '\n\n' + resolved.customCss;
    }

    return css;
  }

  /**
   * Generate head tags for a resolved theme.
   */
  generateHeadTags(resolved: ResolvedTheme): string[] {
    const tags: string[] = [];

    // Font preloads from settings
    const headingFont = resolved.settings['headingFont'] as string;
    const bodyFont = resolved.settings['bodyFont'] as string;

    if (headingFont && headingFont.includes('Playfair')) {
      tags.push('<link rel="preconnect" href="https://fonts.googleapis.com">');
      tags.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
      tags.push('<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">');
    }

    if (bodyFont && bodyFont.includes('Lato')) {
      if (!tags.length) {
        tags.push('<link rel="preconnect" href="https://fonts.googleapis.com">');
        tags.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
      }
      tags.push('<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap" rel="stylesheet">');
    }

    // Custom head tags from override
    if (resolved.customHeadTags) {
      tags.push(...resolved.customHeadTags);
    }

    return tags;
  }

  /**
   * Generate body attributes for a resolved theme.
   */
  generateBodyAttributes(resolved: ResolvedTheme): Record<string, string> {
    const attrs: Record<string, string> = {
      'data-theme': resolved.theme.slug,
    };

    if (resolved.customBodyAttributes) {
      Object.assign(attrs, resolved.customBodyAttributes);
    }

    return attrs;
  }

  /**
   * Ensure a theme is in the registry, loading from repository if needed.
   */
  async ensureThemeLoaded(themeId: string, repository: ThemeRepository): Promise<Theme> {
    const cached = this.themes.get(themeId);
    if (cached) return cached;

    const theme = await repository.findById(themeId);
    if (!theme) throw new ThemeNotFoundError(themeId);

    this.registerTheme(theme);
    return theme;
  }
}

// Singleton instance
export const themeRegistry = new ThemeRegistry();
