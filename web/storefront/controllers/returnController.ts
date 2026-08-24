/**
 * Storefront Return Controller
 * Manages order returns for customers
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { ManageStorefrontReturnsUseCase } from '../../../modules/order/application/useCases/ManageStorefrontReturns';

const manageStorefrontReturnsUseCase = new ManageStorefrontReturnsUseCase();

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
}

/**
 * GET: List customer returns
 */
export const listReturns = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const returns = await manageStorefrontReturnsUseCase.findByCustomerIdWithOrderNumber(user.customerId);

  storefrontRespond(req, res, 'returns/index', {
    pageName: 'My Returns',
    returns,
  });
  
};

/**
 * GET: Return request form
 */
export const returnRequestForm = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const { orderId } = req.params;

  const order = await manageStorefrontReturnsUseCase.findOrderForCustomer(orderId, user.customerId);

  if (!order) {
    return storefrontRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Order not found',
    });
  }

  const items = await manageStorefrontReturnsUseCase.findOrderItemsWithProduct(orderId);

  storefrontRespond(req, res, 'returns/create', {
    pageName: 'Request Return',
    order,
    items: items || [],
  });
  
};

/**
 * POST: Submit return request
 */
export const submitReturnRequest = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const { orderId } = req.params;
  const body = req.body as RequestBody;
  const { reason, description, _itemIds } = body;

  const order = await manageStorefrontReturnsUseCase.findOrderForCustomer(orderId, user.customerId);

  if (!order) {
    return storefrontRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Order not found',
    });
  }

  const result = await manageStorefrontReturnsUseCase.createSimple(orderId, (reason as string) || 'other', (description as string) || undefined);

  if (result) {
    return res.redirect(`/returns`);
  }

  return res.redirect('/orders');
  
};

/**
 * GET: View return details
 */
export const viewReturn = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const { returnId } = req.params;

  const returnRequest = await manageStorefrontReturnsUseCase.findByIdWithOrderNumber(returnId, user.customerId);

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
  
};
