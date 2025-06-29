import { Request, Response } from "express";
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
 * Get order details - for admin use
 */
export const getOrderDetails = async (req: UserRequest, res: Response): Promise<void> => {
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
