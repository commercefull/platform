/**
 * Storefront Wishlist Repository Interface
 * Defines the contract for storefront wishlist persistence operations
 */

export interface WishlistItem {
  wishlistItemId: string;
  customerId: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorefrontWishlistRepository {
  findByCustomer(customerId: string): Promise<unknown[]>;
  findExisting(customerId: string, productId: string): Promise<WishlistItem | null>;
  create(customerId: string, productId: string): Promise<WishlistItem | null>;
  remove(customerId: string, productId: string): Promise<WishlistItem | null>;
}
