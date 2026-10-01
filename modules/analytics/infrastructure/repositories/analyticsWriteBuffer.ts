/**
 * Analytics write buffer
 *
 * Event handlers emit high-volume, fire-and-forget analytics writes — one
 * INSERT/UPSERT per platform event. At peak traffic that is the largest
 * total DB consumer in pg_stat_statements despite each statement being ~1ms.
 *
 * This buffer coalesces them:
 *  - trackEvent rows are flushed as a single multi-row INSERT
 *  - upsertSalesDaily / upsertProductPerformance deltas are aggregated in
 *    memory by their conflict key, then upserted once per key per flush
 *
 * Analytics telemetry is inherently lossy — events buffered for at most
 * ANALYTICS_FLUSH_INTERVAL_MS may be dropped if the process crashes.
 * flushAnalyticsWrites() is invoked during graceful shutdown to minimize loss.
 */

import { query } from '../../../../libs/db';
import { logger } from '../../../../libs/logger';
import { upsertSalesDaily, upsertProductPerformance } from './analyticsRepo';

const FLUSH_INTERVAL_MS = Number(process.env.ANALYTICS_FLUSH_INTERVAL_MS || 2_000);
const BATCH_SIZE = Number(process.env.ANALYTICS_EVENT_BATCH_SIZE || 500);

type TrackEventInput = Parameters<typeof import('./reportingRepo').trackEvent>[0];

// ============================================================================
// Event insert buffer
// ============================================================================

let eventBuffer: TrackEventInput[] = [];

async function flushEvents(): Promise<void> {
  const batch = eventBuffer;
  eventBuffer = [];
  if (batch.length === 0) return;

  const cols = [
    '"eventType"',
    '"eventCategory"',
    '"eventAction"',
    '"organizationId"',
    '"customerId"',
    '"orderId"',
    '"productId"',
    '"basketId"',
    '"sessionId"',
    '"visitorId"',
    '"channel"',
    '"eventData"',
    '"eventValueCents"',
    '"eventQuantity"',
    '"currencyCode"',
    '"ipAddress"',
    '"userAgent"',
    '"referrer"',
    '"utmSource"',
    '"utmMedium"',
    '"utmCampaign"',
    '"deviceType"',
    '"country"',
    '"region"',
    '"isProcessed"',
    '"createdAt"',
  ];

  const params: unknown[] = [];
  const rows = batch.map(event => {
    params.push(
      event.eventType,
      event.eventCategory,
      event.eventAction,
      event.organizationId,
      event.customerId,
      event.orderId,
      event.productId,
      event.basketId,
      event.sessionId,
      event.visitorId,
      event.channel,
      event.eventData ? JSON.stringify(event.eventData) : null,
      event.eventValueCents,
      event.eventQuantity,
      event.currency,
      event.ipAddress,
      event.userAgent,
      event.referrer,
      event.utmSource,
      event.utmMedium,
      event.utmCampaign,
      event.deviceType,
      event.country,
      event.region,
    );
    const base = params.length - 24;
    return `(${cols
      .slice(0, 24)
      .map((_, i) => `$${base + i + 1}`)
      .join(', ')}, false, NOW())`;
  });

  await query(`INSERT INTO "analyticsReportEvent" (${cols.join(', ')}) VALUES ${rows.join(', ')}`, params);
}

// ============================================================================
// Aggregate upsert buffers — deltas summed by conflict key, one upsert per key
// ============================================================================

type SalesDailyDelta = Parameters<typeof upsertSalesDaily>[0];
type ProductPerformanceDelta = Parameters<typeof upsertProductPerformance>[0];

const SALES_DAILY_ADDITIVE = [
  'orderCount',
  'itemsSold',
  'grossRevenueCents',
  'discountTotalCents',
  'refundTotalCents',
  'netRevenueCents',
  'taxTotalCents',
  'shippingRevenueCents',
  'newCustomers',
  'returningCustomers',
  'guestOrders',
  'cartCreated',
  'cartAbandoned',
  'checkoutStarted',
  'checkoutCompleted',
  'paymentSuccessCount',
  'paymentFailedCount',
] as const;

const PERFORMANCE_ADDITIVE = [
  'views',
  'uniqueViews',
  'detailViews',
  'addToCarts',
  'removeFromCarts',
  'purchases',
  'quantitySold',
  'revenueCents',
  'returns',
  'returnQuantity',
  'reviews',
  'stockAlerts',
  'outOfStockViews',
] as const;

const salesDailyBuffer = new Map<string, SalesDailyDelta>();
const productPerformanceBuffer = new Map<string, ProductPerformanceDelta>();

function salesDailyKey(data: SalesDailyDelta): string {
  return `${data.organizationId || ''}|${data.date.toISOString()}|${data.channel || 'all'}|${data.currencyCode || 'USD'}`;
}

function productPerformanceKey(data: ProductPerformanceDelta): string {
  return `${data.productId}|${data.productVariantId || ''}|${data.date.toISOString()}|${data.channel || 'all'}`;
}

function accumulate(acc: Record<string, unknown>, delta: Record<string, unknown>, additive: readonly string[]): void {
  for (const field of additive) {
    const v = delta[field];
    if (typeof v === 'number' && v !== 0) {
      acc[field] = ((acc[field] as number) || 0) + v;
    }
  }
}

async function flushSalesDaily(): Promise<void> {
  const deltas = [...salesDailyBuffer.values()];
  salesDailyBuffer.clear();
  for (const delta of deltas) {
    await upsertSalesDaily(delta);
  }
}

async function flushProductPerformance(): Promise<void> {
  const deltas = [...productPerformanceBuffer.values()];
  productPerformanceBuffer.clear();
  for (const delta of deltas) {
    await upsertProductPerformance(delta);
  }
}

// ============================================================================
// Flush scheduling
// ============================================================================

let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushAnalyticsWrites().catch(err => logger.error('[ANALYTICS] Buffered write flush failed', { error: (err as Error).message }));
  }, FLUSH_INTERVAL_MS);
  flushTimer.unref();
}

export async function flushAnalyticsWrites(): Promise<void> {
  await Promise.all([flushEvents(), flushSalesDaily(), flushProductPerformance()]);
}

// ============================================================================
// Public API — drop-in replacements for reportingRepo.trackEvent and
// analyticsRepo.upsertSalesDaily / upsertProductPerformance in event handlers.
// ============================================================================

export async function trackEvent(event: TrackEventInput): Promise<void> {
  eventBuffer.push(event);
  if (eventBuffer.length >= BATCH_SIZE) {
    await flushEvents().catch(err => logger.error('[ANALYTICS] Event batch insert failed', { error: (err as Error).message }));
    return;
  }
  scheduleFlush();
}

export async function bufferSalesDaily(data: SalesDailyDelta): Promise<void> {
  const key = salesDailyKey(data);
  const acc = salesDailyBuffer.get(key);
  if (acc) {
    accumulate(acc as Record<string, unknown>, data as Record<string, unknown>, SALES_DAILY_ADDITIVE);
  } else {
    salesDailyBuffer.set(key, { ...data });
  }
  scheduleFlush();
}

export async function bufferProductPerformance(data: ProductPerformanceDelta): Promise<void> {
  const key = productPerformanceKey(data);
  const acc = productPerformanceBuffer.get(key);
  if (acc) {
    accumulate(acc as Record<string, unknown>, data as Record<string, unknown>, PERFORMANCE_ADDITIVE);
    // Non-additive metrics: last writer wins (mirrors insert-only column semantics)
    if (data.averageRating !== undefined) acc.averageRating = data.averageRating;
    if (data.averagePriceCents !== undefined) acc.averagePriceCents = data.averagePriceCents;
  } else {
    productPerformanceBuffer.set(key, { ...data });
  }
  scheduleFlush();
}

export const analyticsWriteBuffer = {
  trackEvent,
  upsertSalesDaily: bufferSalesDaily,
  upsertProductPerformance: bufferProductPerformance,
  flush: flushAnalyticsWrites,
};
