import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from './logger';

type ResponseData = Record<string, unknown>;

/**
 * Admin Portal Response Helper
 * Renders admin portal views with common admin data
 */
export async function adminRespond(req: TypedRequest, res: Response, view: string, data: ResponseData) {
  const successMsg = req.flash ? req.flash('success')[0] : null;
  const errorMsg = req.flash ? req.flash('error')[0] : null;

  const noAdminLayoutViews = ['login', 'register', 'forgot-password', 'reset-password'];

  const viewData = {
    user: req.user,
    session: req.session,
    successMsg,
    errorMsg,
    ...data,
  };

  res.render(`admin/views/${view}`, viewData, (err, bodyContent) => {
    if (err) {
      logger.error('Error rendering view', { error: err });
      return res.status(500).send('Internal Server Error');
    }

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
