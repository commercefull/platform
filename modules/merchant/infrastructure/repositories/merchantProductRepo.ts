import { query, queryOne } from '../../../../libs/db';

export interface MerchantProduct {
  merchantProductId: string;
  merchantId: string;
  productId: string;
  price?: number;
  currency?: string;
  stock?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export async function findByMerchant(merchantId: string, limit = 20, offset = 0): Promise<MerchantProduct[]> {
  return (await query<MerchantProduct[]>(
    `SELECT * FROM "merchantProduct" WHERE "merchantId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
    [merchantId, limit, offset],
  )) || [];
}

export async function findByProduct(productId: string): Promise<MerchantProduct[]> {
  return (await query<MerchantProduct[]>(
    `SELECT * FROM "merchantProduct" WHERE "productId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" ASC`,
    [productId],
  )) || [];
}

export async function create(params: Omit<MerchantProduct, 'merchantProductId' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<MerchantProduct | null> {
  const now = new Date();
  return queryOne<MerchantProduct>(
    `INSERT INTO "merchantProduct" ("merchantId", "productId", price, currency, stock, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [params.merchantId, params.productId, params.price || null, params.currency || null, params.stock || null, params.isActive ?? true, now, now],
  );
}

export async function update(merchantProductId: string, params: Partial<Omit<MerchantProduct, 'merchantProductId' | 'merchantId' | 'productId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<MerchantProduct | null> {
  const now = new Date();
  const fields: string[] = ['"updatedAt" = $1'];
  const values: unknown[] = [now];
  let idx = 2;

  if (params.price !== undefined) { fields.push(`price = $${idx++}`); values.push(params.price); }
  if (params.currency !== undefined) { fields.push(`currency = $${idx++}`); values.push(params.currency); }
  if (params.stock !== undefined) { fields.push(`stock = $${idx++}`); values.push(params.stock); }
  if (params.isActive !== undefined) { fields.push(`"isActive" = $${idx++}`); values.push(params.isActive); }

  values.push(merchantProductId);
  return queryOne<MerchantProduct>(
    `UPDATE "merchantProduct" SET ${fields.join(', ')} WHERE "merchantProductId" = $${idx} RETURNING *`,
    values,
  );
}

export async function softDelete(merchantProductId: string): Promise<void> {
  await query(
    `UPDATE "merchantProduct" SET "deletedAt" = $1, "updatedAt" = $2 WHERE "merchantProductId" = $3`,
    [new Date(), new Date(), merchantProductId],
  );
}

export default { findByMerchant, findByProduct, create, update, softDelete };
