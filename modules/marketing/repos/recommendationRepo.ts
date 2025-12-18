/**
 * Product Recommendation Repository
 * Handles CRUD operations for product recommendations
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export type RecommendationType = 
  | 'frequently_bought_together' 
  | 'similar_products' 
  | 'customers_also_viewed'
  | 'customers_also_bought'
  | 'trending' 
  | 'personalized' 
  | 'manual'
  | 'cross_sell'
  | 'upsell';

export interface ProductRecommendation {
  productRecommendationId: string;
  productId: string;
  recommendedProductId: string;
  recommendationType: RecommendationType;
  score: number;
  rank?: number;
  purchaseCount: number;
  viewCount: number;
  clickCount: number;
  conversionRate: number;
  isActive: boolean;
  isManual: boolean;
  computedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProductView {
  customerProductViewId: string;
  customerId?: string;
  sessionId?: string;
  productId: string;
  productVariantId?: string;
  source?: string;
  referrer?: string;
  viewDurationSeconds?: number;
  scrollDepthPercent?: number;
  addedToCart: boolean;
  purchased: boolean;
  deviceType?: string;
  country?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  viewedAt: Date;
}

// ============================================================================
// Product Recommendations CRUD
// ============================================================================

export async function getRecommendation(productRecommendationId: string): Promise<ProductRecommendation | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "marketingProductRecommendation" WHERE "productRecommendationId" = $1',
    [productRecommendationId]
  );
  return row ? mapToRecommendation(row) : null;
}

export async function getRecommendationsForProduct(
  productId: string,
  type?: RecommendationType,
  limit: number = 10
): Promise<ProductRecommendation[]> {
  let whereClause = '"productId" = $1 AND "isActive" = true';
  const params: any[] = [productId];
  let paramIndex = 2;

  if (type) {
    whereClause += ` AND "recommendationType" = $${paramIndex++}`;
    params.push(type);
  }

  params.push(limit);

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "marketingProductRecommendation" 
     WHERE ${whereClause}
     ORDER BY "score" DESC, "rank" ASC NULLS LAST
     LIMIT $${paramIndex}`,
    params
  );

  return (rows || []).map(mapToRecommendation);
}

export async function getFrequentlyBoughtTogether(productId: string, limit: number = 5): Promise<ProductRecommendation[]> {
  return getRecommendationsForProduct(productId, 'frequently_bought_together', limit);
}

export async function getSimilarProducts(productId: string, limit: number = 10): Promise<ProductRecommendation[]> {
  return getRecommendationsForProduct(productId, 'similar_products', limit);
}

export async function getCrossSellProducts(productId: string, limit: number = 5): Promise<ProductRecommendation[]> {
  return getRecommendationsForProduct(productId, 'cross_sell', limit);
}

export async function getUpsellProducts(productId: string, limit: number = 5): Promise<ProductRecommendation[]> {
  return getRecommendationsForProduct(productId, 'upsell', limit);
}

export async function saveRecommendation(rec: Partial<ProductRecommendation> & {
  productId: string;
  recommendedProductId: string;
  recommendationType: RecommendationType;
}): Promise<ProductRecommendation> {
  const now = new Date().toISOString();

  // Use upsert to handle duplicates
  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "marketingProductRecommendation" (
      "productId", "recommendedProductId", "recommendationType", "score", "rank",
      "purchaseCount", "viewCount", "clickCount", "conversionRate", "isActive", "isManual",
      "computedAt", "expiresAt", "metadata", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT ("productId", "recommendedProductId", "recommendationType") 
    DO UPDATE SET
      "score" = EXCLUDED."score",
      "rank" = EXCLUDED."rank",
      "purchaseCount" = EXCLUDED."purchaseCount",
      "viewCount" = EXCLUDED."viewCount",
      "clickCount" = EXCLUDED."clickCount",
      "conversionRate" = EXCLUDED."conversionRate",
      "isActive" = EXCLUDED."isActive",
      "computedAt" = EXCLUDED."computedAt",
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING *`,
    [
      rec.productId, rec.recommendedProductId, rec.recommendationType,
      rec.score || 0, rec.rank, rec.purchaseCount || 0, rec.viewCount || 0,
      rec.clickCount || 0, rec.conversionRate || 0, rec.isActive !== false,
      rec.isManual || false, rec.computedAt?.toISOString() || now,
      rec.expiresAt?.toISOString(), rec.metadata ? JSON.stringify(rec.metadata) : null,
      now, now
    ]
  );

  return mapToRecommendation(result!);
}

export async function deleteRecommendation(productRecommendationId: string): Promise<void> {
  await query(
    'DELETE FROM "marketingProductRecommendation" WHERE "productRecommendationId" = $1',
    [productRecommendationId]
  );
}

export async function deactivateRecommendation(productRecommendationId: string): Promise<void> {
  await query(
    'UPDATE "marketingProductRecommendation" SET "isActive" = false, "updatedAt" = $1 WHERE "productRecommendationId" = $2',
    [new Date().toISOString(), productRecommendationId]
  );
}

export async function incrementClickCount(productRecommendationId: string): Promise<void> {
  await query(
    `UPDATE "marketingProductRecommendation" SET 
      "clickCount" = "clickCount" + 1, 
      "updatedAt" = $1 
     WHERE "productRecommendationId" = $2`,
    [new Date().toISOString(), productRecommendationId]
  );
}

export async function incrementPurchaseCount(productId: string, recommendedProductId: string): Promise<void> {
  await query(
    `UPDATE "marketingProductRecommendation" SET 
      "purchaseCount" = "purchaseCount" + 1,
      "conversionRate" = CASE WHEN "clickCount" > 0 THEN ("purchaseCount" + 1)::decimal / "clickCount" ELSE 0 END,
      "updatedAt" = $1 
     WHERE "productId" = $2 AND "recommendedProductId" = $3`,
    [new Date().toISOString(), productId, recommendedProductId]
  );
}

// ============================================================================
// Customer Product Views
// ============================================================================

export async function recordProductView(view: {
  customerId?: string;
  sessionId?: string;
  productId: string;
  productVariantId?: string;
  source?: string;
  referrer?: string;
  deviceType?: string;
  country?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<CustomerProductView> {
  const now = new Date().toISOString();

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "customerProductView" (
      "customerId", "sessionId", "productId", "productVariantId", "source", "referrer",
      "deviceType", "country", "ipAddress", "userAgent", "viewedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      view.customerId, view.sessionId, view.productId, view.productVariantId,
      view.source, view.referrer, view.deviceType, view.country,
      view.ipAddress, view.userAgent, now
    ]
  );

  return mapToProductView(result!);
}

export async function updateProductView(
  customerProductViewId: string,
  updates: { viewDurationSeconds?: number; scrollDepthPercent?: number; addedToCart?: boolean; purchased?: boolean }
): Promise<void> {
  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (updates.viewDurationSeconds !== undefined) {
    setClauses.push(`"viewDurationSeconds" = $${paramIndex++}`);
    params.push(updates.viewDurationSeconds);
  }
  if (updates.scrollDepthPercent !== undefined) {
    setClauses.push(`"scrollDepthPercent" = $${paramIndex++}`);
    params.push(updates.scrollDepthPercent);
  }
  if (updates.addedToCart !== undefined) {
    setClauses.push(`"addedToCart" = $${paramIndex++}`);
    params.push(updates.addedToCart);
  }
  if (updates.purchased !== undefined) {
    setClauses.push(`"purchased" = $${paramIndex++}`);
    params.push(updates.purchased);
  }

  if (setClauses.length > 0) {
    params.push(customerProductViewId);
    await query(
      `UPDATE "customerProductView" SET ${setClauses.join(', ')} WHERE "customerProductViewId" = $${paramIndex}`,
      params
    );
  }
}

export async function getRecentlyViewedProducts(
  customerId?: string,
  sessionId?: string,
  limit: number = 10
): Promise<CustomerProductView[]> {
  if (!customerId && !sessionId) return [];

  let whereClause = '';
  const params: any[] = [];

  if (customerId) {
    whereClause = '"customerId" = $1';
    params.push(customerId);
  } else {
    whereClause = '"sessionId" = $1';
    params.push(sessionId);
  }

  params.push(limit);

  const rows = await query<Record<string, any>[]>(
    `SELECT DISTINCT ON ("productId") * FROM "customerProductView"
     WHERE ${whereClause}
     ORDER BY "productId", "viewedAt" DESC
     LIMIT $2`,
    params
  );

  return (rows || []).map(mapToProductView);
}

export async function getProductViewStats(productId: string, days: number = 30): Promise<{
  totalViews: number;
  uniqueViewers: number;
  addToCartRate: number;
  purchaseRate: number;
  avgViewDuration: number;
}> {
  const result = await queryOne<Record<string, any>>(
    `SELECT 
      COUNT(*) as "totalViews",
      COUNT(DISTINCT COALESCE("customerId"::text, "sessionId")) as "uniqueViewers",
      COUNT(*) FILTER (WHERE "addedToCart" = true) as "addedToCartCount",
      COUNT(*) FILTER (WHERE "purchased" = true) as "purchasedCount",
      COALESCE(AVG("viewDurationSeconds"), 0) as "avgViewDuration"
    FROM "customerProductView"
    WHERE "productId" = $1 AND "viewedAt" >= NOW() - INTERVAL '${days} days'`,
    [productId]
  );

  const totalViews = parseInt(result?.totalViews || '0');
  const addedToCartCount = parseInt(result?.addedToCartCount || '0');
  const purchasedCount = parseInt(result?.purchasedCount || '0');

  return {
    totalViews,
    uniqueViewers: parseInt(result?.uniqueViewers || '0'),
    addToCartRate: totalViews > 0 ? (addedToCartCount / totalViews) * 100 : 0,
    purchaseRate: totalViews > 0 ? (purchasedCount / totalViews) * 100 : 0,
    avgViewDuration: parseFloat(result?.avgViewDuration || '0')
  };
}

// ============================================================================
// Recommendation Computation Helpers
// ============================================================================

export async function computeFrequentlyBoughtTogether(minPurchases: number = 3): Promise<number> {
  // Find products frequently purchased together in the same order
  const result = await query<Record<string, any>[]>(
    `WITH order_pairs AS (
      SELECT 
        oi1."productId" as product1,
        oi2."productId" as product2,
        COUNT(DISTINCT oi1."orderId") as purchase_count
      FROM "orderItem" oi1
      JOIN "orderItem" oi2 ON oi1."orderId" = oi2."orderId" AND oi1."productId" < oi2."productId"
      GROUP BY oi1."productId", oi2."productId"
      HAVING COUNT(DISTINCT oi1."orderId") >= $1
    )
    INSERT INTO "marketingProductRecommendation" (
      "productId", "recommendedProductId", "recommendationType", "score", "purchaseCount",
      "isActive", "computedAt", "createdAt", "updatedAt"
    )
    SELECT 
      product1, product2, 'frequently_bought_together', 
      purchase_count::decimal / (SELECT MAX(purchase_count) FROM order_pairs),
      purchase_count, true, NOW(), NOW(), NOW()
    FROM order_pairs
    UNION ALL
    SELECT 
      product2, product1, 'frequently_bought_together',
      purchase_count::decimal / (SELECT MAX(purchase_count) FROM order_pairs),
      purchase_count, true, NOW(), NOW(), NOW()
    FROM order_pairs
    ON CONFLICT ("productId", "recommendedProductId", "recommendationType")
    DO UPDATE SET
      "score" = EXCLUDED."score",
      "purchaseCount" = EXCLUDED."purchaseCount",
      "computedAt" = NOW(),
      "updatedAt" = NOW()
    RETURNING "productRecommendationId"`,
    [minPurchases]
  );

  return result?.length || 0;
}

export async function computeCustomersAlsoViewed(minViews: number = 5): Promise<number> {
  // Find products viewed by the same customers
  const result = await query<Record<string, any>[]>(
    `WITH view_pairs AS (
      SELECT 
        v1."productId" as product1,
        v2."productId" as product2,
        COUNT(DISTINCT v1."customerId") as view_count
      FROM "customerProductView" v1
      JOIN "customerProductView" v2 ON v1."customerId" = v2."customerId" 
        AND v1."productId" < v2."productId"
        AND v1."customerId" IS NOT NULL
      GROUP BY v1."productId", v2."productId"
      HAVING COUNT(DISTINCT v1."customerId") >= $1
    )
    INSERT INTO "marketingProductRecommendation" (
      "productId", "recommendedProductId", "recommendationType", "score", "viewCount",
      "isActive", "computedAt", "createdAt", "updatedAt"
    )
    SELECT 
      product1, product2, 'customers_also_viewed',
      view_count::decimal / (SELECT MAX(view_count) FROM view_pairs),
      view_count, true, NOW(), NOW(), NOW()
    FROM view_pairs
    UNION ALL
    SELECT 
      product2, product1, 'customers_also_viewed',
      view_count::decimal / (SELECT MAX(view_count) FROM view_pairs),
      view_count, true, NOW(), NOW(), NOW()
    FROM view_pairs
    ON CONFLICT ("productId", "recommendedProductId", "recommendationType")
    DO UPDATE SET
      "score" = EXCLUDED."score",
      "viewCount" = EXCLUDED."viewCount",
      "computedAt" = NOW(),
      "updatedAt" = NOW()
    RETURNING "productRecommendationId"`,
    [minViews]
  );

  return result?.length || 0;
}

// ============================================================================
// Helpers
// ============================================================================

function mapToRecommendation(row: Record<string, any>): ProductRecommendation {
  return {
    productRecommendationId: row.productRecommendationId,
    productId: row.productId,
    recommendedProductId: row.recommendedProductId,
    recommendationType: row.recommendationType,
    score: parseFloat(row.score) || 0,
    rank: row.rank ? parseInt(row.rank) : undefined,
    purchaseCount: parseInt(row.purchaseCount) || 0,
    viewCount: parseInt(row.viewCount) || 0,
    clickCount: parseInt(row.clickCount) || 0,
    conversionRate: parseFloat(row.conversionRate) || 0,
    isActive: Boolean(row.isActive),
    isManual: Boolean(row.isManual),
    computedAt: row.computedAt ? new Date(row.computedAt) : undefined,
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToProductView(row: Record<string, any>): CustomerProductView {
  return {
    customerProductViewId: row.customerProductViewId,
    customerId: row.customerId,
    sessionId: row.sessionId,
    productId: row.productId,
    productVariantId: row.productVariantId,
    source: row.source,
    referrer: row.referrer,
    viewDurationSeconds: row.viewDurationSeconds ? parseInt(row.viewDurationSeconds) : undefined,
    scrollDepthPercent: row.scrollDepthPercent ? parseInt(row.scrollDepthPercent) : undefined,
    addedToCart: Boolean(row.addedToCart),
    purchased: Boolean(row.purchased),
    deviceType: row.deviceType,
    country: row.country,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    metadata: row.metadata,
    viewedAt: new Date(row.viewedAt)
  };
}
