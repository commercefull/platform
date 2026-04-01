import { query, queryOne } from '../../../../libs/db';

export interface MerchantFollower {
  merchantFollowerId: string;
  merchantId: string;
  customerId: string;
  createdAt: Date;
}

export async function findByMerchant(merchantId: string, limit = 20, offset = 0): Promise<MerchantFollower[]> {
  return (await query<MerchantFollower[]>(
    `SELECT * FROM "merchantFollower" WHERE "merchantId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
    [merchantId, limit, offset],
  )) || [];
}

export async function findByCustomer(customerId: string): Promise<MerchantFollower[]> {
  return (await query<MerchantFollower[]>(
    `SELECT * FROM "merchantFollower" WHERE "customerId" = $1 ORDER BY "createdAt" DESC`,
    [customerId],
  )) || [];
}

export async function create(merchantId: string, customerId: string): Promise<MerchantFollower | null> {
  return queryOne<MerchantFollower>(
    `INSERT INTO "merchantFollower" ("merchantId", "customerId", "createdAt")
     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *`,
    [merchantId, customerId, new Date()],
  );
}

export async function deleteMerchantFollower(merchantId: string, customerId: string): Promise<void> {
  await query(
    `DELETE FROM "merchantFollower" WHERE "merchantId" = $1 AND "customerId" = $2`,
    [merchantId, customerId],
  );
}

export default { findByMerchant, findByCustomer, create, delete: deleteMerchantFollower };
