/**
 * Product prop types and creation-props builder.
 * The Product aggregate delegates to `buildProductProps` so `Product.create`
 * stays a thin factory.
 */

import { ProductStatus } from '../valueObjects/ProductStatus';
import { ProductVisibility } from '../valueObjects/ProductVisibility';
import { Dimensions } from '../valueObjects/Dimensions';

export interface ProductImage {
  imageId: string;
  url: string;
  altText?: string;
  position: number;
  isPrimary: boolean;
  // New fields for processed images
  webpUrl?: string;
  thumbnailUrl?: string;
  responsiveUrls?: Record<string, string>;
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    format?: string;
  };
}

export interface ProductProps {
  productId: string;
  name: string;
  description: string;
  shortDescription?: string;
  sku: string;
  slug: string;
  productTypeId: string;
  categoryId?: string;
  organizationId?: string;
  storeId?: string; // For store-specific product overrides
  status: ProductStatus;
  visibility: ProductVisibility;
  dimensions: Dimensions;
  isFeatured: boolean;
  isVirtual: boolean;
  isDownloadable: boolean;
  isSubscription: boolean;
  isTaxable: boolean;
  taxClass?: string;
  isInventoryManaged?: boolean;
  hasVariants: boolean;
  variantAttributes?: Record<string, unknown>;
  images: ProductImage[];
  primaryImageId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  returnPolicy?: string;
  warranty?: string;
  externalId?: string;
  brandId?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ProductCreateProps {
  productId: string;
  name: string;
  description: string;
  productTypeId: string;
  slug?: string;
  shortDescription?: string;
  sku?: string;
  categoryId?: string;
  organizationId?: string;
  storeId?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
  isFeatured?: boolean;
  isVirtual?: boolean;
  isDownloadable?: boolean;
  isSubscription?: boolean;
  isTaxable?: boolean;
  isInventoryManaged?: boolean;
  taxClass?: string;
  hasVariants?: boolean;
  variantAttributes?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  returnPolicy?: string;
  warranty?: string;
  externalId?: string;
  brandId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export function buildProductProps(props: ProductCreateProps, slug: string, sku: string): ProductProps {
  const now = new Date();
  return {
    productId: props.productId,
    name: props.name,
    description: props.description,
    shortDescription: props.shortDescription,
    sku,
    slug,
    productTypeId: props.productTypeId,
    categoryId: props.categoryId,
    organizationId: props.organizationId,
    storeId: props.storeId,
    status: ProductStatus.DRAFT,
    visibility: ProductVisibility.NOT_VISIBLE,
    dimensions: Dimensions.create({
      weight: props.weight,
      weightUnit: props.weightUnit,
      length: props.length,
      width: props.width,
      height: props.height,
      dimensionUnit: props.dimensionUnit,
    }),
    isFeatured: props.isFeatured || false,
    isVirtual: props.isVirtual || false,
    isDownloadable: props.isDownloadable || false,
    isSubscription: props.isSubscription || false,
    isTaxable: props.isTaxable !== false,
    isInventoryManaged: props.isInventoryManaged ?? !(props.isVirtual || props.isDownloadable),
    taxClass: props.taxClass,
    hasVariants: props.hasVariants || false,
    variantAttributes: props.variantAttributes,
    images: [],
    metaTitle: props.metaTitle,
    metaDescription: props.metaDescription,
    metaKeywords: props.metaKeywords,
    minOrderQuantity: props.minOrderQuantity || 1,
    maxOrderQuantity: props.maxOrderQuantity,
    returnPolicy: props.returnPolicy,
    warranty: props.warranty,
    externalId: props.externalId,
    brandId: props.brandId,
    tags: props.tags || [],
    metadata: props.metadata,
    createdAt: now,
    updatedAt: now,
  };
}
