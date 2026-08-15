/**
 * Pricing Hooks
 *
 * This module provides hook functions to integrate pricing calculations
 * with basket and checkout processes.
 */
import { PricingService } from '../services/pricingService';
import { Basket } from '../../basket/domain/entities/Basket';
import { Order } from '../../order/infrastructure/repositories/orderRepo';

const pricingService = new PricingService();

/**
 * Apply pricing calculations to a basket
 * This transforms the basket items to match the format expected by pricing service
 * and updates the basket with calculated prices
 */
export async function calculateBasketPrices(
  basket: Basket,
  _options: {
    applyPromotions?: boolean;
    applyMembershipBenefits?: boolean;
    applyLoyaltyDiscount?: boolean;
    loyaltyPointsToApply?: number;
    pointsToMoneyRatio?: number;
    includeTax?: boolean;
  } = {},
): Promise<Basket> {
  // Basket items are loaded by BasketRepository.findById() which calls getItemsWithCurrency()
  // If basket has no items, return early — nothing to calculate
  if (!basket.items || basket.items.length === 0) {
    return basket;
  }

  // Default options
  const pricingOptions = {
    applyPromotions: true,
    applyMembershipBenefits: true,
    applyLoyaltyDiscount: false,
    loyaltyPointsToApply: 0,
    includeTax: false,
    ..._options
  };
  
  let _totalDiscount = 0;
  
  // Process each item in the basket through the pricing service
  for (let i = 0; i < basket.items.length; i++) {
    const item = basket.items[i];
    
    // Calculate item price using pricing service
    const result = await pricingService.calculatePrice(
      item.productId,
      {
        variantId: item.productVariantId,
        quantity: item.quantity,
        customerId: basket.customerId,
        additionalData: pricingOptions
      }
    );
    
    // Track discounts applied
    if (result.appliedRules && result.appliedRules.length > 0) {
      _totalDiscount += result.appliedRules.reduce((sum: number, rule: unknown) => sum + (rule as { impact: number }).impact, 0);
    }
  }
  
  return basket;
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
    [key: string]: unknown;
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
  } = {},
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
    ...options,
  };

  let totalDiscount = 0;
  let subtotal = 0;

  // Process each item in the order through the pricing service
  for (let i = 0; i < orderWithItems.items.length; i++) {
    const item = orderWithItems.items[i];

    // Calculate item price using pricing service
    const result = await pricingService.calculatePrice(item.productId, {
      variantId: item.variantId || undefined,
      quantity: item.quantity,
      customerId: order.customerId || undefined,
      // Pass all the additional pricing options
      additionalData: pricingOptions,
    });

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

  // Update order totals (convert to string for decimal fields)
  orderWithItems.subtotal = String(subtotal);
  orderWithItems.discountTotal = String(totalDiscount);
  orderWithItems.totalAmount = String(Math.max(0, subtotal - totalDiscount));
  if (!orderWithItems.metadata) orderWithItems.metadata = {};
  orderWithItems.metadata.pricingCalculated = true;
  orderWithItems.updatedAt = new Date(); // Using proper Date object

  return orderWithItems;
}
