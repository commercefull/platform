import { Request, Response } from "express";
import { OrderRepo, OrderStatus } from "../repos/orderRepo";
import { storefrontRespond } from "../../../libs/templates";

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
    const orders = await orderRepo.findByUser(userId);
    
    // Respond with the storefront template
    storefrontRespond(req, res, "user/orders", {
      pageName: "My Orders",
      orders,
      successMsg: req.flash("success")[0],
      errorMsg: req.flash("error")[0],
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    req.flash("error", "Failed to load your orders");
    res.redirect("/account");
  }
};

/**
 * Get a single order by ID
 */
export const getOrderDetails = async (req: UserRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?._id || req.user?.id;
  
  try {
    const order = await orderRepo.findOne(id);
    
    if (!order) {
      req.flash("error", "Order not found");
      return res.redirect("/account/orders");
    }
    
    // For security, ensure users can only see their own orders (unless admin)
    if (order.userId !== userId && req.user?.role !== 'admin') {
      req.flash("error", "Unauthorized access");
      return res.redirect("/account/orders");
    }
    
    storefrontRespond(req, res, "user/order-details", {
      pageName: `Order #${id}`,
      order,
      successMsg: req.flash("success")[0],
      errorMsg: req.flash("error")[0],
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    req.flash("error", "Failed to load order details");
    res.redirect("/account/orders");
  }
};

/**
 * Create a new order
 */
export const createOrder = async (req: UserRequest, res: Response): Promise<void> => {
  const userId = req.user?._id || req.user?.id;
  
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  
  try {
    const orderData = req.body;
    orderData.userId = userId;
    orderData.status = 'pending';
    
    const newOrder = await orderRepo.create(orderData);
    
    // For API requests
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(201).json({ success: true, data: newOrder });
    } else {
      // For form submissions
      req.flash("success", "Order placed successfully!");
      res.redirect(`/account/orders/${newOrder.id}`);
    }
  } catch (error) {
    console.error('Error creating order:', error);
    
    // For API requests
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: 'Failed to create order' });
    } else {
      // For form submissions
      req.flash("error", "Failed to place your order. Please try again.");
      res.redirect("/checkout");
    }
  }
};

/**
 * Update order status - for admin use
 */
export const updateOrderStatus = async (req: UserRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!Object.values(['pending', 'processing', 'completed', 'cancelled', 'refunded']).includes(status)) {
    res.status(400).json({ success: false, message: 'Invalid order status' });
    return;
  }
  
  try {
    const updatedOrder = await orderRepo.updateStatus(id, status as OrderStatus);
    
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
  const { id } = req.params;
  const userId = req.user?._id || req.user?.id;
  
  try {
    // Check if the order exists and belongs to the user
    const order = await orderRepo.findOne(id);
    
    if (!order) {
      req.flash("error", "Order not found");
      return res.redirect("/account/orders");
    }
    
    if (order.userId !== userId) {
      req.flash("error", "Unauthorized access");
      return res.redirect("/account/orders");
    }
    
    // Only pending or processing orders can be cancelled
    if (order.status !== 'pending' && order.status !== 'processing') {
      req.flash("error", "This order cannot be cancelled");
      return res.redirect(`/account/orders/${id}`);
    }
    
    // Update order status to cancelled
    await orderRepo.updateStatus(id, 'cancelled');
    
    req.flash("success", "Order cancelled successfully");
    res.redirect(`/account/orders/${id}`);
  } catch (error) {
    console.error('Error cancelling order:', error);
    req.flash("error", "Failed to cancel order");
    res.redirect(`/account/orders/${id}`);
  }
};
