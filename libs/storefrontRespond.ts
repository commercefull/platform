import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';

type ResponseData = Record<string, unknown>;

const DEFAULT_THEME = 'default';

/**
 * Storefront Response Helper
 * Renders customer-facing storefront views using the active theme.
 * The theme name is resolved by middleware and stored in res.locals.theme.
 * Falls back to 'default' theme, then to 'default' if the themed view is missing.
 */
export async function storefrontRespond(req: TypedRequest, res: Response, view: string, data: ResponseData) {
  const successMsg = req.flash ? req.flash('success')[0] : null;
  const errorMsg = req.flash ? req.flash('error')[0] : null;

  const themeName = res.locals.theme || DEFAULT_THEME;
  const viewData = {
    user: req.user,
    session: req.session,
    categories: res.locals.categories || [],
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
