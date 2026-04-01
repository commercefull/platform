/**
 * B2B Price List Item Repository
 * Table: b2bPriceListItem
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export interface B2bPriceListItem {
  b2bPriceListItemId: string;
  b2bPriceListId: string;
  productId: string;
  productVariantId?: string;
  price: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Functions
// ============================================================================

export async function findByPriceList(b2bPriceListId: string): Promise<B2bPriceListItem[]> {
  return (
    (await query<B2bPriceListItem[]>(
      `SELECT * FROM "b2bPriceListItem" WHERE "b2bPriceListId" = $1 ORDER BY "createdAt" ASC`,
      [b2bPriceListId],
    )) ?? []
  );
}

export async function findByProduct(productId: string): Promise<B2bPriceListItem[]> {
  return (
    (await query<B2bPriceListItem[]>(
      `SELECT * FROM "b2bPriceListItem" WHERE "productId" = $1 ORDER BY "createdAt" ASC`,
      [productId],
    )) ?? []
  );
}

export async function create(data: {
  b2bPriceListId: string;
  productId: string;
  productVariantId?: string;
  price: number;
  currency?: string;
}): Promise<B2bPriceListItem> {
  const now = new Date().toISOString();
  return queryOne<B2bPriceListItem>(
    `INSERT INTO "b2bPriceListItem" ("b2bPriceListId", "productId", "productVariantId", "price", "currency", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $6)
     RETURNING *`,
    [
      data.b2bPriceListId,
      data.productId,
      data.productVariantId ?? null,
      data.price,
      data.currency ?? 'USD',
      now,
    ],
  ) as Promise<B2bPriceListItem>;
}

export async function update(
  b2bPriceListItemId: string,
  data: { price?: number; currency?: string },
): Promise<B2bPriceListItem | null> {
  const now = new Date().toISOString();
  return queryOne<B2bPriceListItem>(
    `UPDATE "b2bPriceListItem"
     SET "price"     = COALESCE($1, "price"),
         "currency"  = COALESCE($2, "currency"),
         "updatedAt" = $3
     WHERE "b2bPriceListItemId" = $4
     RETURNING *`,
    [data.price ?? null, data.currency ?? null, now, b2bPriceListItemId],
  );
}

export async function deleteItem(b2bPriceListItemId: string): Promise<void> {
  await query(`DELETE FROM "b2bPriceListItem" WHERE "b2bPriceListItemId" = $1`, [b2bPriceListItemId]);
}
