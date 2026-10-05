/**
 * ChannelCatalogPort
 *
 * ACL port owned by agentic-checkout. Reads the store-scoped catalog —
 * resolves which products a channel store may sell (assortment) and
 * hydrates product refs for feed generation and session item validation.
 */

export interface ChannelProduct {
  productId: string;
  productVariantId?: string;
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  imageUrl?: string;
  effectivePriceCents: number;
  currency?: string;
  isAvailable: boolean;
}

export interface ChannelCatalogPort {
  /** The store's effective sellable catalog (assortment-resolved, channel-aware). */
  resolveStoreCatalog(storeId: string, channelId?: string): Promise<ChannelProduct[]>;

  /** Look up sellable products by id; missing/unsellable ids are omitted. */
  findProducts(storeId: string, productIds: string[], channelId?: string): Promise<ChannelProduct[]>;
}
