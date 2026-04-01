import { query, queryOne } from '../../../../libs/db';

export interface MerchantReview {
  merchantReviewId: string;
  merchantId: string;
  customerId: string;
  rating: number;
  title?: string;
  body?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(merchantId: string, limit = 20, offset = 0): Promise<MerchantReview[]> {
  return (await query<MerchantReview[]>(
    `SELECT * FROM "merchantReview" WHERE "merchantId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
    [merchantId, limit, offset],
  )) || [];
}

export async function findById(merchantReviewId: string): Promise<MerchantReview | null> {
  return queryOne<MerchantReview>(
    `SELECT * FROM "merchantReview" WHERE "merchantReviewId" = $1`,
    [merchantReviewId],
  );
}

export async function create(params: Omit<MerchantReview, 'merchantReviewId' | 'createdAt' | 'updatedAt'>): Promise<MerchantReview | null> {
  const now = new Date();
  return queryOne<MerchantReview>(
    `INSERT INTO "merchantReview" ("merchantId", "customerId", rating, title, body, status, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [params.merchantId, params.customerId, params.rating, params.title || null, params.body || null, params.status || 'pending', now, now],
  );
}

export async function updateStatus(merchantReviewId: string, status: string): Promise<void> {
  await query(
    `UPDATE "merchantReview" SET status = $1, "updatedAt" = $2 WHERE "merchantReviewId" = $3`,
    [status, new Date(), merchantReviewId],
  );
}

export default { findByMerchant, findById, create, updateStatus };
