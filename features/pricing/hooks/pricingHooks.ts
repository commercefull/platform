/**
 * Pricing Hooks
 * 
 * This module provides hook functions to integrate pricing calculations
 * with basket and checkout processes.
 */
import { PricingService } from '../services/pricingService';
import { Basket } from '../../basket/repos/basketRepo';
import { Order } from '../../order/repos/orderRepo';

const pricingService = new PricingService();

/**
 * Apply pricing calculations to a basket
 * This transforms the basket items to match the format expected by pricing service
 * and updates the basket with calculated prices
 */
export async function calculateBasketPrices(
  basket: Basket, 
  options: {
    applyPromotions?: boolean;
    applyMembershipBenefits?: boolean;
    applyLoyaltyDiscount?: boolean;
    loyaltyPointsToApply?: number;
    pointsToMoneyRatio?: number;
    includeTax?: boolean;
  } = {}
): Promise<Basket> {
  // NOTE: This function needs refactoring - Basket interface doesn't have items property
  // TODO: Implement basket item fetching from basketItemRepo
  return basket;
  
  /* COMMENTED OUT UNTIL BASKET ITEMS INTERFACE IS FIXED
  if (!basket || !basket.items || basket.items.length === 0) {
    return basket; // No items to calculate prices for
  }

  // Default options
  const pricingOptions = {
    applyPromotions: true,
    applyMembershipBenefits: true,
    applyLoyaltyDiscount: false,
    loyaltyPointsToApply: 0,
    includeTax: false,
    ...options
  };
  
  let totalDiscount = 0;
  
  // Process each item in the basket through the pricing service
  for (let i = 0; i < basket.items.length; i++) {
    const item = basket.items[i];
    
    // Calculate item price using pricing service
    const result = await pricingService.calculatePrice(
      item.productId,
      {
        variantId: item.variantId,
        quantity: item.quantity,
        customerId: basket.customerId,
        // Pass all the additional pricing options
        additionalData: pricingOptions
      }
    );
    
    // Update the item with calculated price
    basket.items[i] = {
      ...item,
      price: result.finalPrice / item.quantity, // Store the per-unit price
    };
    
    // Track discounts applied
    if (result.appliedRules && result.appliedRules.length > 0) {
      totalDiscount += result.appliedRules.reduce((sum: number, rule: any) => sum + rule.impact, 0);
    }
  }
  
  // Recalculate basket totals
  basket.subTotal = basket.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  basket.discountAmount = totalDiscount;
  basket.grandTotal = Math.max(0, basket.subTotal - basket.discountAmount);
  basket.updatedAt = String(Math.floor(Date.now() / 1000));
  
  return basket;
  */
}

/**
 * Apply pricing calculations to an order
 * Used during checkout process to ensure final prices are calculated
 */

// Define a type that extends Order to include the items property we need
type OrderWithItems = Order & {
  items: Array<{
    id: string;
    productId: string;
    variantId?: string;
    quantity: number;
    name: string;
    price: number;
    unitPrice: number;
    totalPrice?: number;
    [key: string]: any;
  }>;
};

export async function calculateOrderPrices(
  order: Order,
  options: {
    applyPromotions?: boolean;
    applyMembershipBenefits?: boolean;
    applyLoyaltyDiscount?: boolean;
    loyaltyPointsToApply?: number;
    pointsToMoneyRatio?: number;
    includeTax?: boolean;
  } = {}
): Promise<Order> {
  // Cast order to OrderWithItems to handle the items property
  const orderWithItems = order as OrderWithItems;
  if (!orderWithItems || !orderWithItems.items || orderWithItems.items.length === 0) {
    return order; // No items to calculate prices for
  }

  // Default options
  const pricingOptions = {
    applyPromotions: true,
    applyMembershipBenefits: true,
    applyLoyaltyDiscount: options.applyLoyaltyDiscount || false,
    loyaltyPointsToApply: options.loyaltyPointsToApply || 0,
    includeTax: true, // For orders we typically include tax
    ...options
  };
  
  let totalDiscount = 0;
  let subtotal = 0;
  
  // Process each item in the order through the pricing service
  for (let i = 0; i < orderWithItems.items.length; i++) {
    const item = orderWithItems.items[i];
    
    // Calculate item price using pricing service
    const result = await pricingService.calculatePrice(
      item.productId,
      {
        variantId: item.variantId,
        quantity: item.quantity,
        customerId: order.customerId,
        // Pass all the additional pricing options
        additionalData: pricingOptions
      }
    );
    
    // Update the item with calculated price
    orderWithItems.items[i] = {
      ...item,
      unitPrice: result.originalPrice / item.quantity,
      price: result.finalPrice / item.quantity, // Per unit final price
      totalPrice: result.finalPrice,
    };
    
    // Track discount and subtotal
    if (result.appliedRules && result.appliedRules.length > 0) {
      totalDiscount += result.appliedRules.reduce((sum, rule) => sum + rule.impact, 0);
    }
    subtotal += result.originalPrice;
  }
  
  // Update order totals
  orderWithItems.subtotal = subtotal;
  orderWithItems.discountTotal = totalDiscount; // Fixed: using discountTotal instead of discountAmount
  orderWithItems.totalAmount = Math.max(0, orderWithItems.subtotal - orderWithItems.discountTotal); // Updated calculation to use discountTotal
  if (!orderWithItems.metadata) orderWithItems.metadata = {};
  orderWithItems.metadata.pricingCalculated = true;
  orderWithItems.updatedAt = new Date(); // Using proper Date object
  
  return orderWithItems;
}
