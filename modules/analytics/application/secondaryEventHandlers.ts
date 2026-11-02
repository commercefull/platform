/**
 * Analytics Event Handlers — product, customer, subscription, support,
 * review, and alert events.
 *
 * Split from analyticsEventHandler.ts; handlers are registered there.
 */

import { analyticsWriteBuffer } from '../infrastructure';

// Analytics writes go through the write buffer: trackEvent rows are flushed
// as multi-row INSERTs and sales/performance deltas are aggregated by
// conflict key — one upsert per key per flush window instead of per event.
const reportingRepo = analyticsWriteBuffer;
const analyticsRepo = analyticsWriteBuffer;

interface EventPayload {
  data: Record<string, unknown>;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// ============================================================================
// Product Event Handlers
// ============================================================================

export async function handleProductViewed(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;

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
      date: startOfToday(),
      views: 1,
      uniqueViews: data.isFirstView ? 1 : 0,
      detailViews: 1,
      outOfStockViews: data.isOutOfStock ? 1 : 0,
    });
  } catch {}
}

export async function handleProductCreated(payload: unknown): Promise<void> {
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

export async function handleCustomerCreated(payload: unknown): Promise<void> {
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

export async function handleCustomerUpdated(payload: unknown): Promise<void> {
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

export async function handleSubscriptionCreated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;
    await reportingRepo.trackEvent({
      eventType: 'subscription.created',
      eventCategory: 'subscription',
      eventAction: 'created',
      customerId: data.customerId as string | undefined,
      eventValueCents: data.monthlyValueCents as number | undefined,
      eventData: { planId: data.planId },
    });
  } catch {}
}

export async function handleSubscriptionCancelled(payload: unknown): Promise<void> {
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

export async function handleTicketCreated(payload: unknown): Promise<void> {
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

export async function handleTicketResolved(payload: unknown): Promise<void> {
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

export async function handleReviewCreated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;

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
      date: startOfToday(),
      reviews: 1,
      averageRating: data.rating as number,
    });
  } catch {}
}

// ============================================================================
// Alert Event Handlers
// ============================================================================

export async function handleStockAlertCreated(payload: unknown): Promise<void> {
  try {
    const { data } = payload as EventPayload;

    await reportingRepo.trackEvent({
      eventType: 'alert.stock.created',
      eventCategory: 'alert',
      eventAction: 'stock_alert_created',
      productId: data.productId as string | undefined,
      customerId: data.customerId as string | undefined,
    });

    await analyticsRepo.upsertProductPerformance({
      productId: data.productId as string,
      date: startOfToday(),
      stockAlerts: 1,
    });
  } catch {}
}
