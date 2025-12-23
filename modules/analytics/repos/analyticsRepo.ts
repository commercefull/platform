/**
 * Analytics Repository
 *
 * Handles CRUD and aggregation operations for analytics data including:
 * - Daily sales metrics and summaries
 * - Product performance tracking
 * - Search query analytics
 * - Customer cohort analysis
 * - Channel attribution data
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// Note: Using custom interfaces with `number` for decimal fields since the
// application logic performs calculations. DB types use `string` for decimals
// to preserve precision, but we convert them to numbers for computation.
// ============================================================================

export interface SalesDaily {
  analyticsSalesDailyId: string;
  merchantId?: string;
  date: Date;
  channel: string;
  currency: string;
  orderCount: number;
  itemsSold: number;
  grossRevenue: number;
  discountTotal: number;
  refundTotal: number;
  netRevenue: number;
  taxTotal: number;
  shippingRevenue: number;
  averageOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
  guestOrders: number;
  cartCreated: number;
  cartAbandoned: number;
  checkoutStarted: number;
  checkoutCompleted: number;
  conversionRate: number;
  paymentSuccessCount: number;
  paymentFailedCount: number;
  paymentSuccessRate: number;
  computedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductPerformance {
  analyticsProductPerformanceId: string;
  productId: string;
  productVariantId?: string;
  date: Date;
  channel: string;
  views: number;
  uniqueViews: number;
  detailViews: number;
  addToCarts: number;
  removeFromCarts: number;
  viewToCartRate: number;
  purchases: number;
  quantitySold: number;
  revenue: number;
  averagePrice: number;
  cartToOrderRate: number;
  returns: number;
  returnQuantity: number;
  returnRate: number;
  reviews: number;
  averageRating?: number;
  stockAlerts: number;
  outOfStockViews: number;
  computedAt?: Date;
  createdAt: Date;
}

export interface CustomerCohort {
  analyticsCustomerCohortId: string;
  merchantId?: string;
  cohortMonth: Date;
  monthNumber: number;
  customersInCohort: number;
  activeCustomers: number;
  retentionRate: number;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  lifetimeValue: number;
  repeatPurchasers: number;
  repeatPurchaseRate: number;
  averageOrdersPerCustomer: number;
  computedAt?: Date;
  createdAt: Date;
}

export interface SearchQuery {
  analyticsSearchQueryId: string;
  merchantId?: string;
  query: string;
  queryNormalized?: string;
  date: Date;
  searchCount: number;
  uniqueSearchers: number;
  resultCount: number;
  isZeroResult: boolean;
  clickCount: number;
  clickThroughRate: number;
  averageClickPosition: number;
  addToCartCount: number;
  purchaseCount: number;
  conversionRate: number;
  revenue: number;
  refinementCount: number;
  exitCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelAttribution {
  analyticsChannelAttributionId: string;
  merchantId?: string;
  date: Date;
  channel: string;
  source?: string;
  medium?: string;
  campaign?: string;
  sessions: number;
  uniqueVisitors: number;
  pageViews: number;
  bounceRate: number;
  averageSessionDuration: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  averageOrderValue: number;
  firstTouchRevenue: number;
  lastTouchRevenue: number;
  linearRevenue: number;
  adSpend: number;
  costPerAcquisition: number;
  returnOnAdSpend: number;
  computedAt?: Date;
  createdAt: Date;
}

// ============================================================================
// Table Names
// ============================================================================

const TABLES = {
  SALES_DAILY: 'analyticsSalesDaily',
  PRODUCT_PERFORMANCE: 'analyticsProductPerformance',
  CUSTOMER_COHORT: 'analyticsCustomerCohort',
  CHANNEL_ATTRIBUTION: 'analyticsChannelAttribution',
  SEARCH_QUERY: 'analyticsSearchQuery',
} as const;

// ============================================================================
// Sales Analytics
// ============================================================================

export async function getSalesDaily(
  filters: { startDate?: Date; endDate?: Date; channel?: string; merchantId?: string },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: SalesDaily[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.startDate) {
    whereClause += ` AND "date" >= $${paramIndex++}`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    whereClause += ` AND "date" <= $${paramIndex++}`;
    params.push(filters.endDate);
  }
  if (filters.channel) {
    whereClause += ` AND "channel" = $${paramIndex++}`;
    params.push(filters.channel);
  }
  if (filters.merchantId) {
    whereClause += ` AND "merchantId" = $${paramIndex++}`;
    params.push(filters.merchantId);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "${TABLES.SALES_DAILY}" WHERE ${whereClause}`,
    params,
  );

  const limit = pagination?.limit || 30;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "${TABLES.SALES_DAILY}" WHERE ${whereClause} 
     ORDER BY "date" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToSalesDaily),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function getSalesSummary(
  startDate: Date,
  endDate: Date,
  merchantId?: string,
): Promise<{
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  newCustomers: number;
  conversionRate: number;
}> {
  let whereClause = '"date" >= $1 AND "date" <= $2';
  const params: any[] = [startDate, endDate];

  if (merchantId) {
    whereClause += ' AND "merchantId" = $3';
    params.push(merchantId);
  }

  const result = await queryOne<Record<string, any>>(
    `SELECT 
      COALESCE(SUM("netRevenue"), 0) as "totalRevenue",
      COALESCE(SUM("orderCount"), 0) as "totalOrders",
      CASE WHEN SUM("orderCount") > 0 
        THEN SUM("netRevenue") / SUM("orderCount") 
        ELSE 0 END as "averageOrderValue",
      COALESCE(SUM("newCustomers"), 0) as "newCustomers",
      CASE WHEN SUM("checkoutStarted") > 0 
        THEN SUM("checkoutCompleted")::decimal / SUM("checkoutStarted") 
        ELSE 0 END as "conversionRate"
     FROM "${TABLES.SALES_DAILY}" WHERE ${whereClause}`,
    params,
  );

  return {
    totalRevenue: parseFloat(result?.totalRevenue || '0'),
    totalOrders: parseInt(result?.totalOrders || '0'),
    averageOrderValue: parseFloat(result?.averageOrderValue || '0'),
    newCustomers: parseInt(result?.newCustomers || '0'),
    conversionRate: parseFloat(result?.conversionRate || '0'),
  };
}

export async function upsertSalesDaily(
  data: Partial<SalesDaily> & {
    date: Date;
    channel?: string;
    merchantId?: string;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const channel = data.channel || 'all';

  await query(
    `INSERT INTO "analyticsSalesDaily" (
      "merchantId", "date", "channel", "currency",
      "orderCount", "itemsSold", "grossRevenue", "discountTotal", "refundTotal",
      "netRevenue", "taxTotal", "shippingRevenue", "averageOrderValue",
      "newCustomers", "returningCustomers", "guestOrders",
      "cartCreated", "cartAbandoned", "checkoutStarted", "checkoutCompleted", "conversionRate",
      "paymentSuccessCount", "paymentFailedCount", "paymentSuccessRate",
      "computedAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
    ON CONFLICT ("merchantId", "date", "channel", "currency") DO UPDATE SET
      "orderCount" = "analyticsSalesDaily"."orderCount" + EXCLUDED."orderCount",
      "itemsSold" = "analyticsSalesDaily"."itemsSold" + EXCLUDED."itemsSold",
      "grossRevenue" = "analyticsSalesDaily"."grossRevenue" + EXCLUDED."grossRevenue",
      "discountTotal" = "analyticsSalesDaily"."discountTotal" + EXCLUDED."discountTotal",
      "refundTotal" = "analyticsSalesDaily"."refundTotal" + EXCLUDED."refundTotal",
      "netRevenue" = "analyticsSalesDaily"."netRevenue" + EXCLUDED."netRevenue",
      "taxTotal" = "analyticsSalesDaily"."taxTotal" + EXCLUDED."taxTotal",
      "shippingRevenue" = "analyticsSalesDaily"."shippingRevenue" + EXCLUDED."shippingRevenue",
      "newCustomers" = "analyticsSalesDaily"."newCustomers" + EXCLUDED."newCustomers",
      "returningCustomers" = "analyticsSalesDaily"."returningCustomers" + EXCLUDED."returningCustomers",
      "guestOrders" = "analyticsSalesDaily"."guestOrders" + EXCLUDED."guestOrders",
      "cartCreated" = "analyticsSalesDaily"."cartCreated" + EXCLUDED."cartCreated",
      "cartAbandoned" = "analyticsSalesDaily"."cartAbandoned" + EXCLUDED."cartAbandoned",
      "checkoutStarted" = "analyticsSalesDaily"."checkoutStarted" + EXCLUDED."checkoutStarted",
      "checkoutCompleted" = "analyticsSalesDaily"."checkoutCompleted" + EXCLUDED."checkoutCompleted",
      "paymentSuccessCount" = "analyticsSalesDaily"."paymentSuccessCount" + EXCLUDED."paymentSuccessCount",
      "paymentFailedCount" = "analyticsSalesDaily"."paymentFailedCount" + EXCLUDED."paymentFailedCount",
      "updatedAt" = $27`,
    [
      data.merchantId,
      data.date,
      channel,
      data.currency || 'USD',
      data.orderCount || 0,
      data.itemsSold || 0,
      data.grossRevenue || 0,
      data.discountTotal || 0,
      data.refundTotal || 0,
      data.netRevenue || 0,
      data.taxTotal || 0,
      data.shippingRevenue || 0,
      data.averageOrderValue || 0,
      data.newCustomers || 0,
      data.returningCustomers || 0,
      data.guestOrders || 0,
      data.cartCreated || 0,
      data.cartAbandoned || 0,
      data.checkoutStarted || 0,
      data.checkoutCompleted || 0,
      data.conversionRate || 0,
      data.paymentSuccessCount || 0,
      data.paymentFailedCount || 0,
      data.paymentSuccessRate || 0,
      now,
      now,
      now,
    ],
  );
}

// ============================================================================
// Product Performance
// ============================================================================

export async function getProductPerformance(
  filters: { productId?: string; startDate?: Date; endDate?: Date },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: ProductPerformance[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

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

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "analyticsProductPerformance" WHERE ${whereClause} 
     ORDER BY "date" DESC, "revenue" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
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
  const rows = await query<Record<string, any>[]>(
    `SELECT "productId", 
      SUM("views") as "views",
      SUM("uniqueViews") as "uniqueViews",
      SUM("addToCarts") as "addToCarts",
      SUM("purchases") as "purchases",
      SUM("quantitySold") as "quantitySold",
      SUM("revenue") as "revenue",
      AVG("averageRating") as "averageRating"
     FROM "analyticsProductPerformance" 
     WHERE "date" >= $1 AND "date" <= $2
     GROUP BY "productId"
     ORDER BY SUM("${metric}") DESC
     LIMIT $3`,
    [startDate, endDate, limit],
  );

  return (rows || []).map(mapToProductPerformance);
}

export async function upsertProductPerformance(
  data: Partial<ProductPerformance> & {
    productId: string;
    date: Date;
  },
): Promise<void> {
  const now = new Date().toISOString();

  await query(
    `INSERT INTO "analyticsProductPerformance" (
      "productId", "productVariantId", "date", "channel",
      "views", "uniqueViews", "detailViews",
      "addToCarts", "removeFromCarts", "viewToCartRate",
      "purchases", "quantitySold", "revenue", "averagePrice", "cartToOrderRate",
      "returns", "returnQuantity", "returnRate",
      "reviews", "averageRating", "stockAlerts", "outOfStockViews",
      "computedAt", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
    ON CONFLICT ("productId", "productVariantId", "date", "channel") DO UPDATE SET
      "views" = "analyticsProductPerformance"."views" + EXCLUDED."views",
      "uniqueViews" = "analyticsProductPerformance"."uniqueViews" + EXCLUDED."uniqueViews",
      "detailViews" = "analyticsProductPerformance"."detailViews" + EXCLUDED."detailViews",
      "addToCarts" = "analyticsProductPerformance"."addToCarts" + EXCLUDED."addToCarts",
      "removeFromCarts" = "analyticsProductPerformance"."removeFromCarts" + EXCLUDED."removeFromCarts",
      "purchases" = "analyticsProductPerformance"."purchases" + EXCLUDED."purchases",
      "quantitySold" = "analyticsProductPerformance"."quantitySold" + EXCLUDED."quantitySold",
      "revenue" = "analyticsProductPerformance"."revenue" + EXCLUDED."revenue",
      "returns" = "analyticsProductPerformance"."returns" + EXCLUDED."returns",
      "reviews" = "analyticsProductPerformance"."reviews" + EXCLUDED."reviews",
      "stockAlerts" = "analyticsProductPerformance"."stockAlerts" + EXCLUDED."stockAlerts",
      "outOfStockViews" = "analyticsProductPerformance"."outOfStockViews" + EXCLUDED."outOfStockViews"`,
    [
      data.productId,
      data.productVariantId,
      data.date,
      data.channel || 'all',
      data.views || 0,
      data.uniqueViews || 0,
      data.detailViews || 0,
      data.addToCarts || 0,
      data.removeFromCarts || 0,
      data.viewToCartRate || 0,
      data.purchases || 0,
      data.quantitySold || 0,
      data.revenue || 0,
      data.averagePrice || 0,
      data.cartToOrderRate || 0,
      data.returns || 0,
      data.returnQuantity || 0,
      data.returnRate || 0,
      data.reviews || 0,
      data.averageRating,
      data.stockAlerts || 0,
      data.outOfStockViews || 0,
      now,
      now,
    ],
  );
}

// ============================================================================
// Search Analytics
// ============================================================================

export async function getSearchQueries(
  filters: { startDate?: Date; endDate?: Date; isZeroResult?: boolean; query?: string },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: SearchQuery[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.startDate) {
    whereClause += ` AND "date" >= $${paramIndex++}`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    whereClause += ` AND "date" <= $${paramIndex++}`;
    params.push(filters.endDate);
  }
  if (filters.isZeroResult !== undefined) {
    whereClause += ` AND "isZeroResult" = $${paramIndex++}`;
    params.push(filters.isZeroResult);
  }
  if (filters.query) {
    whereClause += ` AND "queryNormalized" ILIKE $${paramIndex++}`;
    params.push(`%${filters.query}%`);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "analyticsSearchQuery" WHERE ${whereClause}`,
    params,
  );

  const limit = pagination?.limit || 50;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "analyticsSearchQuery" WHERE ${whereClause} 
     ORDER BY "searchCount" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToSearchQuery),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function upsertSearchQuery(data: {
  query: string;
  date: Date;
  merchantId?: string;
  resultCount?: number;
  clicked?: boolean;
  purchased?: boolean;
  revenue?: number;
}): Promise<void> {
  const now = new Date().toISOString();
  const normalized = data.query.toLowerCase().trim();

  await query(
    `INSERT INTO "analyticsSearchQuery" (
      "merchantId", "query", "queryNormalized", "date",
      "searchCount", "resultCount", "isZeroResult",
      "clickCount", "purchaseCount", "revenue",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT ("merchantId", "queryNormalized", "date") DO UPDATE SET
      "searchCount" = "analyticsSearchQuery"."searchCount" + 1,
      "clickCount" = "analyticsSearchQuery"."clickCount" + EXCLUDED."clickCount",
      "purchaseCount" = "analyticsSearchQuery"."purchaseCount" + EXCLUDED."purchaseCount",
      "revenue" = "analyticsSearchQuery"."revenue" + EXCLUDED."revenue",
      "updatedAt" = $11`,
    [
      data.merchantId,
      data.query,
      normalized,
      data.date,
      data.resultCount || 0,
      (data.resultCount || 0) === 0,
      data.clicked ? 1 : 0,
      data.purchased ? 1 : 0,
      data.revenue || 0,
      now,
      now,
    ],
  );
}

// ============================================================================
// Customer Cohorts
// ============================================================================

export async function getCustomerCohorts(startMonth?: Date, endMonth?: Date): Promise<CustomerCohort[]> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (startMonth) {
    whereClause += ` AND "cohortMonth" >= $${paramIndex++}`;
    params.push(startMonth);
  }
  if (endMonth) {
    whereClause += ` AND "cohortMonth" <= $${paramIndex++}`;
    params.push(endMonth);
  }

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "analyticsCustomerCohort" WHERE ${whereClause} 
     ORDER BY "cohortMonth" DESC, "monthNumber" ASC`,
    params,
  );

  return (rows || []).map(mapToCustomerCohort);
}

// ============================================================================
// Mappers
// ============================================================================

function mapToSalesDaily(row: Record<string, any>): SalesDaily {
  return {
    analyticsSalesDailyId: row.analyticsSalesDailyId,
    merchantId: row.merchantId,
    date: new Date(row.date),
    channel: row.channel,
    currency: row.currency,
    orderCount: parseInt(row.orderCount) || 0,
    itemsSold: parseInt(row.itemsSold) || 0,
    grossRevenue: parseFloat(row.grossRevenue) || 0,
    discountTotal: parseFloat(row.discountTotal) || 0,
    refundTotal: parseFloat(row.refundTotal) || 0,
    netRevenue: parseFloat(row.netRevenue) || 0,
    taxTotal: parseFloat(row.taxTotal) || 0,
    shippingRevenue: parseFloat(row.shippingRevenue) || 0,
    averageOrderValue: parseFloat(row.averageOrderValue) || 0,
    newCustomers: parseInt(row.newCustomers) || 0,
    returningCustomers: parseInt(row.returningCustomers) || 0,
    guestOrders: parseInt(row.guestOrders) || 0,
    cartCreated: parseInt(row.cartCreated) || 0,
    cartAbandoned: parseInt(row.cartAbandoned) || 0,
    checkoutStarted: parseInt(row.checkoutStarted) || 0,
    checkoutCompleted: parseInt(row.checkoutCompleted) || 0,
    conversionRate: parseFloat(row.conversionRate) || 0,
    paymentSuccessCount: parseInt(row.paymentSuccessCount) || 0,
    paymentFailedCount: parseInt(row.paymentFailedCount) || 0,
    paymentSuccessRate: parseFloat(row.paymentSuccessRate) || 0,
    computedAt: row.computedAt ? new Date(row.computedAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToProductPerformance(row: Record<string, any>): ProductPerformance {
  return {
    analyticsProductPerformanceId: row.analyticsProductPerformanceId,
    productId: row.productId,
    productVariantId: row.productVariantId,
    date: new Date(row.date),
    channel: row.channel,
    views: parseInt(row.views) || 0,
    uniqueViews: parseInt(row.uniqueViews) || 0,
    detailViews: parseInt(row.detailViews) || 0,
    addToCarts: parseInt(row.addToCarts) || 0,
    removeFromCarts: parseInt(row.removeFromCarts) || 0,
    viewToCartRate: parseFloat(row.viewToCartRate) || 0,
    purchases: parseInt(row.purchases) || 0,
    quantitySold: parseInt(row.quantitySold) || 0,
    revenue: parseFloat(row.revenue) || 0,
    averagePrice: parseFloat(row.averagePrice) || 0,
    cartToOrderRate: parseFloat(row.cartToOrderRate) || 0,
    returns: parseInt(row.returns) || 0,
    returnQuantity: parseInt(row.returnQuantity) || 0,
    returnRate: parseFloat(row.returnRate) || 0,
    reviews: parseInt(row.reviews) || 0,
    averageRating: row.averageRating ? parseFloat(row.averageRating) : undefined,
    stockAlerts: parseInt(row.stockAlerts) || 0,
    outOfStockViews: parseInt(row.outOfStockViews) || 0,
    computedAt: row.computedAt ? new Date(row.computedAt) : undefined,
    createdAt: new Date(row.createdAt),
  };
}

function mapToSearchQuery(row: Record<string, any>): SearchQuery {
  return {
    analyticsSearchQueryId: row.analyticsSearchQueryId,
    merchantId: row.merchantId,
    query: row.query,
    queryNormalized: row.queryNormalized,
    date: new Date(row.date),
    searchCount: parseInt(row.searchCount) || 0,
    uniqueSearchers: parseInt(row.uniqueSearchers) || 0,
    resultCount: parseInt(row.resultCount) || 0,
    isZeroResult: Boolean(row.isZeroResult),
    clickCount: parseInt(row.clickCount) || 0,
    clickThroughRate: parseFloat(row.clickThroughRate) || 0,
    averageClickPosition: parseInt(row.averageClickPosition) || 0,
    addToCartCount: parseInt(row.addToCartCount) || 0,
    purchaseCount: parseInt(row.purchaseCount) || 0,
    conversionRate: parseFloat(row.conversionRate) || 0,
    revenue: parseFloat(row.revenue) || 0,
    refinementCount: parseInt(row.refinementCount) || 0,
    exitCount: parseInt(row.exitCount) || 0,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToCustomerCohort(row: Record<string, any>): CustomerCohort {
  return {
    analyticsCustomerCohortId: row.analyticsCustomerCohortId,
    merchantId: row.merchantId,
    cohortMonth: new Date(row.cohortMonth),
    monthNumber: parseInt(row.monthNumber) || 0,
    customersInCohort: parseInt(row.customersInCohort) || 0,
    activeCustomers: parseInt(row.activeCustomers) || 0,
    retentionRate: parseFloat(row.retentionRate) || 0,
    revenue: parseFloat(row.revenue) || 0,
    orders: parseInt(row.orders) || 0,
    averageOrderValue: parseFloat(row.averageOrderValue) || 0,
    lifetimeValue: parseFloat(row.lifetimeValue) || 0,
    repeatPurchasers: parseInt(row.repeatPurchasers) || 0,
    repeatPurchaseRate: parseFloat(row.repeatPurchaseRate) || 0,
    averageOrdersPerCustomer: parseFloat(row.averageOrdersPerCustomer) || 0,
    computedAt: row.computedAt ? new Date(row.computedAt) : undefined,
    createdAt: new Date(row.createdAt),
  };
}
