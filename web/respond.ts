import { Request, Response } from "express";

type ResponseData = Record<string, any>;

export async function merchantRespond(req: any, res: Response, view: string, data: ResponseData) {
  res.render(`admin/views/${view}`, {
    ...data
  });
}

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
    ...data
  });
}