import type { HttpRequest, HttpResponse } from './http';
import { logger } from './logger';
import { popFlashMessages } from './flash';

type ResponseData = Record<string, unknown>;

/**
 * Admin Portal Response Helper
 * Renders admin portal views with common admin data
 */
export async function adminRespond(req: HttpRequest, res: HttpResponse, view: string, data: ResponseData) {
  const { successMsg, errorMsg } = popFlashMessages(req);

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
