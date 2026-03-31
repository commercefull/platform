import { query, queryOne } from '../../../../libs/db';

export interface Referral {
  referralId: string;
  referrerId: string;
  referredId?: string;
  referredEmail: string;
  code: string;
  status: string;
  convertedAt?: Date;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralReward {
  referralRewardId: string;
  referralId: string;
  recipientId: string;
  recipientType: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  awardedAt?: Date;
  createdAt: Date;
}

export async function findByCode(code: string): Promise<Referral | null> {
  return queryOne<Referral>(`SELECT * FROM "referral" WHERE code = $1`, [code]);
}

export async function create(referrerId: string, referredEmail: string, code: string): Promise<Referral | null> {
  const now = new Date();
  return queryOne<Referral>(
    `INSERT INTO "referral" ("referrerId", "referredEmail", code, status, "createdAt", "updatedAt") VALUES ($1, $2, $3, 'pending', $4, $5) RETURNING *`,
    [referrerId, referredEmail, code, now, now],
  );
}

export async function convert(referralId: string, referredId: string, orderId: string): Promise<void> {
  const now = new Date();
  await query(`UPDATE "referral" SET status = 'converted', "referredId" = $1, "orderId" = $2, "convertedAt" = $3, "updatedAt" = $4 WHERE "referralId" = $5`, [referredId, orderId, now, now, referralId]);
}

export async function createReward(params: Omit<ReferralReward, 'referralRewardId' | 'createdAt'>): Promise<ReferralReward | null> {
  return queryOne<ReferralReward>(
    `INSERT INTO "referralReward" ("referralId", "recipientId", "recipientType", type, amount, currency, status, "awardedAt", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [params.referralId, params.recipientId, params.recipientType, params.type, params.amount, params.currency, params.status, params.awardedAt || null, new Date()],
  );
}

export async function findByReferrer(referrerId: string): Promise<Referral[]> {
  return (await query<Referral[]>(`SELECT * FROM "referral" WHERE "referrerId" = $1 ORDER BY "createdAt" DESC`, [referrerId])) || [];
}

export default { findByCode, create, convert, createReward, findByReferrer };
