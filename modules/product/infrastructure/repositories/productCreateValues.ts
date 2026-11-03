/**
 * Insert-values builders for productRepo.create.
 */

import { ProductType, ProductStatus, ProductVisibility } from './productTypes';
import type { ProductCreateProps } from './productTypes';

export function createRowValues(data: ProductCreateProps) {
  return {
    sku: data.sku,
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    shortDescription: data.shortDescription || null,
    type: data.type || ProductType.SIMPLE,
    status: data.status || ProductStatus.DRAFT,
    visibility: data.visibility || ProductVisibility.VISIBLE,
    ...createInventoryValues(data),
    ...createDimensionValues(data),
    ...createSeoValues(data),
    ...createFlagValues(data),
    ...createPreorderValues(data),
    ...createJsonValues(data),
    ...createTypeValues(data),
    ...createOwnershipValues(data),
    ...createVariantValues(data),
  };
}

function createInventoryValues(data: ProductCreateProps) {
  return {
    taxClass: data.taxClass || 'standard',
    isTaxable: data.isTaxable !== false,
    isInventoryManaged: data.isInventoryManaged !== false,
    minOrderQuantity: data.minOrderQuantity || 1,
    maxOrderQuantity: data.maxOrderQuantity || null,
    orderIncrementQuantity: data.orderIncrementQuantity || 1,
  };
}

function createDimensionValues(data: ProductCreateProps) {
  return {
    weight: data.weight || null,
    weightUnit: data.weightUnit || 'g',
    length: data.length || null,
    width: data.width || null,
    height: data.height || null,
    dimensionUnit: data.dimensionUnit || 'cm',
  };
}

function createSeoValues(data: ProductCreateProps) {
  return {
    metaTitle: data.metaTitle || null,
    metaDescription: data.metaDescription || null,
    metaKeywords: data.metaKeywords || null,
    hsCode: data.hsCode || null,
    countryOfOrigin: data.countryOfOrigin || null,
  };
}

function createFlagValues(data: ProductCreateProps) {
  return {
    isFeatured: data.isFeatured || false,
    isNew: data.isNew || false,
    isBestseller: data.isBestseller || false,
    warningThreshold: data.warningThreshold || null,
  };
}

function createPreorderValues(data: ProductCreateProps) {
  return {
    preorderEnabled: data.preorderEnabled || false,
    preorderReleaseDate: data.preorderReleaseDate || null,
    preorderAllowance: data.preorderAllowance || null,
  };
}

function createJsonValues(data: ProductCreateProps) {
  return {
    customFields: data.customFields ? JSON.stringify(data.customFields) : null,
    seoData: data.seoData ? JSON.stringify(data.seoData) : null,
    relatedProducts: data.relatedProducts || null,
    crossSellProducts: data.crossSellProducts || null,
    upSellProducts: data.upSellProducts || null,
  };
}

function createTypeValues(data: ProductCreateProps) {
  return {
    isVirtual: data.isVirtual || false,
    isDownloadable: data.isDownloadable || false,
    isSubscription: data.isSubscription || false,
    primaryImageId: data.primaryImageId || null,
    publishedAt: data.publishedAt || null,
  };
}

function createOwnershipValues(data: ProductCreateProps) {
  return {
    userId: data.userId || null,
    organizationId: data.organizationId || null,
    returnPolicy: data.returnPolicy || null,
    warranty: data.warranty || null,
    externalId: data.externalId || null,
    createdBy: data.createdBy || null,
    updatedBy: data.updatedBy || null,
  };
}

function createVariantValues(data: ProductCreateProps) {
  return {
    hasVariants: data.hasVariants || false,
    variantAttributes: data.variantAttributes ? JSON.stringify(data.variantAttributes) : null,
  };
}
