import { Request, Response, NextFunction } from 'express';
import { resolveThemeUseCase } from '../../modules/theme';

/**
 * Theme Resolution Middleware
 *
 * Resolves the active theme for the current store and attaches it to
 * res.locals so that storefrontRespond and EJS templates can use it.
 *
 * Resolution order:
 * 1. Check if a store ID is available (req.session.storeId or req.params.storeId)
 * 2. Call resolveThemeUseCase to get the ResolvedTheme (theme + overrides)
 * 3. Fall back to 'default' if no theme is assigned
 *
 * Sets res.locals:
 *   - theme: theme slug (e.g. 'default', 'minimal', 'boutique')
 *   - themeSettings: resolved theme settings object
 *   - themeCssVariables: CSS custom properties from the theme
 *   - themeCustomCss: any custom CSS from overrides
 *   - themeCustomLogoUrl: custom logo URL from overrides
 *   - themeCustomFaviconUrl: custom favicon URL from overrides
 */
export async function resolveTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const storeId =
      (req.session as unknown as Record<string, unknown> | undefined)?.storeId as string | undefined ||
      (req.params?.storeId as string | undefined);

    let themeSlug = 'default';
    let themeSettings: Record<string, string | number | boolean> = {};
    let cssVariables: Record<string, string> = {};
    let customCss: string | undefined;
    let customLogoUrl: string | undefined;
    let customFaviconUrl: string | undefined;
    let customHeadTags: string[] | undefined;
    let customBodyAttributes: Record<string, string> | undefined;

    if (storeId) {
      const resolved = await resolveThemeUseCase.execute(storeId);
      if (resolved) {
        themeSlug = resolved.theme.slug;
        themeSettings = resolved.settings;
        cssVariables = resolved.cssVariables;
        customCss = resolved.customCss;
        customLogoUrl = resolved.customLogoUrl;
        customFaviconUrl = resolved.customFaviconUrl;
        customHeadTags = resolved.customHeadTags;
        customBodyAttributes = resolved.customBodyAttributes;
      }
    }

    res.locals.theme = themeSlug;
    res.locals.themeSettings = themeSettings;
    res.locals.themeCssVariables = cssVariables;
    res.locals.themeCustomCss = customCss;
    res.locals.themeCustomLogoUrl = customLogoUrl;
    res.locals.themeCustomFaviconUrl = customFaviconUrl;
    res.locals.themeCustomHeadTags = customHeadTags;
    res.locals.themeCustomBodyAttributes = customBodyAttributes;
  } catch {
    // Silently fall back to default theme on any error
    res.locals.theme = 'default';
    res.locals.themeSettings = {};
    res.locals.themeCssVariables = {};
  }

  next();
}
