/**
 * Storefront Return Controller
 * Manages order returns for customers
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import orderReturnRepo from '../../../modules/order/infrastructure/repositories/orderReturnRepo';

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
}

/**
 * GET: List customer returns
 */
export const listReturns = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const returns = await orderReturnRepo.findByCustomerIdWithOrderNumber(user.customerId);

    storefrontRespond(req, res, 'returns/index', {
      pageName: 'My Returns',
      returns,
    });
  } catch (error) {
    logger.error('Error loading returns:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load returns',
    });
  }
};

/**
 * GET: Return request form
 */
export const returnRequestForm = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const { orderId } = req.params;

    const order = await orderReturnRepo.findOrderForCustomer(orderId, user.customerId);

    if (!order) {
      return storefrontRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Order not found',
      });
    }

    const items = await orderReturnRepo.findOrderItemsWithProduct(orderId);

    storefrontRespond(req, res, 'returns/create', {
      pageName: 'Request Return',
      order,
      items: items || [],
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load return form',
    });
  }
};

/**
 * POST: Submit return request
 */
export const submitReturnRequest = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const { orderId } = req.params;
    const body = req.body as RequestBody;
    const { reason, description, _itemIds } = body;

    const order = await orderReturnRepo.findOrderForCustomer(orderId, user.customerId);

    if (!order) {
      return storefrontRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Order not found',
      });
    }

    const result = await orderReturnRepo.createSimple(orderId, (reason as string) || 'other', (description as string) || undefined);

    if (result) {
      return res.redirect(`/returns`);
    }

    return res.redirect('/orders');
  } catch (error) {
    logger.error('Error submitting return:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to submit return request',
    });
  }
};

/**
 * GET: View return details
 */
export const viewReturn = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const { returnId } = req.params;

    const returnRequest = await orderReturnRepo.findByIdWithOrderNumber(returnId, user.customerId);

    if (!returnRequest) {
      return storefrontRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Return not found',
      });
    }

    storefrontRespond(req, res, 'returns/view', {
      pageName: `Return #${returnId}`,
      returnRequest,
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load return details',
    });
  }
};
