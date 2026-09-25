import type { HttpRequest, HttpResponse } from './http';
import { formatCents, formatCentsWithTax, formatPrice, formatPriceWithTax } from './money';
import { popFlashMessages } from './flash';

type ResponseData = Record<string, unknown>;

const DEFAULT_THEME = 'default';

/**
 * Storefront Response Helper
 * Renders customer-facing storefront views using the active theme.
 * The theme name is resolved by middleware and stored in res.locals.theme.
 * Falls back to 'default' theme, then to 'default' if the themed view is missing.
 */
export async function storefrontRespond(req: HttpRequest, res: HttpResponse, view: string, data: ResponseData) {
  const { successMsg, errorMsg } = popFlashMessages(req);

  const themeName = res.locals.theme || DEFAULT_THEME;

  // Build canonical URL from the request
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const canonicalUrl = `${protocol}://${host}${req.originalUrl || req.url || ''}`;

  const viewData = {
    user: req.user,
    session: req.session,
    categories: res.locals.categories || [],
    // Store context (set by storeResolutionMiddleware)
    store: res.locals.store || null,
    storeId: res.locals.storeId || '',
    storeSlug: res.locals.storeSlug || 'us',
    currency: res.locals.currency || 'USD',
    locale: res.locals.locale || 'en-US',
    region: res.locals.region || 'US',
    // Theme settings (set by themeMiddleware)
    themeSettings: res.locals.themeSettings || {},
    themeCssVariables: res.locals.themeCssVariables || {},
    themeCustomLogoUrl: res.locals.themeCustomLogoUrl || null,
    themeCustomFaviconUrl: res.locals.themeCustomFaviconUrl || null,
    // SEO defaults (controllers can override via data)
    canonicalUrl,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    // Production flag for conditional asset loading
    isProduction: process.env.NODE_ENV === 'production',
    // Price formatting helpers (from libs/money)
    formatPrice,
    formatPriceWithTax,
    formatCents,
    formatCentsWithTax,
    successMsg,
    errorMsg,
    ...data,
  };

  const themedPath = `storefront/themes/${themeName}/${view}`;

  // If using the default theme, render directly (no fallback needed)
  if (themeName === DEFAULT_THEME) {
    res.render(themedPath, viewData);
    return;
  }

  // For non-default themes, attempt the themed view and fall back to default
  res.render(themedPath, viewData, (err, body) => {
    if (err) {
      res.render(`storefront/themes/${DEFAULT_THEME}/${view}`, viewData);
      return;
    }
    res.send(body);
  });
}
