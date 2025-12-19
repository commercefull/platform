/**
 * Storefront Order Controller
 * Handles order history and order details for customers
 */

import { Request, Response } from 'express';
import { storefrontRespond } from '../../../libs/templates';
import OrderRepo from '../../../modules/order/infrastructure/repositories/OrderRepository';
import { ListOrdersCommand, ListOrdersUseCase } from '../../../modules/order/application/useCases/ListOrders';
import { GetOrderCommand, GetOrderUseCase } from '../../../modules/order/application/useCases/GetOrder';

// ============================================================================
// Order History
// ============================================================================

export const orderHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.redirect('/signin?redirect=/orders');
    }

    const customerId = (req as any).user.customerId;
    const { page = '1', limit = '10', status } = req.query;

    const filters: any = { customerId };
    if (status && status !== 'all') {
      filters.status = status;
    }

    const command = new ListOrdersCommand(
      filters,
      parseInt(limit as string),
      (parseInt(page as string) - 1) * parseInt(limit as string)
    );

    const useCase = new ListOrdersUseCase(OrderRepo);
    const result = await useCase.execute(command);

    storefrontRespond(req, res, 'user/order-history', {
      pageName: 'Order History',
      orders: result.orders,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
        totalOrders: result.total,
        hasNext: (parseInt(page as string) * parseInt(limit as string)) < result.total,
        hasPrev: parseInt(page as string) > 1
      },
      filters: { status },
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading order history:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load order history',
      user: req.user
    });
  }
};

// ============================================================================
// Order Details
// ============================================================================

export const orderDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.redirect('/signin?redirect=/orders');
    }

    const { orderId } = req.params;
    const customerId = (req as any).user.customerId;

    const command = new GetOrderCommand(orderId);
    const useCase = new GetOrderUseCase(OrderRepo);
    const order = await useCase.execute(command);

    if (!order) {
      storefrontRespond(req, res, '404', {
        pageName: 'Order Not Found',
        user: req.user
      });
      return;
    }

    // Verify order belongs to customer
    if (order.customerId !== customerId) {
      return res.status(403).redirect('/orders?error=' + encodeURIComponent('Access denied'));
    }

    // Calculate totals
    const totals = calculateOrderTotals(order);

    storefrontRespond(req, res, 'user/order-details', {
      pageName: `Order ${order.orderNumber}`,
      order: { ...order, totals },
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading order details:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load order details',
      user: req.user
    });
  }
};

// ============================================================================
// Order Tracking
// ============================================================================

export const orderTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber } = req.params;

    // For guest tracking, we don't require authentication
    // but we should verify the order exists

    const command = new GetOrderCommand(undefined, orderNumber); // Lookup by order number
    const useCase = new GetOrderUseCase(OrderRepo);
    const order = await useCase.execute(command);

    if (!order) {
      storefrontRespond(req, res, '404', {
        pageName: 'Order Not Found',
        user: req.user
      });
      return;
    }

    // For security, we might want to hide sensitive info for guest tracking
    // or require email verification

    const totals = calculateOrderTotals(order);
    const timeline = generateOrderTimeline(order);

    storefrontRespond(req, res, 'shop/order-tracking', {
      pageName: `Track Order ${order.orderNumber}`,
      order: { ...order, totals, timeline },
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading order tracking:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load order tracking',
      user: req.user
    });
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

function calculateOrderTotals(order: any) {
  // Orders should have tax already calculated and stored
  // Use the order's stored values directly
  const subtotal = order.subtotal || order.items?.reduce((sum: number, item: any) => {
    return sum + ((item.unitPrice || item.price) * item.quantity);
  }, 0) || 0;

  const tax = order.taxTotal || order.tax || 0;
  const shipping = order.shippingTotal || order.shipping || 0;
  const total = order.totalAmount || order.total || (subtotal + tax + shipping);

  return {
    subtotal: typeof subtotal === 'number' ? subtotal.toFixed(2) : subtotal,
    tax: typeof tax === 'number' ? tax.toFixed(2) : tax,
    shipping: typeof shipping === 'number' ? shipping.toFixed(2) : shipping,
    total: typeof total === 'number' ? total.toFixed(2) : total
  };
}

function generateOrderTimeline(order: any) {
  const timeline = [
    {
      status: 'ordered',
      title: 'Order Placed',
      description: 'Your order has been received',
      date: order.createdAt,
      completed: true
    }
  ];

  // Add more timeline events based on order status
  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    timeline.push({
      status: 'processing',
      title: 'Processing',
      description: 'Your order is being prepared',
      date: order.updatedAt,
      completed: ['processing', 'shipped', 'delivered'].includes(order.status)
    });
  }

  if (['shipped', 'delivered'].includes(order.status)) {
    timeline.push({
      status: 'shipped',
      title: 'Shipped',
      description: 'Your order has been shipped',
      date: order.shippedAt,
      completed: ['shipped', 'delivered'].includes(order.status)
    });
  }

  if (order.status === 'delivered') {
    timeline.push({
      status: 'delivered',
      title: 'Delivered',
      description: 'Your order has been delivered',
      date: order.deliveredAt,
      completed: true
    });
  }

  return timeline;
}
