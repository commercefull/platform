import { Request, Response } from "express";

import { storefrontRespond } from "../../../libs/templates";
import { OrderRepo, OrderStatus } from "../repos/orderRepo";

// Extend Express Request with User
interface UserRequest extends Request {
  user?: {
    _id?: string;
    id?: string;
    role?: string;
  };
  flash: {
    (): { [key: string]: string[] };
    (message: string): string[];
    (type: string, message: string | string[]): number;
    (type: string, format: string, ...args: any[]): number;
  };
}

// Initialize the order repository
const orderRepo = new OrderRepo();

/**
 * Get all orders - for admin use
 */
export const getAllOrders = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const orders = await orderRepo.findAll();
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

/**
 * Get orders by user ID - for customer profile
 */
export const getUserOrders = async (req: UserRequest, res: Response): Promise<void> => {
  const userId = req.user?._id || req.user?.id;
  
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  
  try {
    const orders = await orderRepo.findByCustomer(userId);
    
    // Respond with the storefront template
    storefrontRespond(req, res, "user/orders", {
      title: "Your Orders",
      orders,
      orderCount: orders ? orders.length : 0
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    req.flash('error', 'Failed to load your orders. Please try again later.');
    res.redirect('/account');
  }
};

/**
 * Get details for a specific order - for customer use
 */
export const getOrderDetails = async (req: UserRequest, res: Response): Promise<void> => {
  const orderId = req.params.id;
  const userId = req.user?._id || req.user?.id;
  
  if (!userId) {
    req.flash('error', 'You must be logged in to view order details');
    res.redirect('/login');
    return;
  }
  
  try {
    const order = await orderRepo.findById(orderId);
    
    if (!order) {
      req.flash('error', 'Order not found');
      res.redirect('/account/orders');
      return;
    }
    
    // Check if the order belongs to the logged-in user
    if (order.customerId !== userId) {
      req.flash('error', 'You do not have permission to view this order');
      res.redirect('/account/orders');
      return;
    }
    
    // Fetch order items separately
    const orderItems = await orderRepo.getOrderItems(orderId);
    
    storefrontRespond(req, res, "user/order-details", {
      title: `Order #${order.orderNumber}`,
      order,
      items: orderItems
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    req.flash('error', 'Failed to load order details. Please try again later.');
    res.redirect('/account/orders');
  }
};

/**
 * Get order details - for admin use
 */
export const getOrderDetailsAdmin = async (req: UserRequest, res: Response): Promise<void> => {
  const orderId = req.params.id;
  
  try {
    const order = await orderRepo.findById(orderId);
    
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    
    // Fetch order items separately
    const orderItems = await orderRepo.getOrderItems(orderId);
    
    res.json({ 
      success: true, 
      data: { 
        order, 
        items: orderItems 
      } 
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, message: 'Failed to load order details' });
  }
};

/**
 * Create a new order
 */
export const createOrder = async (req: UserRequest, res: Response): Promise<void> => {
  const userId = req.user?._id || req.user?.id;
  const orderData = req.body;
  
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  
  try {
    // Add the customer ID to the order data
    orderData.customerId = userId;
    
    // Create the order
    const order = await orderRepo.create(orderData);
    
    // Redirect to the order confirmation page
    res.redirect(`/account/orders/${order.id}/confirmation`);
  } catch (error) {
    console.error('Error creating order:', error);
    req.flash('error', 'Failed to create your order. Please try again.');
    res.redirect('/checkout');
  }
};

/**
 * Update order status - for admin use
 */
export const updateOrderStatus = async (req: UserRequest, res: Response): Promise<void> => {
  const orderId = req.params.id;
  const { status } = req.body;
  
  // Check if status is a valid OrderStatus
  const validStatuses: OrderStatus[] = ['pending', 'processing', 'on_hold', 'completed', 'shipped', 
                                      'delivered', 'cancelled', 'refunded', 'failed', 
                                      'payment_pending', 'payment_failed', 'backordered'];
  
  if (!validStatuses.includes(status as OrderStatus)) {
    res.status(400).json({ success: false, message: 'Invalid order status' });
    return;
  }
  
  try {
    const updatedOrder = await orderRepo.updateStatus(orderId, status as OrderStatus);
    
    if (!updatedOrder) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

/**
 * Cancel an order - for customer use
 */
export const cancelOrder = async (req: UserRequest, res: Response): Promise<void> => {
  const orderId = req.params.id;
  const userId = req.user?._id || req.user?.id;
  
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  
  try {
    // Verify the order belongs to the user
    const order = await orderRepo.findById(orderId);
    
    if (!order) {
      req.flash('error', 'Order not found');
      res.redirect('/account/orders');
      return;
    }
    
    if (order.customerId !== userId) {
      req.flash('error', 'You do not have permission to cancel this order');
      res.redirect('/account/orders');
      return;
    }
    
    // Check if the order can be cancelled (only pending or processing orders)
    if (order.status !== 'pending' && order.status !== 'processing') {
      req.flash('error', 'This order cannot be cancelled');
      res.redirect(`/account/orders/${orderId}`);
      return;
    }
    
    // Update the order status to cancelled
    await orderRepo.updateStatus(orderId, 'cancelled');
    
    req.flash('success', 'Your order has been cancelled');
    res.redirect('/account/orders');
  } catch (error) {
    console.error('Error cancelling order:', error);
    req.flash('error', 'Failed to cancel your order. Please try again.');
    res.redirect(`/account/orders/${orderId}`);
  }
};
