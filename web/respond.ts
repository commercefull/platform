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

  res.render(`admin/views/${view}`, {
    // Common variables needed by admin portal
    user: (req as any).user,
    session: req.session,
    successMsg,
    errorMsg,
    // User-provided data
    ...data,
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

  res.render(`merchant/views/${view}`, {
    // Common variables needed by merchant portal
    user: (req as any).user,
    session: req.session,
    successMsg,
    errorMsg,
    // Merchant-specific data
    merchantId: (req as any).user?.merchantId,
    // User-provided data
    ...data,
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

  res.render(`b2b/views/${view}`, {
    // Common variables needed by B2B portal
    user: (req as any).user,
    session: req.session,
    successMsg,
    errorMsg,
    // B2B-specific data
    companyId: (req as any).user?.companyId,
    userRole: (req as any).user?.role,
    // User-provided data
    ...data,
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
