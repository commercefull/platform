/**
 * SellabilityPort
 *
 * ACL port owned by basket. Answers whether a product is sellable on the
 * basket's store and sales channel according to assortment configuration.
 * Implementations must return true when the store has no assortment
 * configuration (default: full catalog is sellable).
 */

export interface SellabilityPort {
  isSellable(storeId: string, productId: string, channelId?: string): Promise<boolean>;
}
