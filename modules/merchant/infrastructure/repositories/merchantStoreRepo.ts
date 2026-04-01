import { query, queryOne } from '../../../../libs/db';

export interface MerchantStore {
  merchantStoreId: string;
  merchantId: string;
  storeId: string;
  isActive: boolean;
  createdAt: Date;
}

export async function findByMerchant(merchantId: string): Promise<MerchantStore[]> {
  return (await query<MerchantStore[]>(
    `SELECT * FROM "merchantStore" WHERE "merchantId" = $1 ORDER BY "createdAt" ASC`,
    [merchantId],
  )) || [];
}

export async function findByStore(storeId: string): Promise<MerchantStore[]> {
  return (await query<MerchantStore[]>(
    `SELECT * FROM "merchantStore" WHERE "storeId" = $1 ORDER BY "createdAt" ASC`,
    [storeId],
  )) || [];
}

export async function create(merchantId: string, storeId: string, isActive = true): Promise<MerchantStore | null> {
  return queryOne<MerchantStore>(
    `INSERT INTO "merchantStore" ("merchantId", "storeId", "isActive", "createdAt")
     VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING *`,
    [merchantId, storeId, isActive, new Date()],
  );
}

export async function deleteMerchantStore(merchantId: string, storeId: string): Promise<void> {
  await query(
    `DELETE FROM "merchantStore" WHERE "merchantId" = $1 AND "storeId" = $2`,
    [merchantId, storeId],
  );
}

export default { findByMerchant, findByStore, create, delete: deleteMerchantStore };
