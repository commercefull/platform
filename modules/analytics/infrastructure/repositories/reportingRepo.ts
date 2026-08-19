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
  AnalyticsReportDashboard as AnalyticsReportDashboardRow,
} from '../../../../libs/db/types';

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

export interface AnalyticsReportEvent {
  analyticsReportEventId: string;
  organizationId?: string;
  eventType: string;
  eventCategory: string;
  eventAction: string;
  customerId?: string;
  orderId?: string;
  productId?: string;
  basketId?: string;
  sessionId?: string;
  visitorId?: string;
  channel?: string;
  eventData?: Record<string, unknown>;
  eventValue?: number;
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
  isProcessed: boolean;
  processedAt?: Date;
  createdAt: Date;
}

export interface AnalyticsReportSnapshot {
  analyticsReportSnapshotId: string;
  organizationId?: string;
  snapshotType: 'hourly' | 'daily' | 'weekly' | 'monthly';
  snapshotTime: Date;
  snapshotDate: Date;
  snapshotHour?: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRevenue: number;
  pendingRevenue: number;
  refundedAmount: number;
  totalCustomers: number;
  activeCustomers: number;
  newCustomersToday: number;
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  totalInventoryValue: number;
  totalInventoryUnits: number;
  openTickets: number;
  pendingTickets: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  createdAt: Date;
}

export interface AnalyticsReportDashboard {
  analyticsReportDashboardId: string;
  organizationId?: string;
  createdBy?: string;
  name: string;
  slug?: string;
  description?: string;
  isDefault: boolean;
  isShared: boolean;
  layout?: Record<string, unknown>;
  widgets?: unknown[];
  filters?: Record<string, unknown>;
  dateRange: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  eventData?: Record<string, unknown>;
  eventValue?: number;
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
  const result = await queryOne<AnalyticsReportEventRow>(
    `INSERT INTO "analyticsReportEvent" (
      "eventType", "eventCategory", "eventAction",
      "organizationId", "customerId", "orderId", "productId", "basketId",
      "sessionId", "visitorId", "channel",
      "eventData", "eventValue", "eventQuantity", "currency",
      "ipAddress", "userAgent", "referrer",
      "utmSource", "utmMedium", "utmCampaign",
      "deviceType", "country", "region",
      "isProcessed", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, false, NOW())
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
      event.channel,
      event.eventData ? JSON.stringify(event.eventData) : null,
      event.eventValue,
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
    startDate?: Date;
    endDate?: Date;
    isProcessed?: boolean;
  },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: AnalyticsReportEvent[]; total: number }> {
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.eventType) {
    whereClause += ` AND "eventType" = $${paramIndex++}`;
    params.push(filters.eventType);
  }
  if (filters.eventCategory) {
    whereClause += ` AND "eventCategory" = $${paramIndex++}`;
    params.push(filters.eventCategory);
  }
  if (filters.customerId) {
    whereClause += ` AND "customerId" = $${paramIndex++}`;
    params.push(filters.customerId);
  }
  if (filters.orderId) {
    whereClause += ` AND "orderId" = $${paramIndex++}`;
    params.push(filters.orderId);
  }
  if (filters.productId) {
    whereClause += ` AND "productId" = $${paramIndex++}`;
    params.push(filters.productId);
  }
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

  const rows = await query<AnalyticsReportEventRow[]>(
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
  const rows = await query<AnalyticsReportEventRow[]>(
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
  const result = await queryOne<AnalyticsReportSnapshotRow>(
    `INSERT INTO "analyticsReportSnapshot" (
      "organizationId", "snapshotType", "snapshotTime", "snapshotDate", "snapshotHour",
      "totalOrders", "pendingOrders", "processingOrders", "shippedOrders",
      "deliveredOrders", "cancelledOrders", "refundedOrders",
      "totalRevenue", "pendingRevenue", "refundedAmount",
      "totalCustomers", "activeCustomers", "newCustomersToday",
      "totalProducts", "activeProducts", "outOfStockProducts", "lowStockProducts",
      "totalInventoryValue", "totalInventoryUnits",
      "openTickets", "pendingTickets",
      "activeSubscriptions", "monthlyRecurringRevenue",
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
      "totalRevenue" = EXCLUDED."totalRevenue",
      "pendingRevenue" = EXCLUDED."pendingRevenue",
      "refundedAmount" = EXCLUDED."refundedAmount",
      "totalCustomers" = EXCLUDED."totalCustomers",
      "activeCustomers" = EXCLUDED."activeCustomers",
      "newCustomersToday" = EXCLUDED."newCustomersToday",
      "totalProducts" = EXCLUDED."totalProducts",
      "activeProducts" = EXCLUDED."activeProducts",
      "outOfStockProducts" = EXCLUDED."outOfStockProducts",
      "lowStockProducts" = EXCLUDED."lowStockProducts",
      "totalInventoryValue" = EXCLUDED."totalInventoryValue",
      "totalInventoryUnits" = EXCLUDED."totalInventoryUnits",
      "openTickets" = EXCLUDED."openTickets",
      "pendingTickets" = EXCLUDED."pendingTickets",
      "activeSubscriptions" = EXCLUDED."activeSubscriptions",
      "monthlyRecurringRevenue" = EXCLUDED."monthlyRecurringRevenue"
    RETURNING *`,
    [
      snapshot.organizationId,
      snapshot.snapshotType,
      snapshot.snapshotTime,
      snapshot.snapshotDate,
      snapshot.snapshotHour,
      snapshot.totalOrders || 0,
      snapshot.pendingOrders || 0,
      snapshot.processingOrders || 0,
      snapshot.shippedOrders || 0,
      snapshot.deliveredOrders || 0,
      snapshot.cancelledOrders || 0,
      snapshot.refundedOrders || 0,
      snapshot.totalRevenue || 0,
      snapshot.pendingRevenue || 0,
      snapshot.refundedAmount || 0,
      snapshot.totalCustomers || 0,
      snapshot.activeCustomers || 0,
      snapshot.newCustomersToday || 0,
      snapshot.totalProducts || 0,
      snapshot.activeProducts || 0,
      snapshot.outOfStockProducts || 0,
      snapshot.lowStockProducts || 0,
      snapshot.totalInventoryValue || 0,
      snapshot.totalInventoryUnits || 0,
      snapshot.openTickets || 0,
      snapshot.pendingTickets || 0,
      snapshot.activeSubscriptions || 0,
      snapshot.monthlyRecurringRevenue || 0,
    ],
  );

  return mapToAnalyticsReportSnapshot(result!);
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

  const rows = await query<AnalyticsReportSnapshotRow[]>(
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

  const row = await queryOne<AnalyticsReportSnapshotRow>(
    `SELECT * FROM "analyticsReportSnapshot" WHERE ${whereClause} ORDER BY "snapshotTime" DESC LIMIT 1`,
    params,
  );

  return row ? mapToAnalyticsReportSnapshot(row) : null;
}

// ============================================================================
// Dashboards
// ============================================================================

export async function getDashboards(organizationId?: string): Promise<AnalyticsReportDashboard[]> {
  let whereClause = '1=1';
  const params: unknown[] = [];

  if (organizationId) {
    whereClause = '"organizationId" = $1 OR "isShared" = true';
    params.push(organizationId);
  }

  const rows = await query<AnalyticsReportDashboardRow[]>(
    `SELECT * FROM "analyticsReportDashboard" WHERE ${whereClause} ORDER BY "isDefault" DESC, "name" ASC`,
    params,
  );

  return (rows || []).map(mapToAnalyticsReportDashboard);
}

export async function getDashboard(dashboardId: string): Promise<AnalyticsReportDashboard | null> {
  const row = await queryOne<AnalyticsReportDashboardRow>('SELECT * FROM "analyticsReportDashboard" WHERE "analyticsReportDashboardId" = $1', [
    dashboardId,
  ]);
  return row ? mapToAnalyticsReportDashboard(row) : null;
}

export async function saveDashboard(
  dashboard: Partial<AnalyticsReportDashboard> & {
    name: string;
  },
): Promise<AnalyticsReportDashboard> {
  const now = new Date().toISOString();

  if (dashboard.analyticsReportDashboardId) {
    await query(
      `UPDATE "analyticsReportDashboard" SET
        "name" = $1, "slug" = $2, "description" = $3,
        "isDefault" = $4, "isShared" = $5,
        "layout" = $6, "widgets" = $7, "filters" = $8, "dateRange" = $9,
        "updatedAt" = $10
       WHERE "analyticsReportDashboardId" = $11`,
      [
        dashboard.name,
        dashboard.slug,
        dashboard.description,
        dashboard.isDefault || false,
        dashboard.isShared || false,
        dashboard.layout ? JSON.stringify(dashboard.layout) : null,
        dashboard.widgets ? JSON.stringify(dashboard.widgets) : null,
        dashboard.filters ? JSON.stringify(dashboard.filters) : null,
        dashboard.dateRange || 'last_30_days',
        now,
        dashboard.analyticsReportDashboardId,
      ],
    );
    return (await getDashboard(dashboard.analyticsReportDashboardId))!;
  } else {
    const result = await queryOne<AnalyticsReportDashboardRow>(
      `INSERT INTO "analyticsReportDashboard" (
        "organizationId", "createdBy", "name", "slug", "description",
        "isDefault", "isShared", "layout", "widgets", "filters", "dateRange",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        dashboard.organizationId,
        dashboard.createdBy,
        dashboard.name,
        dashboard.slug,
        dashboard.description,
        dashboard.isDefault || false,
        dashboard.isShared || false,
        dashboard.layout ? JSON.stringify(dashboard.layout) : null,
        dashboard.widgets ? JSON.stringify(dashboard.widgets) : null,
        dashboard.filters ? JSON.stringify(dashboard.filters) : null,
        dashboard.dateRange || 'last_30_days',
        now,
        now,
      ],
    );
    return mapToAnalyticsReportDashboard(result!);
  }
}

export async function deleteDashboard(dashboardId: string): Promise<void> {
  await query('DELETE FROM "analyticsReportDashboard" WHERE "analyticsReportDashboardId" = $1', [dashboardId]);
}

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

  const orders = await queryOne<{ count: string; revenue: string }>(
    `SELECT COUNT(*) as count, COALESCE(SUM("eventValue"), 0) as revenue 
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
    revenueLastHour: parseFloat(orders?.revenue || '0'),
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
    organizationId: row.organizationId ?? undefined,
    eventType: row.eventType,
    eventCategory: row.eventCategory,
    eventAction: row.eventAction,
    customerId: row.customerId ?? undefined,
    orderId: row.orderId ?? undefined,
    productId: row.productId ?? undefined,
    basketId: row.basketId ?? undefined,
    sessionId: row.sessionId ?? undefined,
    visitorId: row.visitorId ?? undefined,
    channel: row.channel ?? undefined,
    eventData: (row.eventData as Record<string, unknown>) ?? undefined,
    eventValue: row.eventValue ? parseFloat(row.eventValue) : undefined,
    eventQuantity: row.eventQuantity ?? undefined,
    currency: row.currency ?? undefined,
    ipAddress: row.ipAddress ?? undefined,
    userAgent: row.userAgent ?? undefined,
    referrer: row.referrer ?? undefined,
    utmSource: row.utmSource ?? undefined,
    utmMedium: row.utmMedium ?? undefined,
    utmCampaign: row.utmCampaign ?? undefined,
    deviceType: row.deviceType ?? undefined,
    country: row.country ?? undefined,
    region: row.region ?? undefined,
    isProcessed: Boolean(row.isProcessed),
    processedAt: row.processedAt ? new Date(row.processedAt) : undefined,
    createdAt: new Date(row.createdAt ?? new Date()),
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
    totalOrders: row.totalOrders ?? 0,
    pendingOrders: row.pendingOrders ?? 0,
    processingOrders: row.processingOrders ?? 0,
    shippedOrders: row.shippedOrders ?? 0,
    deliveredOrders: row.deliveredOrders ?? 0,
    cancelledOrders: row.cancelledOrders ?? 0,
    refundedOrders: row.refundedOrders ?? 0,
    totalRevenue: parseFloat(row.totalRevenue ?? '0'),
    pendingRevenue: parseFloat(row.pendingRevenue ?? '0'),
    refundedAmount: parseFloat(row.refundedAmount ?? '0'),
    totalCustomers: row.totalCustomers ?? 0,
    activeCustomers: row.activeCustomers ?? 0,
    newCustomersToday: row.newCustomersToday ?? 0,
    totalProducts: row.totalProducts ?? 0,
    activeProducts: row.activeProducts ?? 0,
    outOfStockProducts: row.outOfStockProducts ?? 0,
    lowStockProducts: row.lowStockProducts ?? 0,
    totalInventoryValue: parseFloat(row.totalInventoryValue ?? '0'),
    totalInventoryUnits: row.totalInventoryUnits ?? 0,
    openTickets: row.openTickets ?? 0,
    pendingTickets: row.pendingTickets ?? 0,
    activeSubscriptions: row.activeSubscriptions ?? 0,
    monthlyRecurringRevenue: parseFloat(row.monthlyRecurringRevenue ?? '0'),
    createdAt: new Date(row.createdAt ?? new Date()),
  };
}

function mapToAnalyticsReportDashboard(row: AnalyticsReportDashboardRow): AnalyticsReportDashboard {
  return {
    analyticsReportDashboardId: row.analyticsReportDashboardId,
    organizationId: row.organizationId ?? undefined,
    createdBy: row.createdBy ?? undefined,
    name: row.name,
    slug: row.slug ?? undefined,
    description: row.description ?? undefined,
    isDefault: Boolean(row.isDefault),
    isShared: Boolean(row.isShared),
    layout: (row.layout as Record<string, unknown>) ?? undefined,
    widgets: (row.widgets as unknown[]) ?? undefined,
    filters: (row.filters as Record<string, unknown>) ?? undefined,
    dateRange: row.dateRange ?? 'last_30_days',
    createdAt: new Date(row.createdAt ?? new Date()),
    updatedAt: new Date(row.updatedAt ?? new Date()),
  };
}
