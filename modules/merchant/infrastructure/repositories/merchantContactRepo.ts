import { query, queryOne } from '../../../../libs/db';

export interface MerchantContact {
  merchantContactId: string;
  merchantId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export async function findByMerchant(merchantId: string): Promise<MerchantContact[]> {
  return (await query<MerchantContact[]>(
    `SELECT * FROM "merchantContact" WHERE "merchantId" = $1 AND "deletedAt" IS NULL ORDER BY "isPrimary" DESC, "createdAt" ASC`,
    [merchantId],
  )) || [];
}

export async function create(params: Omit<MerchantContact, 'merchantContactId' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<MerchantContact | null> {
  const now = new Date();
  return queryOne<MerchantContact>(
    `INSERT INTO "merchantContact" ("merchantId", name, role, email, phone, "isPrimary", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [params.merchantId, params.name, params.role || null, params.email || null, params.phone || null, params.isPrimary ?? false, now, now],
  );
}

export async function softDelete(merchantContactId: string): Promise<void> {
  await query(
    `UPDATE "merchantContact" SET "deletedAt" = $1, "updatedAt" = $2 WHERE "merchantContactId" = $3`,
    [new Date(), new Date(), merchantContactId],
  );
}

export default { findByMerchant, create, softDelete };
