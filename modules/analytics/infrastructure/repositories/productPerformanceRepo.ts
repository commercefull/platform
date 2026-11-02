/**
 * Product Performance Repository
 *
 * Product performance tracking for analytics: views, carts, purchases,
 * revenue, returns, reviews, and stock metrics — one row per
 * (productId, productVariantId, date, channel) rollup key.
 */

import { query, queryOne } from '../../../../libs/db';
import type { AnalyticsProductPerformance as AnalyticsProductPerformanceRow } from '../../../../libs/db/types';
import type { ProductPerformance } from '../../domain/types';
import type { AnalyticsProductPerformance as DbAnalyticsProductPerformance } from '../../../../libs/db/types';

// ============================================================================
// Product Performance
// ============================================================================

export async function getProductPerformance(
  filters: { productId?: string; startDate?: Date; endDate?: Date; salesChannelId?: string },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: ProductPerformance[]; total: number }> {
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.salesChannelId) {
    whereClause += ` AND "salesChannelId" = $${paramIndex++}`;
    params.push(filters.salesChannelId);
  }
  if (filters.productId) {
    whereClause += ` AND "productId" = $${paramIndex++}`;
    params.push(filters.productId);
  }
  if (filters.startDate) {
    whereClause += ` AND "date" >= $${paramIndex++}`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    whereClause += ` AND "date" <= $${paramIndex++}`;
    params.push(filters.endDate);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "analyticsProductPerformance" WHERE ${whereClause}`,
    params,
  );

  const limit = pagination?.limit || 30;
  const offset = pagination?.offset || 0;

  const rows = await query<DbAnalyticsProductPerformance[]>(
    `SELECT * FROM "analyticsProductPerformance" WHERE ${whereClause}
     ORDER BY "date" DESC, "revenueCents" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToProductPerformance),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function getTopProducts(
  startDate: Date,
  endDate: Date,
  metric: 'revenue' | 'purchases' | 'views' = 'revenue',
  limit: number = 10,
): Promise<ProductPerformance[]> {
  const rows = await query<AnalyticsProductPerformanceRow[]>(
    `SELECT "productId",
      SUM("views") as "views",
      SUM("uniqueViews") as "uniqueViews",
      SUM("addToCarts") as "addToCarts",
      SUM("purchases") as "purchases",
      SUM("quantitySold") as "quantitySold",
      SUM("revenueCents") as "revenueCents",
      AVG("averageRating") as "averageRating"
     FROM "analyticsProductPerformance"
     WHERE "date" >= $1 AND "date" <= $2
     GROUP BY "productId"
     ORDER BY SUM("${metric === 'revenue' ? 'revenueCents' : metric}") DESC
     LIMIT $3`,
    [startDate, endDate, limit],
  );

  return (rows || []).map(mapToProductPerformance);
}

export async function upsertProductPerformance(
  data: Partial<ProductPerformance> & {
    productId: string;
    date: Date;
    salesChannelId?: string;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const channel = data.salesChannelId ?? data.channel ?? 'all';

  await query(
    `INSERT INTO "analyticsProductPerformance" (
      "productId", "productVariantId", "date", "channel", "salesChannelId",
      "views", "uniqueViews", "detailViews",
      "addToCarts", "removeFromCarts", "viewToCartRate",
      "purchases", "quantitySold", "revenueCents", "averagePriceCents", "cartToOrderRate",
      "returns", "returnQuantity", "returnRate",
      "reviews", "averageRating", "stockAlerts", "outOfStockViews",
      "computedAt", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
    ON CONFLICT ("productId", "productVariantId", "date", "channel") DO UPDATE SET
      "views" = "analyticsProductPerformance"."views" + EXCLUDED."views",
      "uniqueViews" = "analyticsProductPerformance"."uniqueViews" + EXCLUDED."uniqueViews",
      "detailViews" = "analyticsProductPerformance"."detailViews" + EXCLUDED."detailViews",
      "addToCarts" = "analyticsProductPerformance"."addToCarts" + EXCLUDED."addToCarts",
      "removeFromCarts" = "analyticsProductPerformance"."removeFromCarts" + EXCLUDED."removeFromCarts",
      "purchases" = "analyticsProductPerformance"."purchases" + EXCLUDED."purchases",
      "quantitySold" = "analyticsProductPerformance"."quantitySold" + EXCLUDED."quantitySold",
      "revenueCents" = "analyticsProductPerformance"."revenueCents" + EXCLUDED."revenueCents",
      "returns" = "analyticsProductPerformance"."returns" + EXCLUDED."returns",
      "reviews" = "analyticsProductPerformance"."reviews" + EXCLUDED."reviews",
      "stockAlerts" = "analyticsProductPerformance"."stockAlerts" + EXCLUDED."stockAlerts",
      "outOfStockViews" = "analyticsProductPerformance"."outOfStockViews" + EXCLUDED."outOfStockViews"`,
    [
      data.productId,
      data.productVariantId,
      data.date,
      channel,
      data.salesChannelId ?? null,
      ...productViewMetrics(data),
      ...productOrderMetrics(data),
      ...productStockMetrics(data),
      now,
      now,
    ],
  );
}

function productViewMetrics(data: Partial<ProductPerformance>): unknown[] {
  return [
    data.views || 0,
    data.uniqueViews || 0,
    data.detailViews || 0,
    data.addToCarts || 0,
    data.removeFromCarts || 0,
    data.viewToCartRate || 0,
  ];
}

function productOrderMetrics(data: Partial<ProductPerformance>): unknown[] {
  return [
    data.purchases || 0,
    data.quantitySold || 0,
    data.revenueCents || 0,
    data.averagePriceCents || 0,
    data.cartToOrderRate || 0,
    data.returns || 0,
    data.returnQuantity || 0,
    data.returnRate || 0,
    data.reviews || 0,
    data.averageRating,
  ];
}

function productStockMetrics(data: Partial<ProductPerformance>): unknown[] {
  return [data.stockAlerts || 0, data.outOfStockViews || 0];
}

// ============================================================================
// Mappers
// ============================================================================

function mapToProductPerformance(row: AnalyticsProductPerformanceRow): ProductPerformance {
  return {
    analyticsProductPerformanceId: row.analyticsProductPerformanceId,
    productId: row.productId,
    productVariantId: row.productVariantId ?? undefined,
    date: new Date(row.date),
    channel: row.channel ?? 'all',
    salesChannelId: row.salesChannelId ?? undefined,
    ...mapProductViewMetrics(row),
    ...mapProductOrderMetrics(row),
    ...mapProductStockMetrics(row),
    createdAt: new Date(row.createdAt ?? new Date()),
  };
}

function mapProductViewMetrics(row: AnalyticsProductPerformanceRow) {
  return {
    views: row.views ?? 0,
    uniqueViews: row.uniqueViews ?? 0,
    detailViews: row.detailViews ?? 0,
    addToCarts: row.addToCarts ?? 0,
    removeFromCarts: row.removeFromCarts ?? 0,
    viewToCartRate: parseFloat(row.viewToCartRate ?? '0'),
  };
}

function mapProductOrderMetrics(row: AnalyticsProductPerformanceRow) {
  return {
    purchases: row.purchases ?? 0,
    quantitySold: row.quantitySold ?? 0,
    revenueCents: Number(row.revenueCents ?? 0),
    averagePriceCents: Number(row.averagePriceCents ?? 0),
    cartToOrderRate: parseFloat(row.cartToOrderRate ?? '0'),
    returns: row.returns ?? 0,
    returnQuantity: row.returnQuantity ?? 0,
    returnRate: parseFloat(row.returnRate ?? '0'),
    reviews: row.reviews ?? 0,
    averageRating: row.averageRating ? parseFloat(row.averageRating) : undefined,
  };
}

function mapProductStockMetrics(row: AnalyticsProductPerformanceRow) {
  return {
    stockAlerts: row.stockAlerts ?? 0,
    outOfStockViews: row.outOfStockViews ?? 0,
    computedAt: row.computedAt ? new Date(row.computedAt) : undefined,
  };
}
