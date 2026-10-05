/**
 * AssortmentChannelCatalogAdapter
 *
 * ACL adapter bridging agentic-checkout's ChannelCatalogPort to assortment's
 * ResolveStoreCatalogUseCase (store-scoped sellable set) + product repo
 * hydration (sku, description, images) for feeds and item validation.
 */

import { ResolveStoreCatalogCommand, type ResolveStoreCatalogUseCase } from '../../../assortment/application/useCases/ResolveStoreCatalog';
import type { ProductRepository } from '../../../product/domain/repositories/ProductRepository';
import type { ChannelCatalogPort, ChannelProduct } from '../../application/ports/ChannelCatalogPort';
import { ProductStatus } from '../../../product/domain/valueObjects/ProductStatus';

export class AssortmentChannelCatalogAdapter implements ChannelCatalogPort {
  constructor(
    private readonly resolveStoreCatalogUseCase: Pick<ResolveStoreCatalogUseCase, 'execute'>,
    private readonly productRepository: Pick<ProductRepository, 'findByIds'>,
  ) {}

  async resolveStoreCatalog(storeId: string, channelId?: string): Promise<ChannelProduct[]> {
    const response = await this.resolveStoreCatalogUseCase.execute(new ResolveStoreCatalogCommand(storeId, 100, 0, channelId));
    const sellable = new Map(response.products.map(p => [p.productId, p]));
    return this.hydrate(
      response.products.map(p => p.productId),
      sellable,
    );
  }

  async findProducts(storeId: string, productIds: string[], channelId?: string): Promise<ChannelProduct[]> {
    const catalog = await this.resolveStoreCatalogUseCase.execute(new ResolveStoreCatalogCommand(storeId, 100, 0, channelId));
    const sellable = new Map(catalog.products.map(p => [p.productId, p]));
    return this.hydrate(productIds, sellable);
  }

  private async hydrate(
    requestedIds: string[],
    sellable: Map<string, { productId: string; effectivePriceCents: number }>,
  ): Promise<ChannelProduct[]> {
    const ids = requestedIds.filter(id => sellable.has(id));
    if (ids.length === 0) return [];

    const products = await this.productRepository.findByIds(ids);
    return products
      .filter(p => sellable.has(p.productId))
      .map(p => {
        const ref = sellable.get(p.productId);
        return {
          productId: p.productId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          sku: p.sku,
          imageUrl: p.primaryImage?.url,
          effectivePriceCents: ref?.effectivePriceCents ?? 0,
          isAvailable: p.status === ProductStatus.ACTIVE,
        };
      });
  }
}
