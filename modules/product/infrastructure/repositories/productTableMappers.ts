/**
 * Row → Product mappers for productRepo (table `product` flat rows).
 */

import type { Product as DbProduct } from '../../../../libs/db/types';
import type { Product, ProductType, ProductStatus, ProductVisibility } from './productTypes';

export function rowToProduct(row: DbProduct): Product {
  return {
    ...coreProductFields(row),
    ...orderQuantityFields(row),
    ...measureFields(row),
    ...seoFields(row),
    ...flagFields(row),
    ...jsonFields(row),
  };
}

function coreProductFields(row: DbProduct) {
  return {
    productId: row.productId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    shortDescription: row.shortDescription ?? undefined,
    type: row.type as ProductType,
    status: row.status as ProductStatus,
    visibility: row.visibility as ProductVisibility,
    taxClass: row.taxClass ?? undefined,
    isTaxable: row.isTaxable,
    isInventoryManaged: row.isInventoryManaged,
  };
}

function orderQuantityFields(row: DbProduct) {
  return {
    minOrderQuantity: row.minOrderQuantity ?? undefined,
    maxOrderQuantity: row.maxOrderQuantity ?? undefined,
    orderIncrementQuantity: row.orderIncrementQuantity ?? undefined,
    warningThreshold: row.warningThreshold ?? undefined,
  };
}

function measureFields(row: DbProduct) {
  return {
    weight: row.weight != null ? Number(row.weight) : undefined,
    weightUnit: row.weightUnit ?? undefined,
    length: row.length != null ? Number(row.length) : undefined,
    width: row.width != null ? Number(row.width) : undefined,
    height: row.height != null ? Number(row.height) : undefined,
    dimensionUnit: row.dimensionUnit ?? undefined,
  };
}

function seoFields(row: DbProduct) {
  return {
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    metaKeywords: row.metaKeywords ?? undefined,
    hsCode: row.hsCode ?? undefined,
    countryOfOrigin: row.countryOfOrigin ?? undefined,
  };
}

function flagFields(row: DbProduct) {
  return {
    isFeatured: row.isFeatured,
    isNew: row.isNew,
    isBestseller: row.isBestseller,
    preorderEnabled: row.preorderEnabled,
    preorderReleaseDate: row.preorderReleaseDate ?? undefined,
    preorderAllowance: row.preorderAllowance ?? undefined,
    averageRating: row.averageRating != null ? Number(row.averageRating) : undefined,
    reviewCount: row.reviewCount ?? 0,
    isVirtual: row.isVirtual,
    isDownloadable: row.isDownloadable,
    isSubscription: row.isSubscription,
    hasVariants: row.hasVariants,
  };
}

function jsonFields(row: DbProduct) {
  return {
    customFields: (row.customFields ?? undefined) as Record<string, unknown> | undefined,
    seoData: (row.seoData ?? undefined) as Record<string, unknown> | undefined,
  };
}

