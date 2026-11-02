/**
 * Row → domain mappers for ProductRepository.
 */

import type { Product as DbProduct, ProductVariant as DbProductVariant } from '../../../../libs/db/types';
import { Product, ProductImage } from '../../domain/entities/Product';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import { Dimensions } from '../../domain/valueObjects/Dimensions';

export function mapToProduct(row: DbProduct, images: ProductImage[]): Product {
  return Product.reconstitute({
    ...productIdentityFromRow(row),
    ...productFlagsFromRow(row),
    ...productMetaFromRow(row),
    dimensions: dimensionsFromRow(row),
    images,
    publishedAt: row.publishedAt ? new Date(row.publishedAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
  });
}

function productIdentityFromRow(row: DbProduct) {
  return {
    productId: row.productId,
    name: row.name,
    description: row.description || '',
    shortDescription: row.shortDescription ?? undefined,
    sku: row.sku,
    slug: row.slug,
    productTypeId: row.productTypeId ?? row.type,
    categoryId: undefined,
    organizationId: row.organizationId ?? undefined,
    storeId: row.storeId ?? undefined,
    status: row.status as ProductStatus,
    visibility: row.visibility as ProductVisibility,
    primaryImageId: row.primaryImageId ?? undefined,
    externalId: row.externalId ?? undefined,
  };
}

function dimensionsFromRow(row: DbProduct): Dimensions {
  return Dimensions.create({
    weight: row.weight ? parseFloat(row.weight) : undefined,
    weightUnit: (row.weightUnit || 'g') as 'kg' | 'lb' | 'oz' | 'g',
    length: row.length ? parseFloat(row.length) : undefined,
    width: row.width ? parseFloat(row.width) : undefined,
    height: row.height ? parseFloat(row.height) : undefined,
    dimensionUnit: (row.dimensionUnit || 'cm') as 'cm' | 'in' | 'm' | 'mm',
  });
}

function productFlagsFromRow(row: DbProduct) {
  return {
    isFeatured: Boolean(row.isFeatured),
    isVirtual: Boolean(row.isVirtual),
    isDownloadable: Boolean(row.isDownloadable),
    isSubscription: Boolean(row.isSubscription),
    isTaxable: Boolean(row.isTaxable),
    isInventoryManaged:
      row.isInventoryManaged === null || row.isInventoryManaged === undefined ? undefined : Boolean(row.isInventoryManaged),
    taxClass: row.taxClass ?? undefined,
    hasVariants: Boolean(row.hasVariants),
    variantAttributes: row.variantAttributes
      ? typeof row.variantAttributes === 'string'
        ? JSON.parse(row.variantAttributes as string)
        : (row.variantAttributes as Record<string, unknown>)
      : undefined,
  };
}

function productMetaFromRow(row: DbProduct) {
  return {
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    metaKeywords: row.metaKeywords ?? undefined,
    minOrderQuantity: row.minOrderQuantity ?? 1,
    maxOrderQuantity: row.maxOrderQuantity ?? undefined,
    returnPolicy: row.returnPolicy ?? undefined,
    warranty: row.warranty ?? undefined,
    tags: [],
    metadata: undefined,
  };
}

function mapToVariant(row: DbProductVariant): ProductVariant {
  return ProductVariant.reconstitute({
    variantId: row.productVariantId,
    productId: row.productId,
    sku: row.sku,
    name: row.name || '',
    dimensions: Dimensions.create({
      weight: row.weight ? parseFloat(row.weight) : undefined,
      weightUnit: 'g',
      length: row.length ? parseFloat(row.length) : undefined,
      width: row.width ? parseFloat(row.width) : undefined,
      height: row.height ? parseFloat(row.height) : undefined,
      dimensionUnit: 'cm',
    }),
    attributes: [],
    stockQuantity: 0,
    lowStockThreshold: 5,
    inventoryPolicy:
      ((row as DbProductVariant & { inventoryPolicy?: 'tracked' | 'unlimited' | 'backorderable' }).inventoryPolicy as
        'tracked' | 'unlimited' | 'backorderable' | undefined) ?? 'tracked',
    isDefault: Boolean(row.isDefault),
    isActive: row.status === 'active',
    position: row.position ?? 0,
    barcode: row.barcode ?? undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  });
}
export { mapToVariant };
