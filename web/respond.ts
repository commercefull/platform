import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';

type ResponseData = Record<string, unknown>;

/**
 * Admin Portal Response Helper
 * Renders admin portal views with common admin data
 */
export async function adminRespond(req: TypedRequest, res: Response, view: string, data: ResponseData) {
  // Get flash messages from middleware
  const successMsg = req.flash ? req.flash('success')[0] : null;
  const errorMsg = req.flash ? req.flash('error')[0] : null;

  const noAdminLayoutViews = ['login', 'register', 'forgot-password', 'reset-password'];

  // Render the specific view content first
  const viewData = {
    // Common variables needed by admin portal
    user: req.user,
    session: req.session,
    successMsg,
    errorMsg,
    // User-provided data
    ...data,
  };

  // Render the view content
  res.render(`admin/views/${view}`, viewData, (err, bodyContent) => {
    if (err) {
      console.error('Error rendering view:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Now render the layout with the body content
    const layoutData = {
      ...viewData,
      body: bodyContent,
    };

    if (noAdminLayoutViews.includes(view)) {
      res.render('admin/views/layout-public', layoutData);
    } else {
      res.render('admin/views/layout', layoutData);
    }
  });
}

/**
 * Storefront Response Helper (existing)
 * Renders customer-facing storefront views
 */
export async function storefrontRespond(req: TypedRequest, res: Response, view: string, data: ResponseData) {
  // Get flash messages from middleware
  const successMsg = req.flash ? req.flash('success')[0] : null;
  const errorMsg = req.flash ? req.flash('error')[0] : null;

  res.render(`storefront/views/${view}`, {
    // Common variables needed by header/navbar partials
    user: req.user,
    session: req.session,
    categories: res.locals.categories || [],
    successMsg,
    errorMsg,
    // User-provided data
    ...data,
  });
}
