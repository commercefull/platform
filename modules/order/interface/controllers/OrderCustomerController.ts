/**
 * Order Customer Controller
 * HTTP interface for customer-facing order operations with content negotiation
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import OrderRepo from '../../infrastructure/repositories/OrderRepository';
import { 
  CreateOrderCommand, 
  CreateOrderUseCase,
  OrderItemInput,
  AddressInput
} from '../../application/useCases/CreateOrder';
import { GetOrderCommand, GetOrderUseCase } from '../../application/useCases/GetOrder';
import { GetCustomerOrdersCommand, GetCustomerOrdersUseCase } from '../../application/useCases/GetCustomerOrders';
import { CancelOrderCommand, CancelOrderUseCase } from '../../application/useCases/CancelOrder';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

type ResponseData = Record<string, any>;

/**
 * Respond with JSON or HTML based on Accept header
 */
function respond(
  req: Request,
  res: Response,
  data: ResponseData,
  statusCode: number = 200,
  htmlTemplate?: string
): void {
  const acceptHeader = req.get('Accept') || 'application/json';

  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { data, success: true });
  } else {
    res.status(statusCode).json({ success: true, data });
  }
}

/**
 * Respond with error in JSON or HTML based on Accept header
 */
function respondError(
  req: Request,
  res: Response,
  message: string,
  statusCode: number = 500,
  htmlTemplate?: string
): void {
  const acceptHeader = req.get('Accept') || 'application/json';

  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { error: message, success: false });
  } else {
    res.status(statusCode).json({ success: false, error: message });
  }
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * Get customer's orders
 * GET /orders
 */
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?._id || (req as any).user?.id;

    if (!customerId) {
      respondError(req, res, 'Authentication required', 401, 'order/error');
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const command = new GetCustomerOrdersCommand(customerId, limit, offset);
    const useCase = new GetCustomerOrdersUseCase(OrderRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'order/list');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to get orders', 500, 'order/error');
  }
};

/**
 * Get order by ID
 * GET /orders/:orderId
 */
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const customerId = (req as any).user?.customerId || (req as any).user?._id || (req as any).user?.id;

    const command = new GetOrderCommand(orderId, undefined, customerId);
    const useCase = new GetOrderUseCase(OrderRepo);
    const order = await useCase.execute(command);

    if (!order) {
      respondError(req, res, 'Order not found', 404, 'order/error');
      return;
    }

    respond(req, res, order, 200, 'order/detail');
  } catch (error: any) {
    logger.error('Error:', error);
    
    
    if (error.message.includes('permission')) {
      respondError(req, res, error.message, 403, 'order/error');
      return;
    }
    
    respondError(req, res, error.message || 'Failed to get order', 500, 'order/error');
  }
};

/**
 * Get order by order number
 * GET /orders/number/:orderNumber
 */
export const getOrderByNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber } = req.params;
    const customerId = (req as any).user?.customerId || (req as any).user?._id || (req as any).user?.id;

    const command = new GetOrderCommand(undefined, orderNumber, customerId);
    const useCase = new GetOrderUseCase(OrderRepo);
    const order = await useCase.execute(command);

    if (!order) {
      respondError(req, res, 'Order not found', 404, 'order/error');
      return;
    }

    respond(req, res, order, 200, 'order/detail');
  } catch (error: any) {
    logger.error('Error:', error);
    
    
    if (error.message.includes('permission')) {
      respondError(req, res, error.message, 403, 'order/error');
      return;
    }
    
    respondError(req, res, error.message || 'Failed to get order', 500, 'order/error');
  }
};

/**
 * Create a new order
 * POST /orders
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?._id || (req as any).user?.id;
    const {
      items,
      shippingAddress,
      billingAddress,
      basketId,
      currencyCode,
      customerEmail,
      customerPhone,
      customerName,
      customerNotes,
      shippingTotal,
      hasGiftWrapping,
      giftMessage,
      isGift
    } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      respondError(req, res, 'Order must contain at least one item', 400, 'order/error');
      return;
    }

    if (!shippingAddress) {
      respondError(req, res, 'Shipping address is required', 400, 'order/error');
      return;
    }

    const email = customerEmail || (req as any).user?.email;
    if (!email) {
      respondError(req, res, 'Customer email is required', 400, 'order/error');
      return;
    }

    const command = new CreateOrderCommand(
      customerId,
      email,
      items as OrderItemInput[],
      shippingAddress as AddressInput,
      billingAddress as AddressInput,
      basketId,
      currencyCode,
      customerPhone,
      customerName,
      customerNotes,
      shippingTotal,
      hasGiftWrapping,
      giftMessage,
      isGift,
      req.ip,
      req.get('User-Agent')
    );

    const useCase = new CreateOrderUseCase(OrderRepo);
    const order = await useCase.execute(command);

    respond(req, res, order, 201, 'order/confirmation');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to create order', 500, 'order/error');
  }
};

/**
 * Cancel an order
 * POST /orders/:orderId/cancel
 */
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const customerId = (req as any).user?.customerId || (req as any).user?._id || (req as any).user?.id;

    if (!customerId) {
      respondError(req, res, 'Authentication required', 401, 'order/error');
      return;
    }

    const cancelReason = reason || 'Cancelled by customer';

    const command = new CancelOrderCommand(orderId, cancelReason, customerId);
    const useCase = new CancelOrderUseCase(OrderRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'order/cancelled');
  } catch (error: any) {
    logger.error('Error:', error);
    
    
    if (error.message.includes('permission')) {
      respondError(req, res, error.message, 403, 'order/error');
      return;
    }
    
    if (error.message.includes('cannot be cancelled')) {
      respondError(req, res, error.message, 400, 'order/error');
      return;
    }
    
    respondError(req, res, error.message || 'Failed to cancel order', 500, 'order/error');
  }
};
