import { query, queryOne } from '../../../../libs/db';

export interface MerchantProductVariant {
  merchantProductVariantId: string;
  merchantProductId: string;
  variantId: string;
  price?: number;
  stock?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchantProduct(merchantProductId: string): Promise<MerchantProductVariant[]> {
  return (await query<MerchantProductVariant[]>(
    `SELECT * FROM "merchantProductVariant" WHERE "merchantProductId" = $1 ORDER BY "createdAt" ASC`,
    [merchantProductId],
  )) || [];
}

export async function create(params: Omit<MerchantProductVariant, 'merchantProductVariantId' | 'createdAt' | 'updatedAt'>): Promise<MerchantProductVariant | null> {
  const now = new Date();
  return queryOne<MerchantProductVariant>(
    `INSERT INTO "merchantProductVariant" ("merchantProductId", "variantId", price, stock, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [params.merchantProductId, params.variantId, params.price || null, params.stock || null, params.isActive ?? true, now, now],
  );
}

export async function update(merchantProductVariantId: string, params: Partial<Omit<MerchantProductVariant, 'merchantProductVariantId' | 'merchantProductId' | 'variantId' | 'createdAt' | 'updatedAt'>>): Promise<MerchantProductVariant | null> {
  const now = new Date();
  const fields: string[] = ['"updatedAt" = $1'];
  const values: unknown[] = [now];
  let idx = 2;

  if (params.price !== undefined) { fields.push(`price = $${idx++}`); values.push(params.price); }
  if (params.stock !== undefined) { fields.push(`stock = $${idx++}`); values.push(params.stock); }
  if (params.isActive !== undefined) { fields.push(`"isActive" = $${idx++}`); values.push(params.isActive); }

  values.push(merchantProductVariantId);
  return queryOne<MerchantProductVariant>(
    `UPDATE "merchantProductVariant" SET ${fields.join(', ')} WHERE "merchantProductVariantId" = $${idx} RETURNING *`,
    values,
  );
}

export default { findByMerchantProduct, create, update };
