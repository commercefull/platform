import { query, queryOne } from '../../../../libs/db';
import type { CustomerWishlist as DbCustomerWishlist, CustomerWishlistItem as DbCustomerWishlistItem } from '../../../../libs/db/types';
import { FailedToCreateCustomerError, CustomerWishlistNotFoundError } from '../../domain/errors/CustomerErrors';

export type CustomerWishlist = DbCustomerWishlist;
export type CustomerWishlistItem = DbCustomerWishlistItem;

/** Customer wishlist and wishlist-item persistence. */
export class CustomerWishlistRepo {
  // Customer Wishlist methods
  async findCustomerWishlists(customerId: string): Promise<CustomerWishlist[]> {
    const wishlists = await query<DbCustomerWishlist[]>(
      'SELECT * FROM "customerWishlist" WHERE "customerId" = $1 ORDER BY "createdAt" DESC',
      [customerId],
    );
    return wishlists || [];
  }

  async findCustomerWishlistById(wishlistId: string): Promise<CustomerWishlist | null> {
    return await queryOne<DbCustomerWishlist>('SELECT * FROM "customerWishlist" WHERE "customerWishlistId" = $1', [wishlistId]);
  }

  async createCustomerWishlist(
    wishlist: Omit<CustomerWishlist, 'customerWishlistId' | 'createdAt' | 'updatedAt'>,
  ): Promise<CustomerWishlist> {
    const now = new Date();
    const result = await queryOne<DbCustomerWishlist>(
      `INSERT INTO "customerWishlist" ("customerId", "wishlistName", "isPublic", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [wishlist.customerId, wishlist.wishlistName, wishlist.isPublic, now, now],
    );
    if (!result) throw new FailedToCreateCustomerError('Failed to create wishlist');
    return result;
  }

  async updateCustomerWishlist(wishlistId: string, updates: Partial<CustomerWishlist>): Promise<CustomerWishlist> {
    const existing = await this.findCustomerWishlistById(wishlistId);
    if (!existing) throw new CustomerWishlistNotFoundError(wishlistId);

    const fields = ['wishlistName', 'isPublic'];
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const field of fields) {
      if (updates[field as keyof CustomerWishlist] !== undefined) {
        setClauses.push(`"${field}" = $${paramIndex++}`);
        values.push(updates[field as keyof CustomerWishlist]);
      }
    }

    if (setClauses.length === 0) return existing;

    setClauses.push(`"updatedAt" = $${paramIndex++}`);
    values.push(new Date());
    values.push(wishlistId);

    const result = await queryOne<DbCustomerWishlist>(
      `UPDATE "customerWishlist" SET ${setClauses.join(', ')} WHERE "customerWishlistId" = $${paramIndex} RETURNING *`,
      values,
    );

    if (!result) throw new FailedToCreateCustomerError(`Failed to update wishlist ${wishlistId}`);
    return result;
  }

  async deleteCustomerWishlist(wishlistId: string): Promise<boolean> {
    const result = await queryOne<{ count: string }>(
      `WITH deleted AS (DELETE FROM "customerWishlist" WHERE "customerWishlistId" = $1 RETURNING *) SELECT COUNT(*) as count FROM deleted`,
      [wishlistId],
    );
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Wishlist Item methods
  async findWishlistItems(wishlistId: string): Promise<CustomerWishlistItem[]> {
    const items = await query<DbCustomerWishlistItem[]>(
      'SELECT * FROM "customerWishlistItem" WHERE "customerWishlistId" = $1 ORDER BY "createdAt" DESC',
      [wishlistId],
    );
    return items || [];
  }

  async findWishlistItemById(itemId: string): Promise<CustomerWishlistItem | null> {
    return await queryOne<DbCustomerWishlistItem>('SELECT * FROM "customerWishlistItem" WHERE "customerWishlistItemId" = $1', [itemId]);
  }

  async addItemToWishlist(item: Omit<CustomerWishlistItem, 'customerWishlistItemId'>): Promise<CustomerWishlistItem> {
    const existing = await queryOne<DbCustomerWishlistItem>(
      'SELECT * FROM "customerWishlistItem" WHERE "customerWishlistId" = $1 AND "productId" = $2 AND "productVariantId" IS NOT DISTINCT FROM $3',
      [item.customerWishlistId, item.productId, item.productVariantId],
    );

    if (existing) {
      if (item.note !== existing.note) {
        const updated = await queryOne<DbCustomerWishlistItem>(
          'UPDATE "customerWishlistItem" SET "note" = $1, "updatedAt" = $2 WHERE "customerWishlistItemId" = $3 RETURNING *',
          [item.note, new Date(), existing.customerWishlistItemId],
        );
        return updated || existing;
      }
      return existing;
    }

    const result = await queryOne<DbCustomerWishlistItem>(
      `INSERT INTO "customerWishlistItem" ("customerWishlistId", "productId", "productVariantId", "note", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [item.customerWishlistId, item.productId, item.productVariantId, item.note, new Date(), new Date()],
    );
    if (!result) throw new FailedToCreateCustomerError('Failed to add item to wishlist');
    return result;
  }

  async removeItemFromWishlist(itemId: string): Promise<boolean> {
    const result = await queryOne<{ count: string }>(
      `WITH deleted AS (DELETE FROM "customerWishlistItem" WHERE "customerWishlistItemId" = $1 RETURNING *) SELECT COUNT(*) as count FROM deleted`,
      [itemId],
    );
    return result ? parseInt(result.count) > 0 : false;
  }

  async updateWishlistItemNote(itemId: string, note: string): Promise<CustomerWishlistItem> {
    const result = await queryOne<DbCustomerWishlistItem>(
      'UPDATE "customerWishlistItem" SET "note" = $1 WHERE "customerWishlistItemId" = $2 RETURNING *',
      [note, itemId],
    );
    if (!result) throw new FailedToCreateCustomerError(`Failed to update wishlist item ${itemId}`);
    return result;
  }
}
