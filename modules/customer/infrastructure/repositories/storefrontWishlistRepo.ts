import { query, queryOne } from '../../../../libs/db';

export interface WishlistItem {
  wishlistItemId: string;
  customerId: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByCustomer(customerId: string): Promise<unknown[]> {
  const results = await query<unknown[]>(
    `SELECT w.*, p."name", p."price", p."sku", p."status",
            pm."url" as "imageUrl"
     FROM "wishlistItem" w
     JOIN "product" p ON w."productId" = p."productId"
     LEFT JOIN "productMedia" pm ON p."productId" = pm."productId" AND pm."isPrimary" = true
     WHERE w."customerId" = $1
     ORDER BY w."createdAt" DESC`,
    [customerId],
  );
  return results || [];
}

export async function findExisting(customerId: string, productId: string): Promise<WishlistItem | null> {
  return await queryOne<WishlistItem>(
    `SELECT "wishlistItemId" FROM "wishlistItem" WHERE "customerId" = $1 AND "productId" = $2`,
    [customerId, productId],
  );
}

export async function create(customerId: string, productId: string): Promise<WishlistItem | null> {
  return await queryOne<WishlistItem>(
    `INSERT INTO "wishlistItem" ("customerId", "productId", "createdAt", "updatedAt")
     VALUES ($1, $2, NOW(), NOW()) RETURNING "wishlistItemId"`,
    [customerId, productId],
  );
}

export async function remove(customerId: string, productId: string): Promise<WishlistItem | null> {
  return await queryOne<WishlistItem>(
    `DELETE FROM "wishlistItem" WHERE "customerId" = $1 AND "productId" = $2 RETURNING "wishlistItemId"`,
    [customerId, productId],
  );
}

export default { findByCustomer, findExisting, create, remove };
