import { query, queryOne } from '../../../../libs/db';
import type { CustomerWishlistItem as DbCustomerWishlistItem } from '../../../../libs/db/types';

type WishlistItemRow = DbCustomerWishlistItem & {
  name: string;
  priceCents: number | null;
  salePriceCents: number | null;
  sku: string;
  status: string;
  imageUrl: string | null;
};
import { FailedToCreateCustomerError } from '../../domain/errors/CustomerErrors';
import { WishlistItem } from '../../domain/repositories/StorefrontWishlistRepository';

async function findWishlistId(customerId: string): Promise<string | null> {
  const row = await queryOne<{ customerWishlistId: string }>(
    'SELECT "customerWishlistId" FROM "customerWishlist" WHERE "customerId" = $1 ORDER BY "createdAt" ASC LIMIT 1',
    [customerId],
  );
  return row?.customerWishlistId ?? null;
}

async function findOrCreateWishlistId(customerId: string): Promise<string> {
  const existing = await findWishlistId(customerId);
  if (existing) return existing;

  const created = await queryOne<{ customerWishlistId: string }>(
    `INSERT INTO "customerWishlist" ("customerId", "wishlistName", "isPublic", "createdAt", "updatedAt")
     VALUES ($1, 'Wishlist', false, NOW(), NOW()) RETURNING "customerWishlistId"`,
    [customerId],
  );
  if (!created) throw new FailedToCreateCustomerError('Failed to create default wishlist');
  return created.customerWishlistId;
}

async function findByCustomer(customerId: string): Promise<unknown[]> {
  const results = await query<WishlistItemRow[]>(
    `SELECT w.*, p."name", bp."priceCents", bp."salePriceCents", p."sku", p."status",
            pm."url" as "imageUrl"
     FROM "customerWishlistItem" w
     JOIN "customerWishlist" cw ON w."customerWishlistId" = cw."customerWishlistId"
     JOIN "product" p ON w."productId" = p."productId"
     LEFT JOIN "productBasePrice" bp ON p."productId" = bp."productId" AND bp."currencyCode" = 'USD'
     LEFT JOIN "productMedia" pm ON p."productId" = pm."productId" AND pm."isPrimary" = true
     WHERE cw."customerId" = $1
     ORDER BY w."createdAt" DESC`,
    [customerId],
  );
  return results || [];
}

async function findExisting(customerId: string, productId: string): Promise<WishlistItem | null> {
  const row = await queryOne<{ customerWishlistItemId: string; productId: string; createdAt: Date; updatedAt: Date }>(
    `SELECT w."customerWishlistItemId", w."productId", w."createdAt", w."updatedAt"
     FROM "customerWishlistItem" w
     JOIN "customerWishlist" cw ON w."customerWishlistId" = cw."customerWishlistId"
     WHERE cw."customerId" = $1 AND w."productId" = $2`,
    [customerId, productId],
  );
  return row ? { wishlistItemId: row.customerWishlistItemId, customerId, productId: row.productId, createdAt: row.createdAt, updatedAt: row.updatedAt } : null;
}

async function create(customerId: string, productId: string): Promise<WishlistItem | null> {
  const wishlistId = await findOrCreateWishlistId(customerId);
  const row = await queryOne<{ customerWishlistItemId: string; createdAt: Date; updatedAt: Date }>(
    `INSERT INTO "customerWishlistItem" ("customerWishlistId", "productId", "quantity", "createdAt", "updatedAt")
     VALUES ($1, $2, 1, NOW(), NOW()) RETURNING "customerWishlistItemId", "createdAt", "updatedAt"`,
    [wishlistId, productId],
  );
  return row ? { wishlistItemId: row.customerWishlistItemId, customerId, productId, createdAt: row.createdAt, updatedAt: row.updatedAt } : null;
}

async function remove(customerId: string, productId: string): Promise<WishlistItem | null> {
  const row = await queryOne<{ customerWishlistItemId: string; createdAt: Date; updatedAt: Date }>(
    `DELETE FROM "customerWishlistItem"
     WHERE "customerWishlistId" IN (SELECT "customerWishlistId" FROM "customerWishlist" WHERE "customerId" = $1)
       AND "productId" = $2
     RETURNING "customerWishlistItemId", "createdAt", "updatedAt"`,
    [customerId, productId],
  );
  return row ? { wishlistItemId: row.customerWishlistItemId, customerId, productId, createdAt: row.createdAt, updatedAt: row.updatedAt } : null;
}

export default { findByCustomer, findExisting, create, remove };
