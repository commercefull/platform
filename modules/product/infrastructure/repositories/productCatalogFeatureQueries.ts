/**
 * Catalog feature-row projection used by the search/catalog sync path.
 */

import { query } from '../../../../libs/db';
import type { CatalogFeature } from '../../domain/entities/CatalogFeature';

export async function listCatalogFeatureRows(params: { organizationId?: string; afterProductId?: string; limit?: number }): Promise<CatalogFeature[]> {
  const limit = params.limit ?? 500;
  const rows = await query<
    Array<{
      productId: string;
      organizationId: string | null;
      storeId: string | null;
      status: string;
      visibility: string;
      type: string;
      brandId: string | null;
      averageRating: string | null;
      publishedAt: string | null;
      isFeatured: boolean;
      isBestseller: boolean;
      primaryCategoryId: string | null;
      categoryIds: unknown;
      collectionIds: unknown;
      attributeValues: unknown;
      basePriceCents: number | null;
    }>
  >(
    `SELECT
       p."productId", p."organizationId", p."storeId", p."status", p."visibility", p."type",
       p."brandId", p."averageRating", p."publishedAt", p."isFeatured", p."isBestseller",
       (SELECT ptc."productCategoryId" FROM "productToCategory" ptc
         WHERE ptc."productId" = p."productId"
         ORDER BY ptc."isPrimary" DESC, ptc."position" ASC LIMIT 1) AS "primaryCategoryId",
       COALESCE((SELECT json_agg(x."productCategoryId") FROM (
         SELECT DISTINCT ptc2."productCategoryId" FROM "productToCategory" ptc2
         WHERE ptc2."productId" = p."productId") x), '[]'::json) AS "categoryIds",
       COALESCE((SELECT json_agg(pcm."assortmentCollectionId") FROM "assortmentCollectionMap" pcm
         WHERE pcm."productId" = p."productId"), '[]'::json) AS "collectionIds",
       COALESCE((SELECT json_agg(json_build_object('attributeId', avm."attributeId", 'value', avm."value"))
         FROM "productAttributeValueMap" avm WHERE avm."productId" = p."productId"), '[]'::json) AS "attributeValues",
       (SELECT bp."priceCents" FROM "productBasePrice" bp
         WHERE bp."productId" = p."productId" AND bp."productVariantId" IS NULL LIMIT 1) AS "basePriceCents"
     FROM product p
     WHERE p."deletedAt" IS NULL
       AND ($1::uuid IS NULL OR p."organizationId" = $1)
       AND ($2::uuid IS NULL OR p."productId" > $2)
     ORDER BY p."productId" ASC
     LIMIT $3`,
    [params.organizationId ?? null, params.afterProductId ?? null, limit],
  );

  return (rows || []).map(row => {
    const categoryIds = (row.categoryIds as string[]) || [];
    return {
      productId: row.productId,
      organizationId: row.organizationId,
      storeId: row.storeId,
      status: row.status,
      visibility: row.visibility,
      type: row.type,
      brandId: row.brandId,
      primaryCategoryId: row.primaryCategoryId,
      secondaryCategoryIds: categoryIds.filter(c => c !== row.primaryCategoryId),
      collectionIds: (row.collectionIds as string[]) || [],
      attributeValues: (row.attributeValues as CatalogFeature['attributeValues']) || [],
      basePriceCents: row.basePriceCents !== null ? Number(row.basePriceCents) : null,
      averageRating: row.averageRating !== null ? Number(row.averageRating) : null,
      publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
      isFeatured: row.isFeatured,
      isBestseller: row.isBestseller,
    };
  });
}

