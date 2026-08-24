/**
 * Analytics Event Handler
 * Listens to platform events and tracks them for analytics
 */

import { eventBus } from '../libs/events/eventBus';
import { AnalyticsDataRepository } from '../modules/analytics/infrastructure';

const reportingRepo = AnalyticsDataRepository.reporting;
const analyticsRepo = AnalyticsDataRepository.analytics;

// ============================================================================
// Event Payload Interfaces
// ============================================================================

interface EventPayload {
  data: Record<string, unknown>;
}

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

async function handleOrderCreated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Track event
    await reportingRepo.trackEvent({
      eventType: 'order.created',
      eventCategory: 'order',
      eventAction: 'created',
      organizationId: data.organizationId as string | undefined,
      customerId: data.customerId as string | undefined,
      orderId: data.orderId as string | undefined,
      eventValue: (data.grandTotal || data.total) as number | undefined,
      eventQuantity: data.itemCount as number | undefined,
      currency: data.currency as string | undefined,
      channel: (data.channel as string) || 'web',
      eventData: {
        orderNumber: data.orderNumber,
        paymentMethod: data.paymentMethod,
        shippingMethod: data.shippingMethod,
      },
    });

    // Update daily sales
    const isNewCustomer = (data.isFirstOrder as boolean) || false;
    const isGuest = !data.customerId;

    await analyticsRepo.upsertSalesDaily({
      date: today,
      organizationId: data.organizationId as string | undefined,
      channel: (data.channel as string) || 'all',
      currency: (data.currency as string) || 'USD',
      orderCount: 1,
      itemsSold: (data.itemCount as number) || 0,
      grossRevenue: ((data.grandTotal || data.total) as number) || 0,
      discountTotal: (data.discountTotal as number) || 0,
      taxTotal: (data.taxTotal as number) || 0,
      shippingRevenue: (data.shippingTotal as number) || 0,
      netRevenue: (((data.grandTotal || data.total) as number) || 0) - ((data.taxTotal as number) || 0),
      newCustomers: isNewCustomer ? 1 : 0,
      returningCustomers: !isNewCustomer && !isGuest ? 1 : 0,
      guestOrders: isGuest ? 1 : 0,
      checkoutCompleted: 1,
    });

    // Update product performance for each item
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items as Array<Record<string, unknown>>) {
        await analyticsRepo.upsertProductPerformance({
          productId: item.productId as string,
          productVariantId: item.productVariantId as string | undefined,
          date: today,
          channel: (data.channel as string) || 'all',
          purchases: 1,
          quantitySold: (item.quantity as number) || 1,
          revenue: (item.total as number) || (item.price as number) * ((item.quantity as number) || 1),
          averagePrice: item.price as number,
        });
      }
    }
  } catch {}
}

async function handleOrderCompleted(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    await reportingRepo.trackEvent({
      eventType: 'order.completed',
      eventCategory: 'order',
      eventAction: 'completed',
      orderId: data.orderId as string | undefined,
      customerId: data.customerId as string | undefined,
      eventValue: data.grandTotal as number | undefined,
    });
  } catch {}
}

async function handleOrderCancelled(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    await reportingRepo.trackEvent({
      eventType: 'order.cancelled',
      eventCategory: 'order',
      eventAction: 'cancelled',
      orderId: data.orderId as string | undefined,
      customerId: data.customerId as string | undefined,
      eventValue: data.grandTotal as number | undefined,
      eventData: { reason: data.reason },
    });
  } catch {}
}

async function handleOrderRefunded(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'order.refunded',
      eventCategory: 'order',
      eventAction: 'refunded',
      orderId: data.orderId as string | undefined,
      customerId: data.customerId as string | undefined,
      eventValue: data.refundAmount as number | undefined,
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      organizationId: data.organizationId as string | undefined,
      refundTotal: (data.refundAmount as number) || 0,
    });
  } catch {}
}

// ============================================================================
// Cart Event Handlers
// ============================================================================

async function handleCartCreated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'cart.created',
      eventCategory: 'cart',
      eventAction: 'created',
      basketId: data.basketId as string | undefined,
      customerId: data.customerId as string | undefined,
      sessionId: data.sessionId as string | undefined,
      visitorId: data.visitorId as string | undefined,
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      organizationId: data.organizationId as string | undefined,
      cartCreated: 1,
    });
  } catch {}
}

async function handleCartItemAdded(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'cart.item.added',
      eventCategory: 'cart',
      eventAction: 'item_added',
      basketId: data.basketId as string | undefined,
      productId: data.productId as string | undefined,
      customerId: data.customerId as string | undefined,
      eventQuantity: data.quantity as number | undefined,
      eventValue: data.price as number | undefined,
    });

    await analyticsRepo.upsertProductPerformance({
      productId: data.productId as string,
      productVariantId: data.productVariantId as string | undefined,
      date: today,
      addToCarts: 1,
    });
  } catch {}
}

async function handleCartItemRemoved(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'cart.item.removed',
      eventCategory: 'cart',
      eventAction: 'item_removed',
      basketId: data.basketId as string | undefined,
      productId: data.productId as string | undefined,
      customerId: data.customerId as string | undefined,
      eventQuantity: data.quantity as number | undefined,
    });

    await analyticsRepo.upsertProductPerformance({
      productId: data.productId as string,
      productVariantId: data.productVariantId as string | undefined,
      date: today,
      removeFromCarts: 1,
    });
  } catch {}
}

async function handleCartAbandoned(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'cart.abandoned',
      eventCategory: 'cart',
      eventAction: 'abandoned',
      basketId: data.basketId as string | undefined,
      customerId: data.customerId as string | undefined,
      eventValue: data.cartValue as number | undefined,
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      organizationId: data.organizationId as string | undefined,
      cartAbandoned: 1,
    });
  } catch {}
}

// ============================================================================
// Checkout Event Handlers
// ============================================================================

async function handleCheckoutStarted(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'checkout.started',
      eventCategory: 'checkout',
      eventAction: 'started',
      basketId: data.basketId as string | undefined,
      customerId: data.customerId as string | undefined,
      eventValue: data.cartValue as number | undefined,
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      organizationId: data.organizationId as string | undefined,
      checkoutStarted: 1,
    });
  } catch {}
}

async function handleCheckoutCompleted(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    await reportingRepo.trackEvent({
      eventType: 'checkout.completed',
      eventCategory: 'checkout',
      eventAction: 'completed',
      orderId: data.orderId as string | undefined,
      customerId: data.customerId as string | undefined,
      eventValue: data.orderTotal as number | undefined,
    });
  } catch {}
}

// ============================================================================
// Payment Event Handlers
// ============================================================================

async function handlePaymentSuccess(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'payment.success',
      eventCategory: 'payment',
      eventAction: 'success',
      orderId: data.orderId as string | undefined,
      customerId: data.customerId as string | undefined,
      eventValue: data.amount as number | undefined,
      eventData: { paymentMethod: data.paymentMethod },
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      organizationId: data.organizationId as string | undefined,
      paymentSuccessCount: 1,
    });
  } catch {}
}

async function handlePaymentFailed(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'payment.failed',
      eventCategory: 'payment',
      eventAction: 'failed',
      orderId: data.orderId as string | undefined,
      customerId: data.customerId as string | undefined,
      eventValue: data.amount as number | undefined,
      eventData: { reason: data.failureReason },
    });

    await analyticsRepo.upsertSalesDaily({
      date: today,
      organizationId: data.organizationId as string | undefined,
      paymentFailedCount: 1,
    });
  } catch {}
}

// ============================================================================
// Product Event Handlers
// ============================================================================

async function handleProductViewed(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'product.viewed',
      eventCategory: 'product',
      eventAction: 'viewed',
      productId: data.productId as string | undefined,
      customerId: data.customerId as string | undefined,
      sessionId: data.sessionId as string | undefined,
      visitorId: data.visitorId as string | undefined,
    });

    await analyticsRepo.upsertProductPerformance({
      productId: data.productId as string,
      productVariantId: data.productVariantId as string | undefined,
      date: today,
      views: 1,
      uniqueViews: data.isFirstView ? 1 : 0,
      detailViews: 1,
      outOfStockViews: data.isOutOfStock ? 1 : 0,
    });
  } catch {}
}

async function handleProductCreated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    await reportingRepo.trackEvent({
      eventType: 'product.created',
      eventCategory: 'product',
      eventAction: 'created',
      productId: data.productId as string | undefined,
      eventData: { name: data.name, sku: data.sku },
    });
  } catch {}
}

// ============================================================================
// Customer Event Handlers
// ============================================================================

async function handleCustomerCreated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    await reportingRepo.trackEvent({
      eventType: 'customer.created',
      eventCategory: 'customer',
      eventAction: 'created',
      customerId: data.customerId as string | undefined,
      channel: data.channel as string | undefined,
      eventData: { source: data.source },
    });
  } catch {}
}

async function handleCustomerUpdated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    await reportingRepo.trackEvent({
      eventType: 'customer.updated',
      eventCategory: 'customer',
      eventAction: 'updated',
      customerId: data.customerId as string | undefined,
    });
  } catch {}
}

// ============================================================================
// Subscription Event Handlers
// ============================================================================

async function handleSubscriptionCreated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    await reportingRepo.trackEvent({
      eventType: 'subscription.created',
      eventCategory: 'subscription',
      eventAction: 'created',
      customerId: data.customerId as string | undefined,
      eventValue: data.monthlyValue as number | undefined,
      eventData: { planId: data.planId },
    });
  } catch {}
}

async function handleSubscriptionCancelled(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    await reportingRepo.trackEvent({
      eventType: 'subscription.cancelled',
      eventCategory: 'subscription',
      eventAction: 'cancelled',
      customerId: data.customerId as string | undefined,
      eventData: { reason: data.reason },
    });
  } catch {}
}

// ============================================================================
// Support Event Handlers
// ============================================================================

async function handleTicketCreated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    await reportingRepo.trackEvent({
      eventType: 'ticket.created',
      eventCategory: 'support',
      eventAction: 'created',
      customerId: data.customerId as string | undefined,
      orderId: data.orderId as string | undefined,
      eventData: { category: data.category, priority: data.priority },
    });
  } catch {}
}

async function handleTicketResolved(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    await reportingRepo.trackEvent({
      eventType: 'ticket.resolved',
      eventCategory: 'support',
      eventAction: 'resolved',
      customerId: data.customerId as string | undefined,
      eventData: { resolutionTime: data.resolutionTimeMinutes },
    });
  } catch {}
}

// ============================================================================
// Review Event Handlers
// ============================================================================

async function handleReviewCreated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'review.created',
      eventCategory: 'review',
      eventAction: 'created',
      productId: data.productId as string | undefined,
      customerId: data.customerId as string | undefined,
      eventData: { rating: data.rating },
    });

    await analyticsRepo.upsertProductPerformance({
      productId: data.productId as string,
      date: today,
      reviews: 1,
      averageRating: data.rating as number,
    });
  } catch {}
}

// ============================================================================
// Alert Event Handlers
// ============================================================================

async function handleStockAlertCreated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await reportingRepo.trackEvent({
      eventType: 'alert.stock.created',
      eventCategory: 'alert',
      eventAction: 'stock_alert_created',
      productId: data.productId as string | undefined,
      customerId: data.customerId as string | undefined,
    });

    await analyticsRepo.upsertProductPerformance({
      productId: data.productId as string,
      date: today,
      stockAlerts: 1,
    });
  } catch {}
}
