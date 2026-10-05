/**
 * ProductCatalogAdapter
 *
 * ACL adapter bridging assortment's CatalogQueryPort to the product module.
 * Rule evaluation goes through ListProductsUseCase (filtered listing, no
 * query string required); batch hydration uses the repository's findByIds.
 */

import { ListProductsCommand, type ListProductsUseCase } from '../../../product/application/useCases/ListProducts';
import { ProductStatus } from '../../../product/domain/valueObjects/ProductStatus';
import type { ProductRepository } from '../../../product/domain/repositories/ProductRepository';
import type { CatalogQueryPort, CatalogQueryResult, CatalogProductRef } from '../../application/ports/CatalogQueryPort';
import type { CatalogQueryFilters } from '../../domain/services/CollectionRuleEvaluator';

export class ProductCatalogAdapter implements CatalogQueryPort {
  constructor(
    private readonly listProducts: Pick<ListProductsUseCase, 'execute'>,
    private readonly productRepository: Pick<ProductRepository, 'findByIds'>,
  ) {}

  async searchProducts(filters: CatalogQueryFilters, limit: number, offset: number): Promise<CatalogQueryResult> {
    const orderBy =
      filters.sortOrder === 'price_asc' || filters.sortOrder === 'price_desc'
        ? 'priceCents'
        : filters.sortOrder === 'name_asc'
          ? 'name'
          : 'createdAt';
    const orderDirection = filters.sortOrder === 'price_desc' || filters.sortOrder === 'newest' ? 'desc' : 'asc';

    const result = await this.listProducts.execute(
      new ListProductsCommand(
        {
          status: ProductStatus.ACTIVE,
          categoryId: filters.categoryId,
          brandId: filters.brandId,
          storeId: filters.storeId,
          isFeatured: filters.isFeatured,
          priceMinCents: filters.priceMinCents,
          priceMaxCents: filters.priceMaxCents,
          tags: filters.tags,
          search: filters.query,
          productIds: filters.productIds,
          excludeProductIds: filters.excludeProductIds,
        },
        limit,
        offset,
        orderBy,
        orderDirection,
      ),
    );

    return {
      products: result.products.map(p => ({
        productId: p.productId,
        name: p.name,
        slug: p.slug,
        categoryId: p.categoryId,
        effectivePriceCents: p.effectivePriceCents,
        isFeatured: p.isFeatured,
        primaryImageUrl: p.primaryImageUrl,
        createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
      })),
      total: result.total,
    };
  }

  async findProductsByIds(productIds: string[]): Promise<CatalogProductRef[]> {
    const products = await this.productRepository.findByIds(productIds);
    return products.map(p => ({
      productId: p.productId,
      name: p.name,
      slug: p.slug,
      categoryId: p.categoryId,
      effectivePriceCents: 0,
      isFeatured: p.isFeatured,
      primaryImageUrl: p.primaryImage?.url,
      createdAt: p.createdAt,
    }));
  }
}
