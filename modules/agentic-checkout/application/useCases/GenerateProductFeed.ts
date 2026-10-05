/**
 * Generate Product Feed Use Case
 *
 * Resolves the channel store's sellable catalog (assortment) and serializes
 * it into the ACP product feed schema — the same shape Google Merchant /
 * Meta catalog formats converge on.
 */

import type { ChannelCatalogPort, ChannelProduct } from '../ports/ChannelCatalogPort';
import type { ChannelContext } from '../ports/ChannelResolverPort';

export interface FeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link?: string;
  price: string;
  availability: 'in_stock' | 'out_of_stock';
  item_group_id?: string;
}

export interface ProductFeed {
  version: string;
  items: FeedItem[];
}

export class GenerateProductFeedCommand {
  constructor(
    public readonly channel: ChannelContext,
    public readonly baseUrl?: string,
  ) {}
}

export class GenerateProductFeedUseCase {
  constructor(private readonly catalog: ChannelCatalogPort) {}

  async execute(command: GenerateProductFeedCommand): Promise<ProductFeed> {
    const products = await this.catalog.resolveStoreCatalog(command.channel.storeId, command.channel.salesChannelId);
    const baseUrl = (command.baseUrl ?? '').replace(/\/$/, '');

    return {
      version: 'acp.feed.1',
      items: products.map(p => this.toFeedItem(p, baseUrl)),
    };
  }

  private toFeedItem(product: ChannelProduct, baseUrl: string): FeedItem {
    const link = baseUrl ? `${baseUrl}/products/${product.slug}` : `/products/${product.slug}`;
    return {
      id: product.productVariantId ?? product.productId,
      title: product.name,
      description: product.description ?? product.name,
      link,
      image_link: product.imageUrl,
      price: `${(product.effectivePriceCents / 100).toFixed(2)} ${(product.currency ?? 'USD').toUpperCase()}`,
      availability: product.isAvailable ? 'in_stock' : 'out_of_stock',
      ...(product.productVariantId ? { item_group_id: product.productId } : {}),
    };
  }
}
