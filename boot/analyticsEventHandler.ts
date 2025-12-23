/**
 * Analytics Event Handler
 * Listens to platform events and tracks them for analytics
 */

import { eventBus, EventType } from '../libs/events/eventBus';
import * as reportingRepo from '../modules/analytics/repos/reportingRepo';
import * as analyticsRepo from '../modules/analytics/repos/analyticsRepo';

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Initialize all analytics event handlers
 */
export function initializeAnalyticsHandlers(): void {
  // Order events
  eventBus.registerHandler('order.created', handleOrderCreated);
  eventBus.registerHandler('order.completed', handleOrderCompleted);
  eventBus.registerHandler('order.cancelled', handleOrderCancelled);
  eventBus.registerHandler('order.refunded', handleOrderRefunded);

  // Cart/Basket events
  eventBus.registerHandler('basket.created', handleCartCreated);
  eventBus.registerHandler('basket.item_added', handleCartItemAdded);
  eventBus.registerHandler('basket.item_removed', handleCartItemRemoved);
  eventBus.registerHandler('basket.abandoned', handleCartAbandoned);

  // Checkout events
  eventBus.registerHandler('checkout.started', handleCheckoutStarted);
  eventBus.registerHandler('checkout.completed', handleCheckoutCompleted);

  // Payment events
  eventBus.registerHandler('payment.success', handlePaymentSuccess);
  eventBus.registerHandler('payment.failed', handlePaymentFailed);

  // Product events
  eventBus.registerHandler('product.viewed', handleProductViewed);
  eventBus.registerHandler('product.created', handleProductCreated);

  // Customer events
  eventBus.registerHandler('customer.created', handleCustomerCreated);
  eventBus.registerHandler('customer.updated', handleCustomerUpdated);

  // Subscription events
  eventBus.registerHandler('subscription.created', handleSubscriptionCreated);
  eventBus.registerHandler('subscription.cancelled', handleSubscriptionCancelled);

  // Support events
  eventBus.registerHandler('ticket.created', handleTicketCreated);
  eventBus.registerHandler('ticket.resolved', handleTicketResolved);

  // Review events
  eventBus.registerHandler('review.created', handleReviewCreated);

  // Alert events
  eventBus.registerHandler('alert.stock.created', handleStockAlertCreated);

  
}

// ============================================================================
// Order Event Handlers
// ============================================================================

async function handleOrderCreated(payload: any): Promise<void> {
  try {
    const { data } = payload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Track event
    await reportingRepo.trackEvent({
      eventType: 'order.created',
      eventCategory: 'order',
      eventAction: 'created',
      merchantId: data.merchantId,
      customerId: data.customerId,
      orderId: data.orderId,
      eventValue: data.grandTotal || data.total,
      eventQuantity: data.itemCount,
      currency: data.currency,
      channel: data.channel || 'web',
      eventData: {
        orderNumber: data.orderNumber,
        paymentMethod: data.paymentMethod,
        shippingMethod: data.shippingMethod
      }
    });

    // Update daily sales
    const isNewCustomer = data.isFirstOrder || false;
    const isGuest = !data.customerId;

    await analyticsRepo.upsertSalesDaily({
      date: today,
      merchantId: data.merchantId,
      channel: data.channel || 'all',
      currency: data.currency || 'USD',
      orderCount: 1,
      itemsSold: data.itemCount || 0,
      grossRevenue: data.grandTotal || data.total || 0,
      discountTotal: data.discountTotal || 0,
      taxTotal: data.taxTotal || 0,
      shippingRevenue: data.shippingTotal || 0,
      netRevenue: (data.grandTotal || data.total || 0) - (data.taxTotal || 0),
      newCustomers: isNewCustomer ? 1 : 0,
      returningCustomers: !isNewCustomer && !isGuest ? 1 : 0,
      guestOrders: isGuest ? 1 : 0,
      checkoutCompleted: 1
    });

    // Update product performance for each item
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        await analyticsRepo.upsertProductPerformance({
          productId: item.productId,
          productVariantId: item.productVariantId,
          date: today,
          channel: data.channel || 'all',
          purchases: 1,
          quantitySold: item.quantity || 1,
          revenue: item.total || item.price * (item.quantity || 1),
          averagePrice: item.price
        });
      }
    }
  } catch (error) {
    
  }
}

async function handleOrderCompleted(payload: any): Promise<void> {
  try {
    await reportingRepo.trackEvent({
      eventType: 'order.completed',
      eventCategory: 'order',
      eventAction: 'completed',
      orderId: payload.data.orderId,
      customerId: payload.data.customerId,
      eventValue: payload.data.grandTotal
    });
  } catch (error) {
    
  }
}

async function handleOrderCancelled(payload: any): Promise<void> {
  try {
    await reportingRepo.trackEvent({
      eventType: 'order.cancelled',
      eventCategory: 'order',
      eventAction: 'cancelled',
      orderId: payload.data.orderId,
      customerId: payload.data.customerId,
      eventValue: payload.data.grandTotal,
      eventData: { reason: payload.data.reason }
    });
  } catch (error) {
    
  }
}

async function handleOrderRefunded(payload: any): Promise<void> {
  try {
    const { data } = payload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'order.refunded',
      eventCategory: 'order',
      eventAction: 'refunded',
      orderId: data.orderId,
      customerId: data.customerId,
      eventValue: data.refundAmount
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      merchantId: data.merchantId,
      refundTotal: data.refundAmount || 0
    });
  } catch (error) {
    
  }
}

// ============================================================================
// Cart Event Handlers
// ============================================================================

async function handleCartCreated(payload: any): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'cart.created',
      eventCategory: 'cart',
      eventAction: 'created',
      basketId: payload.data.basketId,
      customerId: payload.data.customerId,
      sessionId: payload.data.sessionId,
      visitorId: payload.data.visitorId
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      merchantId: payload.data.merchantId,
      cartCreated: 1
    });
  } catch (error) {
    
  }
}

async function handleCartItemAdded(payload: any): Promise<void> {
  try {
    const { data } = payload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'cart.item.added',
      eventCategory: 'cart',
      eventAction: 'item_added',
      basketId: data.basketId,
      productId: data.productId,
      customerId: data.customerId,
      eventQuantity: data.quantity,
      eventValue: data.price
    });

    await analyticsRepo.upsertProductPerformance({
      productId: data.productId,
      productVariantId: data.productVariantId,
      date: today,
      addToCarts: 1
    });
  } catch (error) {
    
  }
}

async function handleCartItemRemoved(payload: any): Promise<void> {
  try {
    const { data } = payload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'cart.item.removed',
      eventCategory: 'cart',
      eventAction: 'item_removed',
      basketId: data.basketId,
      productId: data.productId,
      customerId: data.customerId,
      eventQuantity: data.quantity
    });

    await analyticsRepo.upsertProductPerformance({
      productId: data.productId,
      productVariantId: data.productVariantId,
      date: today,
      removeFromCarts: 1
    });
  } catch (error) {
    
  }
}

async function handleCartAbandoned(payload: any): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'cart.abandoned',
      eventCategory: 'cart',
      eventAction: 'abandoned',
      basketId: payload.data.basketId,
      customerId: payload.data.customerId,
      eventValue: payload.data.cartValue
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      merchantId: payload.data.merchantId,
      cartAbandoned: 1
    });
  } catch (error) {
    
  }
}

// ============================================================================
// Checkout Event Handlers
// ============================================================================

async function handleCheckoutStarted(payload: any): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'checkout.started',
      eventCategory: 'checkout',
      eventAction: 'started',
      basketId: payload.data.basketId,
      customerId: payload.data.customerId,
      eventValue: payload.data.cartValue
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      merchantId: payload.data.merchantId,
      checkoutStarted: 1
    });
  } catch (error) {
    
  }
}

async function handleCheckoutCompleted(payload: any): Promise<void> {
  try {
    await reportingRepo.trackEvent({
      eventType: 'checkout.completed',
      eventCategory: 'checkout',
      eventAction: 'completed',
      orderId: payload.data.orderId,
      customerId: payload.data.customerId,
      eventValue: payload.data.orderTotal
    });
  } catch (error) {
    
  }
}

// ============================================================================
// Payment Event Handlers
// ============================================================================

async function handlePaymentSuccess(payload: any): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'payment.success',
      eventCategory: 'payment',
      eventAction: 'success',
      orderId: payload.data.orderId,
      customerId: payload.data.customerId,
      eventValue: payload.data.amount,
      eventData: { paymentMethod: payload.data.paymentMethod }
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      merchantId: payload.data.merchantId,
      paymentSuccessCount: 1
    });
  } catch (error) {
    
  }
}

async function handlePaymentFailed(payload: any): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'payment.failed',
      eventCategory: 'payment',
      eventAction: 'failed',
      orderId: payload.data.orderId,
      customerId: payload.data.customerId,
      eventValue: payload.data.amount,
      eventData: { reason: payload.data.failureReason }
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      merchantId: payload.data.merchantId,
      paymentFailedCount: 1
    });
  } catch (error) {
    
  }
}

// ============================================================================
// Product Event Handlers
// ============================================================================

async function handleProductViewed(payload: any): Promise<void> {
  try {
    const { data } = payload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'product.viewed',
      eventCategory: 'product',
      eventAction: 'viewed',
      productId: data.productId,
      customerId: data.customerId,
      sessionId: data.sessionId,
      visitorId: data.visitorId
    });

    await analyticsRepo.upsertProductPerformance({
      productId: data.productId,
      productVariantId: data.productVariantId,
      date: today,
      views: 1,
      uniqueViews: data.isFirstView ? 1 : 0,
      detailViews: 1,
      outOfStockViews: data.isOutOfStock ? 1 : 0
    });
  } catch (error) {
    
  }
}

async function handleProductCreated(payload: any): Promise<void> {
  try {
    await reportingRepo.trackEvent({
      eventType: 'product.created',
      eventCategory: 'product',
      eventAction: 'created',
      productId: payload.data.productId,
      eventData: { name: payload.data.name, sku: payload.data.sku }
    });
  } catch (error) {
    
  }
}

// ============================================================================
// Customer Event Handlers
// ============================================================================

async function handleCustomerCreated(payload: any): Promise<void> {
  try {
    await reportingRepo.trackEvent({
      eventType: 'customer.created',
      eventCategory: 'customer',
      eventAction: 'created',
      customerId: payload.data.customerId,
      channel: payload.data.channel,
      eventData: { source: payload.data.source }
    });
  } catch (error) {
    
  }
}

async function handleCustomerUpdated(payload: any): Promise<void> {
  try {
    await reportingRepo.trackEvent({
      eventType: 'customer.updated',
      eventCategory: 'customer',
      eventAction: 'updated',
      customerId: payload.data.customerId
    });
  } catch (error) {
    
  }
}

// ============================================================================
// Subscription Event Handlers
// ============================================================================

async function handleSubscriptionCreated(payload: any): Promise<void> {
  try {
    await reportingRepo.trackEvent({
      eventType: 'subscription.created',
      eventCategory: 'subscription',
      eventAction: 'created',
      customerId: payload.data.customerId,
      eventValue: payload.data.monthlyValue,
      eventData: { planId: payload.data.planId }
    });
  } catch (error) {
    
  }
}

async function handleSubscriptionCancelled(payload: any): Promise<void> {
  try {
    await reportingRepo.trackEvent({
      eventType: 'subscription.cancelled',
      eventCategory: 'subscription',
      eventAction: 'cancelled',
      customerId: payload.data.customerId,
      eventData: { reason: payload.data.reason }
    });
  } catch (error) {
    
  }
}

// ============================================================================
// Support Event Handlers
// ============================================================================

async function handleTicketCreated(payload: any): Promise<void> {
  try {
    await reportingRepo.trackEvent({
      eventType: 'ticket.created',
      eventCategory: 'support',
      eventAction: 'created',
      customerId: payload.data.customerId,
      orderId: payload.data.orderId,
      eventData: { category: payload.data.category, priority: payload.data.priority }
    });
  } catch (error) {
    
  }
}

async function handleTicketResolved(payload: any): Promise<void> {
  try {
    await reportingRepo.trackEvent({
      eventType: 'ticket.resolved',
      eventCategory: 'support',
      eventAction: 'resolved',
      customerId: payload.data.customerId,
      eventData: { resolutionTime: payload.data.resolutionTimeMinutes }
    });
  } catch (error) {
    
  }
}

// ============================================================================
// Review Event Handlers
// ============================================================================

async function handleReviewCreated(payload: any): Promise<void> {
  try {
    const { data } = payload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'review.created',
      eventCategory: 'review',
      eventAction: 'created',
      productId: data.productId,
      customerId: data.customerId,
      eventData: { rating: data.rating }
    });

    await analyticsRepo.upsertProductPerformance({
      productId: data.productId,
      date: today,
      reviews: 1,
      averageRating: data.rating
    });
  } catch (error) {
    
  }
}

// ============================================================================
// Alert Event Handlers
// ============================================================================

async function handleStockAlertCreated(payload: any): Promise<void> {
  try {
    const { data } = payload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'alert.stock.created',
      eventCategory: 'alert',
      eventAction: 'stock_alert_created',
      productId: data.productId,
      customerId: data.customerId
    });

    await analyticsRepo.upsertProductPerformance({
      productId: data.productId,
      date: today,
      stockAlerts: 1
    });
  } catch (error) {
    
  }
}
