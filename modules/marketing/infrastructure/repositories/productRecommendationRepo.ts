import { query, queryOne } from '../../../../libs/db';

export interface MarketingProductRecommendation {
  marketingProductRecommendationId: string;
  customerId?: string;
  productId: string;
  recommendedProductId: string;
  score: number;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProductView {
  customerProductViewId: string;
  customerId?: string;
  sessionId?: string;
  productId: string;
  viewedAt: Date;
}

export async function findForCustomer(customerId: string, type: string, limit = 10): Promise<MarketingProductRecommendation[]> {
  return (await query<MarketingProductRecommendation[]>(
    `SELECT * FROM "marketingProductRecommendation" WHERE "customerId" = $1 AND type = $2 ORDER BY score DESC LIMIT $3`,
    [customerId, type, limit],
  )) || [];
}

export async function upsert(params: Omit<MarketingProductRecommendation, 'marketingProductRecommendationId' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = new Date();
  await query(
    `INSERT INTO "marketingProductRecommendation" ("customerId", "productId", "recommendedProductId", score, type, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("customerId", "productId", "recommendedProductId", type) DO UPDATE SET score = $4, "updatedAt" = $7`,
    [params.customerId || null, params.productId, params.recommendedProductId, params.score, params.type, now, now],
  );
}

export async function trackView(customerId: string | null, sessionId: string | null, productId: string): Promise<void> {
  await query(
    `INSERT INTO "customerProductView" ("customerId", "sessionId", "productId", "viewedAt") VALUES ($1, $2, $3, $4)`,
    [customerId, sessionId, productId, new Date()],
  );
}

export async function findRecentlyViewed(customerId: string, limit = 10): Promise<CustomerProductView[]> {
  return (await query<CustomerProductView[]>(
    `SELECT DISTINCT ON ("productId") * FROM "customerProductView" WHERE "customerId" = $1 ORDER BY "productId", "viewedAt" DESC LIMIT $2`,
    [customerId, limit],
  )) || [];
}

export default { findForCustomer, upsert, trackView, findRecentlyViewed };
