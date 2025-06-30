/**
 * Order Pricing Extension
 * 
 * Extends the order repository with pricing functionality
 */
import OrderRepo, { Order } from './repos/orderRepo';

// TypeScript type assertion to allow method access and extension
// This works around the issue of OrderRepo being exported as a singleton instance
// while maintaining type safety for our extension
import { calculateOrderPrices } from '../pricing/hooks/pricingHooks';

// Store original methods that need to be wrapped to apply pricing
// @ts-ignore: OrderRepo is a singleton instance with methods not defined in the type
const originalCreateOrder = OrderRepo.createOrder;
// @ts-ignore: OrderRepo is a singleton instance with methods not defined in the type
const originalGetOrderById = OrderRepo.getOrderById;
// @ts-ignore: OrderRepo is a singleton instance with methods not defined in the type
const originalUpdateOrderItems = OrderRepo.updateOrderItems;

// Wrap the createOrder method to apply pricing when creating an order
// @ts-ignore: OrderRepo is a singleton instance with methods not defined in the type
OrderRepo.createOrder = async function(...args) {
  // First, call original method
  const order = await originalCreateOrder.apply(this, args);
  
  // Apply pricing calculations
  if (order) {
    const options = {
      applyPromotions: true,
      applyMembershipBenefits: true,
      applyLoyaltyDiscount: args[0]?.applyLoyaltyDiscount || false,
      loyaltyPointsToApply: args[0]?.loyaltyPointsToApply || 0,
      includeTax: true
    };
    
    const updatedOrder = await calculateOrderPrices(order, options);
    
    // Update order with calculated prices
    // @ts-ignore: updateOrderTotals exists at runtime but isn't in the type definition
    await this.updateOrderTotals(updatedOrder.id, {
      subtotal: updatedOrder.subtotal,
      discountTotal: updatedOrder.discountTotal,
      totalAmount: updatedOrder.totalAmount
    });
    
    // Return updated order
    return updatedOrder;
  }
  
  return order;
};

// Wrap the getOrderById method to apply pricing when retrieving an order
// @ts-ignore: OrderRepo is a singleton instance with methods not defined in the type
OrderRepo.getOrderById = async function(orderId: string): Promise<Order | null> {
  // First, call original method
  const order = await originalGetOrderById.call(this, orderId);
  
  // Check if pricing has already been calculated (avoid recalculation)
  if (order && (!order.metadata || !order.metadata.pricingCalculated)) {
    const updatedOrder = await calculateOrderPrices(order);
    return updatedOrder;
  }
  
  return order;
};

// Wrap the updateOrderItems method to apply pricing after updating items
// @ts-ignore: OrderRepo is a singleton instance with methods not defined in the type
OrderRepo.updateOrderItems = async function(orderId: string, items: any[]): Promise<Order | null> {
  // First, call original method
  const order = await originalUpdateOrderItems.call(this, orderId, items);
  
  // Apply pricing calculations
  if (order) {
    const updatedOrder = await calculateOrderPrices(order);
    
    // Update order with calculated prices
    // @ts-ignore: updateOrderTotals exists at runtime but isn't in the type definition
    await this.updateOrderTotals(updatedOrder.id, {
      subtotal: updatedOrder.subtotal,
      discountTotal: updatedOrder.discountTotal,
      totalAmount: updatedOrder.totalAmount
    });
    
    return updatedOrder;
  }
  
  return order;
};

export default OrderRepo;
