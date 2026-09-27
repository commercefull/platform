/**
 * List Catalog Features Use Case
 * Cursor-paged export of compact product feature rows for offline consumers
 * (recommendation rebuilds, feeds). Paging is by productId for stable scans.
 */

import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import type { CatalogFeature } from '../../domain/entities/CatalogFeature';

export class ListCatalogFeaturesCommand {
  constructor(
    public readonly organizationId?: string,
    public readonly afterProductId?: string,
    public readonly limit: number = 500,
  ) {}
}

export interface ListCatalogFeaturesResponse {
  features: CatalogFeature[];
  /** Pass back as `afterProductId` to fetch the next page; null when done. */
  nextCursor: string | null;
}

export class ListCatalogFeaturesUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(command: ListCatalogFeaturesCommand): Promise<ListCatalogFeaturesResponse> {
    const features = await this.productRepository.listCatalogFeatureRows({
      organizationId: command.organizationId,
      afterProductId: command.afterProductId,
      limit: command.limit,
    });
    return {
      features,
      nextCursor: features.length === command.limit ? features[features.length - 1].productId : null,
    };
  }
}
