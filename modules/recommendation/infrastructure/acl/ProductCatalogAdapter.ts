/**
 * ProductCatalogAdapter — ACL translating the recommendation module's
 * CatalogPort onto the product module's public use cases. Only this file
 * may import from product; no product types leak into the domain.
 *
 * Note: `inStock` is left undefined — inventory is a separate bounded
 * context and is not a declared dependency of this module. `hideOutOfStock`
 * therefore only filters when a stock flag is supplied by a future adapter.
 */

import {
  getProductCardsUseCase,
  listCatalogFeaturesUseCase,
  manageProductRelationshipsUseCase,
  getProductCatalogEnrichmentUseCase,
} from '../../../product/application/useCases/wired';
import { GetProductCardsCommand } from '../../../product/application/useCases/GetProductCards';
import { ListCatalogFeaturesCommand } from '../../../product/application/useCases/ListCatalogFeatures';
import { GetProductCatalogEnrichmentCommand } from '../../../product/application/useCases/GetProductCatalogEnrichment';
import type { CatalogFeature } from '../../../product/domain/entities/CatalogFeature';
import type { ProductRelationType } from '../../../product/domain/entities/ProductRelationship';
import type { CatalogFeatureRow, CatalogPort, ManualLink, RecommendationCard } from '../../application/ports/CatalogPort';

export class ProductCatalogAdapter implements CatalogPort {
  async getCards(
    productIds: string[],
    context?: { organizationId?: string; storeId?: string; currencyCode?: string },
  ): Promise<RecommendationCard[]> {
    const cards = await getProductCardsUseCase.execute(new GetProductCardsCommand(productIds, context?.currencyCode));
    return cards
      .filter(c => !context?.organizationId || c.organizationId === context.organizationId)
      .map(c => ({
        productId: c.productId,
        name: c.name,
        slug: c.slug,
        status: c.status,
        visibility: c.visibility,
        organizationId: c.organizationId,
        storeId: c.storeId,
        effectivePriceCents: c.effectivePriceCents,
        basePriceCents: c.basePriceCents,
        salePriceCents: c.salePriceCents,
        isOnSale: c.isOnSale,
        isFeatured: c.isFeatured,
        isInventoryManaged: c.isInventoryManaged,
        primaryImageUrl: c.primaryImageUrl,
        currency: c.currency,
      }));
  }

  async getManualLinks(productIds: string[], types: string[]): Promise<ManualLink[]> {
    const out: ManualLink[] = [];
    for (const productId of productIds) {
      for (const type of types) {
        const rows = await manageProductRelationshipsUseCase.listForProduct(productId, type as ProductRelationType);
        for (const r of rows) {
          if (r.productId && r.relatedProductId && r.type) {
            out.push({ productId: r.productId, relatedProductId: r.relatedProductId, type: r.type, position: r.position ?? 0 });
          }
        }
      }
    }
    return out;
  }

  async listFeatures(
    organizationId: string | undefined,
    cursor: string | null,
    limit: number,
  ): Promise<{ features: CatalogFeatureRow[]; nextCursor: string | null }> {
    const res = await listCatalogFeaturesUseCase.execute(new ListCatalogFeaturesCommand(organizationId, cursor ?? undefined, limit));
    return { features: res.features.map(toFeatureRow), nextCursor: res.nextCursor };
  }

  async getPrimaryCategory(productId: string): Promise<string | null> {
    const enrichment = await getProductCatalogEnrichmentUseCase.execute(new GetProductCatalogEnrichmentCommand(productId));
    // Mappings arrive ordered isPrimary DESC, position ASC
    return enrichment.categories[0]?.productCategoryId ?? null;
  }

  async createManualLink(productId: string, relatedProductId: string, type: string, opts?: { isAutomated?: boolean }): Promise<void> {
    await manageProductRelationshipsUseCase.create(productId, {
      relatedProductId,
      type,
      position: 0,
      isAutomated: opts?.isAutomated ?? false,
    });
  }
}

function toFeatureRow(f: CatalogFeature): CatalogFeatureRow {
  return { ...f };
}
