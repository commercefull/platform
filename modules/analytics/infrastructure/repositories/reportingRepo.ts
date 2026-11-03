/**
 * Reporting Repository
 *
 * Handles event tracking and snapshots for real-time reporting including:
 * - Event tracking for all platform activities
 * - Periodic snapshots for trend analysis
 * - Custom dashboard management
 * - Real-time metrics aggregation
 */

import { query, queryOne } from '../../../../libs/db';
import {
  AnalyticsReportEvent as AnalyticsReportEventRow,
  AnalyticsReportSnapshot as AnalyticsReportSnapshotRow,
} from '../../../../libs/db/types';
import type { AnalyticsReportEvent, AnalyticsReportSnapshot } from '../../domain/types';
import type {
  AnalyticsReportEvent as DbAnalyticsReportEvent,
  AnalyticsReportSnapshot as DbAnalyticsReportSnapshot,
} from '../../../../libs/db/types';
export type { AnalyticsReportEvent, AnalyticsReportSnapshot };

// ============================================================================
// Table Names
// ============================================================================

/* const _TABLE = {
  REPORT_EVENT: 'analyticsReportEvent',
  REPORT_SNAPSHOT: 'analyticsReportSnapshot',
  REPORT_DASHBOARD: 'analyticsReportDashboard',
} as const; */

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Event Tracking
// ============================================================================

export async function trackEvent(event: {
  eventType: string;
  eventCategory: string;
  eventAction: string;
  organizationId?: string;
  customerId?: string;
  orderId?: string;
  productId?: string;
  basketId?: string;
  sessionId?: string;
  visitorId?: string;
  channel?: string;
  salesChannelId?: string;
  eventData?: Record<string, unknown>;
  eventValueCents?: number;
  eventQuantity?: number;
  currency?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: string;
  country?: string;
  region?: string;
}): Promise<AnalyticsReportEvent> {
  const result = await queryOne<DbAnalyticsReportEvent>(
    `INSERT INTO "analyticsReportEvent" (
      "eventType", "eventCategory", "eventAction",
      "organizationId", "customerId", "orderId", "productId", "basketId",
      "sessionId", "visitorId", "channel", "salesChannelId",
      "eventData", "eventValueCents", "eventQuantity", "currencyCode",
      "ipAddress", "userAgent", "referrer",
      "utmSource", "utmMedium", "utmCampaign",
      "deviceType", "country", "region",
      "isProcessed", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, false, NOW())
    RETURNING *`,
    [
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
      event.salesChannelId ?? event.channel,
      event.salesChannelId ?? null,
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
    ],
  );

  return mapToAnalyticsReportEvent(result!);
}

export async function getEvents(
  filters: {
    eventType?: string;
    eventCategory?: string;
    customerId?: string;
    orderId?: string;
    productId?: string;
    salesChannelId?: string;
    startDate?: Date;
    endDate?: Date;
    isProcessed?: boolean;
  },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: AnalyticsReportEvent[]; total: number }> {
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  const addIfTruthy = (clause: string, value: unknown) => {
    if (!value) return;
    whereClause += ` AND ${clause} = $${paramIndex++}`;
    params.push(value);
  };

  addIfTruthy('"eventType"', filters.eventType);
  addIfTruthy('"eventCategory"', filters.eventCategory);
  addIfTruthy('"customerId"', filters.customerId);
  addIfTruthy('"orderId"', filters.orderId);
  addIfTruthy('"productId"', filters.productId);
  addIfTruthy('"salesChannelId"', filters.salesChannelId);

  if (filters.startDate) {
    whereClause += ` AND "createdAt" >= $${paramIndex++}`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    whereClause += ` AND "createdAt" <= $${paramIndex++}`;
    params.push(filters.endDate);
  }
  if (filters.isProcessed !== undefined) {
    whereClause += ` AND "isProcessed" = $${paramIndex++}`;
    params.push(filters.isProcessed);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "analyticsReportEvent" WHERE ${whereClause}`,
    params,
  );

  const limit = pagination?.limit || 100;
  const offset = pagination?.offset || 0;

  const rows = await query<DbAnalyticsReportEvent[]>(
    `SELECT * FROM "analyticsReportEvent" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToAnalyticsReportEvent),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function getUnprocessedEvents(limit: number = 1000): Promise<AnalyticsReportEvent[]> {
  const rows = await query<DbAnalyticsReportEvent[]>(
    `SELECT * FROM "analyticsReportEvent" WHERE "isProcessed" = false 
     ORDER BY "createdAt" ASC LIMIT $1`,
    [limit],
  );
  return (rows || []).map(mapToAnalyticsReportEvent);
}

export async function markEventsProcessed(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;

  await query(
    `UPDATE "analyticsReportEvent" SET "isProcessed" = true, "processedAt" = NOW() 
     WHERE "analyticsReportEventId" = ANY($1)`,
    [eventIds],
  );
}

export async function getEventCounts(
  startDate: Date,
  endDate: Date,
  groupBy: 'hour' | 'day' = 'day',
): Promise<{ period: string; eventType: string; count: number }[]> {
  const dateFormat = groupBy === 'hour' ? 'YYYY-MM-DD HH24:00' : 'YYYY-MM-DD';

  const rows = await query<Array<{ period: string; eventType: string; count: string }>>(
    `SELECT 
      TO_CHAR("createdAt", $1) as period,
      "eventType",
      COUNT(*) as count
     FROM "analyticsReportEvent"
     WHERE "createdAt" >= $2 AND "createdAt" <= $3
     GROUP BY period, "eventType"
     ORDER BY period DESC, count DESC`,
    [dateFormat, startDate, endDate],
  );

  return (rows || []).map(row => ({
    period: row.period,
    eventType: row.eventType,
    count: parseInt(row.count),
  }));
}

// ============================================================================
// Snapshots
// ============================================================================

export async function createSnapshot(
  snapshot: Partial<AnalyticsReportSnapshot> & {
    snapshotType: 'hourly' | 'daily' | 'weekly' | 'monthly';
    snapshotTime: Date;
    snapshotDate: Date;
  },
): Promise<AnalyticsReportSnapshot> {
  const result = await queryOne<DbAnalyticsReportSnapshot>(
    `INSERT INTO "analyticsReportSnapshot" (
      "organizationId", "snapshotType", "snapshotTime", "snapshotDate", "snapshotHour",
      "totalOrders", "pendingOrders", "processingOrders", "shippedOrders",
      "deliveredOrders", "cancelledOrders", "refundedOrders",
      "totalRevenueCents", "pendingRevenueCents", "refundedAmountCents",
      "totalCustomers", "activeCustomers", "newCustomersToday",
      "totalProducts", "activeProducts", "outOfStockProducts", "lowStockProducts",
      "totalInventoryValueCents", "totalInventoryUnits",
      "openTickets", "pendingTickets",
      "activeSubscriptions", "monthlyRecurringRevenueCents",
      "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, NOW())
    ON CONFLICT ("organizationId", "snapshotType", "snapshotTime") DO UPDATE SET
      "totalOrders" = EXCLUDED."totalOrders",
      "pendingOrders" = EXCLUDED."pendingOrders",
      "processingOrders" = EXCLUDED."processingOrders",
      "shippedOrders" = EXCLUDED."shippedOrders",
      "deliveredOrders" = EXCLUDED."deliveredOrders",
      "cancelledOrders" = EXCLUDED."cancelledOrders",
      "refundedOrders" = EXCLUDED."refundedOrders",
      "totalRevenueCents" = EXCLUDED."totalRevenueCents",
      "pendingRevenueCents" = EXCLUDED."pendingRevenueCents",
      "refundedAmountCents" = EXCLUDED."refundedAmountCents",
      "totalCustomers" = EXCLUDED."totalCustomers",
      "activeCustomers" = EXCLUDED."activeCustomers",
      "newCustomersToday" = EXCLUDED."newCustomersToday",
      "totalProducts" = EXCLUDED."totalProducts",
      "activeProducts" = EXCLUDED."activeProducts",
      "outOfStockProducts" = EXCLUDED."outOfStockProducts",
      "lowStockProducts" = EXCLUDED."lowStockProducts",
      "totalInventoryValueCents" = EXCLUDED."totalInventoryValueCents",
      "totalInventoryUnits" = EXCLUDED."totalInventoryUnits",
      "openTickets" = EXCLUDED."openTickets",
      "pendingTickets" = EXCLUDED."pendingTickets",
      "activeSubscriptions" = EXCLUDED."activeSubscriptions",
      "monthlyRecurringRevenueCents" = EXCLUDED."monthlyRecurringRevenueCents"
    RETURNING *`,
    [
      snapshot.organizationId,
      snapshot.snapshotType,
      snapshot.snapshotTime,
      snapshot.snapshotDate,
      snapshot.snapshotHour,
      ...snapshotOrderValues(snapshot),
      ...snapshotMetricValues(snapshot),
    ],
  );

  return mapToAnalyticsReportSnapshot(result!);
}

function snapshotOrderValues(snapshot: Partial<AnalyticsReportSnapshot>): unknown[] {
  return [
    snapshot.totalOrders || 0,
    snapshot.pendingOrders || 0,
    snapshot.processingOrders || 0,
    snapshot.shippedOrders || 0,
    snapshot.deliveredOrders || 0,
    snapshot.cancelledOrders || 0,
    snapshot.refundedOrders || 0,
    snapshot.totalRevenueCents || 0,
    snapshot.pendingRevenueCents || 0,
    snapshot.refundedAmountCents || 0,
  ];
}

function snapshotMetricValues(snapshot: Partial<AnalyticsReportSnapshot>): unknown[] {
  return [
    snapshot.totalCustomers || 0,
    snapshot.activeCustomers || 0,
    snapshot.newCustomersToday || 0,
    snapshot.totalProducts || 0,
    snapshot.activeProducts || 0,
    snapshot.outOfStockProducts || 0,
    snapshot.lowStockProducts || 0,
    snapshot.totalInventoryValueCents || 0,
    snapshot.totalInventoryUnits || 0,
    snapshot.openTickets || 0,
    snapshot.pendingTickets || 0,
    snapshot.activeSubscriptions || 0,
    snapshot.monthlyRecurringRevenueCents || 0,
  ];
}

export async function getSnapshots(
  snapshotType: 'hourly' | 'daily' | 'weekly' | 'monthly',
  startDate: Date,
  endDate: Date,
  organizationId?: string,
): Promise<AnalyticsReportSnapshot[]> {
  let whereClause = '"snapshotType" = $1 AND "snapshotDate" >= $2 AND "snapshotDate" <= $3';
  const params: unknown[] = [snapshotType, startDate, endDate];

  if (organizationId) {
    whereClause += ' AND "organizationId" = $4';
    params.push(organizationId);
  }

  const rows = await query<DbAnalyticsReportSnapshot[]>(
    `SELECT * FROM "analyticsReportSnapshot" WHERE ${whereClause} ORDER BY "snapshotTime" DESC`,
    params,
  );

  return (rows || []).map(mapToAnalyticsReportSnapshot);
}

export async function getLatestSnapshot(
  snapshotType: 'hourly' | 'daily' | 'weekly' | 'monthly',
  organizationId?: string,
): Promise<AnalyticsReportSnapshot | null> {
  let whereClause = '"snapshotType" = $1';
  const params: unknown[] = [snapshotType];

  if (organizationId) {
    whereClause += ' AND "organizationId" = $2';
    params.push(organizationId);
  }

  const row = await queryOne<DbAnalyticsReportSnapshot>(
    `SELECT * FROM "analyticsReportSnapshot" WHERE ${whereClause} ORDER BY "snapshotTime" DESC LIMIT 1`,
    params,
  );

  return row ? mapToAnalyticsReportSnapshot(row) : null;
}

// Dashboards moved to reportDashboardRepo.ts — re-exported here so existing
// importers keep working.
export { getDashboards, getDashboard, saveDashboard, deleteDashboard } from './reportDashboardRepo';

// ============================================================================
// Real-time Metrics
// ============================================================================

export async function getRealTimeMetrics(
  organizationId?: string,
  minutes: number = 60,
): Promise<{
  activeVisitors: number;
  ordersLastHour: number;
  revenueLastHour: number;
  cartsCreated: number;
  checkoutsStarted: number;
}> {
  const since = new Date(Date.now() - minutes * 60 * 1000);

  let merchantFilter = '';
  const params: unknown[] = [since];

  if (organizationId) {
    merchantFilter = ' AND "organizationId" = $2';
    params.push(organizationId);
  }

  const visitors = await queryOne<{ count: string }>(
    `SELECT COUNT(DISTINCT "visitorId") as count FROM "analyticsReportEvent" 
     WHERE "createdAt" >= $1 AND "visitorId" IS NOT NULL${merchantFilter}`,
    params,
  );

  const orders = await queryOne<{ count: string; revenueCents: string }>(
    `SELECT COUNT(*) as count, COALESCE(SUM("eventValueCents"), 0) as "revenueCents" 
     FROM "analyticsReportEvent" 
     WHERE "createdAt" >= $1 AND "eventType" = 'order.created'${merchantFilter}`,
    params,
  );

  const carts = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "analyticsReportEvent" 
     WHERE "createdAt" >= $1 AND "eventType" = 'cart.created'${merchantFilter}`,
    params,
  );

  const checkouts = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "analyticsReportEvent" 
     WHERE "createdAt" >= $1 AND "eventType" = 'checkout.started'${merchantFilter}`,
    params,
  );

  return {
    activeVisitors: parseInt(visitors?.count || '0'),
    ordersLastHour: parseInt(orders?.count || '0'),
    revenueLastHour: parseFloat(orders?.revenueCents || '0'),
    cartsCreated: parseInt(carts?.count || '0'),
    checkoutsStarted: parseInt(checkouts?.count || '0'),
  };
}

// ============================================================================
// Mappers
// ============================================================================

function mapToAnalyticsReportEvent(row: AnalyticsReportEventRow): AnalyticsReportEvent {
  return {
    analyticsReportEventId: row.analyticsReportEventId,
    eventType: row.eventType,
    eventCategory: row.eventCategory,
    eventAction: row.eventAction,
    ...reportEventActorFields(row),
    ...reportEventDataFields(row),
    ...reportEventAttributionFields(row),
    isProcessed: Boolean(row.isProcessed),
    processedAt: row.processedAt ? new Date(row.processedAt) : undefined,
    createdAt: new Date(row.createdAt ?? new Date()),
  };
}

function reportEventActorFields(row: AnalyticsReportEventRow) {
  return {
    organizationId: row.organizationId ?? undefined,
    customerId: row.customerId ?? undefined,
    orderId: row.orderId ?? undefined,
    productId: row.productId ?? undefined,
    basketId: row.basketId ?? undefined,
    sessionId: row.sessionId ?? undefined,
    visitorId: row.visitorId ?? undefined,
    channel: row.channel ?? undefined,
    salesChannelId: row.salesChannelId ?? undefined,
  };
}

function reportEventDataFields(row: AnalyticsReportEventRow) {
  return {
    eventData: (row.eventData as Record<string, unknown>) ?? undefined,
    eventValueCents: row.eventValueCents ? Number(row.eventValueCents) : undefined,
    eventQuantity: row.eventQuantity ?? undefined,
    currency: row.currencyCode ?? undefined,
    ipAddress: row.ipAddress ?? undefined,
    userAgent: row.userAgent ?? undefined,
    referrer: row.referrer ?? undefined,
  };
}

function reportEventAttributionFields(row: AnalyticsReportEventRow) {
  return {
    utmSource: row.utmSource ?? undefined,
    utmMedium: row.utmMedium ?? undefined,
    utmCampaign: row.utmCampaign ?? undefined,
    deviceType: row.deviceType ?? undefined,
    country: row.country ?? undefined,
    region: row.region ?? undefined,
  };
}

function mapToAnalyticsReportSnapshot(row: AnalyticsReportSnapshotRow): AnalyticsReportSnapshot {
  return {
    analyticsReportSnapshotId: row.analyticsReportSnapshotId,
    organizationId: row.organizationId ?? undefined,
    snapshotType: row.snapshotType as 'hourly' | 'daily' | 'weekly' | 'monthly',
    snapshotTime: new Date(row.snapshotTime),
    snapshotDate: new Date(row.snapshotDate),
    snapshotHour: row.snapshotHour ?? undefined,
    ...reportSnapshotOrderFields(row),
    ...reportSnapshotMetricFields(row),
    createdAt: new Date(row.createdAt ?? new Date()),
  };
}

function reportSnapshotOrderFields(row: AnalyticsReportSnapshotRow) {
  return {
    totalOrders: row.totalOrders ?? 0,
    pendingOrders: row.pendingOrders ?? 0,
    processingOrders: row.processingOrders ?? 0,
    shippedOrders: row.shippedOrders ?? 0,
    deliveredOrders: row.deliveredOrders ?? 0,
    cancelledOrders: row.cancelledOrders ?? 0,
    refundedOrders: row.refundedOrders ?? 0,
    totalRevenueCents: Number(row.totalRevenueCents ?? 0),
    pendingRevenueCents: Number(row.pendingRevenueCents ?? 0),
    refundedAmountCents: Number(row.refundedAmountCents ?? 0),
  };
}

function reportSnapshotMetricFields(row: AnalyticsReportSnapshotRow) {
  return {
    totalCustomers: row.totalCustomers ?? 0,
    activeCustomers: row.activeCustomers ?? 0,
    newCustomersToday: row.newCustomersToday ?? 0,
    totalProducts: row.totalProducts ?? 0,
    activeProducts: row.activeProducts ?? 0,
    outOfStockProducts: row.outOfStockProducts ?? 0,
    lowStockProducts: row.lowStockProducts ?? 0,
    totalInventoryValueCents: Number(row.totalInventoryValueCents ?? 0),
    totalInventoryUnits: row.totalInventoryUnits ?? 0,
    openTickets: row.openTickets ?? 0,
    pendingTickets: row.pendingTickets ?? 0,
    activeSubscriptions: row.activeSubscriptions ?? 0,
    monthlyRecurringRevenueCents: Number(row.monthlyRecurringRevenueCents ?? 0),
  };
}
