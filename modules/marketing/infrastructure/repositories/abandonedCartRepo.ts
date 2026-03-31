import { query, queryOne } from '../../../../libs/db';

export interface MarketingAbandonedCart {
  marketingAbandonedCartId: string;
  basketId: string;
  customerId?: string;
  email?: string;
  cartValue: number;
  currency: string;
  status: string;
  recoveredAt?: Date;
  recoveredOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingAbandonedCartEmail {
  marketingAbandonedCartEmailId: string;
  abandonedCartId: string;
  emailNumber: number;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  status: string;
  createdAt: Date;
}

export async function create(params: Omit<MarketingAbandonedCart, 'marketingAbandonedCartId' | 'createdAt' | 'updatedAt'>): Promise<MarketingAbandonedCart | null> {
  const now = new Date();
  return queryOne<MarketingAbandonedCart>(
    `INSERT INTO "marketingAbandonedCart" ("basketId", "customerId", email, "cartValue", currency, status, "recoveredAt", "recoveredOrderId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [params.basketId, params.customerId || null, params.email || null, params.cartValue, params.currency, params.status, params.recoveredAt || null, params.recoveredOrderId || null, now, now],
  );
}

export async function findPendingRecovery(limit = 100): Promise<MarketingAbandonedCart[]> {
  return (await query<MarketingAbandonedCart[]>(
    `SELECT * FROM "marketingAbandonedCart" WHERE status = 'abandoned' AND email IS NOT NULL ORDER BY "createdAt" ASC LIMIT $1`,
    [limit],
  )) || [];
}

export async function markRecovered(id: string, orderId: string): Promise<void> {
  const now = new Date();
  await query(`UPDATE "marketingAbandonedCart" SET status = 'recovered', "recoveredAt" = $1, "recoveredOrderId" = $2, "updatedAt" = $3 WHERE "marketingAbandonedCartId" = $4`, [now, orderId, now, id]);
}

export async function logEmail(abandonedCartId: string, emailNumber: number): Promise<MarketingAbandonedCartEmail | null> {
  return queryOne<MarketingAbandonedCartEmail>(
    `INSERT INTO "marketingAbandonedCartEmail" ("abandonedCartId", "emailNumber", status, "createdAt") VALUES ($1, $2, 'sent', $3) RETURNING *`,
    [abandonedCartId, emailNumber, new Date()],
  );
}

export default { create, findPendingRecovery, markRecovered, logEmail };
