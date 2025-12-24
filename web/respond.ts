import { Request, Response } from 'express';

type ResponseData = Record<string, any>;

/**
 * Admin Portal Response Helper
 * Renders admin portal views with common admin data
 */
export async function adminRespond(req: Request, res: Response, view: string, data: ResponseData) {
  // Get flash messages from middleware
  const successMsg = (req as any).flash ? (req as any).flash('success')[0] : null;
  const errorMsg = (req as any).flash ? (req as any).flash('error')[0] : null;

  const noAdminLayoutViews = ['login', 'register', 'forgot-password', 'reset-password'];

  // Render the specific view content first
  const viewData = {
    // Common variables needed by admin portal
    user: (req as any).user,
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
 * Merchant Hub Response Helper
 * Renders merchant portal views with merchant-scoped data
 */
export async function merchantRespond(req: Request, res: Response, view: string, data: ResponseData) {
  // Get flash messages from middleware
  const successMsg = (req as any).flash ? (req as any).flash('success')[0] : null;
  const errorMsg = (req as any).flash ? (req as any).flash('error')[0] : null;

  const noMerchantLayoutViews = ['login', 'register', 'forgot-password', 'reset-password'];

  // Render the specific view content first
  const viewData = {
    // Common variables needed by merchant portal
    user: (req as any).user,
    session: req.session,
    successMsg,
    errorMsg,
    merchantId: (req as any).user?.merchantId,
    // User-provided data
    ...data,
  };

  // Render the view content
  res.render(`merchant/views/${view}`, viewData, (err, bodyContent) => {
    if (err) {
      console.error('Error rendering merchant view:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Now render the layout with the body content
    const layoutData = {
      ...viewData,
      body: bodyContent,
    };

    if (noMerchantLayoutViews.includes(view)) {
      res.render('merchant/views/layout-public', layoutData);
    } else {
      res.render('merchant/views/layout', layoutData);
    }
  });
}

/**
 * B2B Portal Response Helper
 * Renders B2B portal views with company-scoped data
 */
export async function b2bRespond(req: Request, res: Response, view: string, data: ResponseData) {
  // Get flash messages from middleware
  const successMsg = (req as any).flash ? (req as any).flash('success')[0] : null;
  const errorMsg = (req as any).flash ? (req as any).flash('error')[0] : null;

  const noB2BLayoutViews = ['login', 'register', 'forgot-password', 'reset-password'];

  // Render the specific view content first
  const viewData = {
    // Common variables needed by B2B portal
    user: (req as any).user,
    session: req.session,
    successMsg,
    errorMsg,
    companyId: (req as any).user?.companyId,
    userRole: (req as any).user?.role,
    // User-provided data
    ...data,
  };

  // Render the view content
  res.render(`b2b/views/${view}`, viewData, (err, bodyContent) => {
    if (err) {
      console.error('Error rendering B2B view:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Now render the layout with the body content
    const layoutData = {
      ...viewData,
      body: bodyContent,
    };

    if (noB2BLayoutViews.includes(view)) {
      res.render('b2b/views/layout-public', layoutData);
    } else {
      res.render('b2b/views/layout', layoutData);
    }
  });
}

/**
 * Storefront Response Helper (existing)
 * Renders customer-facing storefront views
 */
export async function storefrontRespond(req: Request, res: Response, view: string, data: ResponseData) {
  // Get flash messages from middleware
  const successMsg = (req as any).flash ? (req as any).flash('success')[0] : null;
  const errorMsg = (req as any).flash ? (req as any).flash('error')[0] : null;

  res.render(`storefront/views/${view}`, {
    // Common variables needed by header/navbar partials
    user: (req as any).user,
    session: req.session,
    categories: res.locals.categories || [],
    successMsg,
    errorMsg,
    // User-provided data
    ...data,
  });
}
