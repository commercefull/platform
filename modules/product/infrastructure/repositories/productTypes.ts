/**
 * Product repository types — shared between productRepo and its query helpers.
 */

// Product status and visibility enums to match database schema
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  ARCHIVED = 'archived',
}

export enum ProductVisibility {
  VISIBLE = 'visible',
  NOT_VISIBLE = 'not_visible',
  CATALOG = 'catalog',
  SEARCH = 'search',
}

export enum ProductType {
  SIMPLE = 'simple',
  CONFIGURABLE = 'configurable',
  GROUPED = 'grouped',
  VIRTUAL = 'virtual',
  DOWNLOADABLE = 'downloadable',
  BUNDLE = 'bundle',
  SUBSCRIPTION = 'subscription',
}

// Product interface matching database schema (camelCase)
export interface Product {
  productId: string;
  createdAt: Date;
  updatedAt: Date;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string; // Primary category ID (from productCategoryMap)
  type: ProductType;
  status: ProductStatus;
  visibility: ProductVisibility;
  taxClass?: string;
  isTaxable: boolean;
  isInventoryManaged: boolean;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  orderIncrementQuantity?: number;
  weight?: number;
  weightUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  hsCode?: string;
  countryOfOrigin?: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  warningThreshold?: number;
  preorderEnabled: boolean;
  preorderReleaseDate?: Date;
  preorderAllowance?: number;
  averageRating?: number;
  reviewCount: number;
  customFields?: Record<string, unknown>;
  seoData?: Record<string, unknown>;
  relatedProducts?: string[];
  crossSellProducts?: string[];
  upSellProducts?: string[];
  isVirtual: boolean;
  isDownloadable: boolean;
  isSubscription: boolean;
  primaryImageId?: string;
  publishedAt?: Date;
  deletedAt?: Date;
  userId?: string;
  organizationId?: string;
  returnPolicy?: string;
  warranty?: string;
  externalId?: string;
  hasVariants: boolean;
  variantAttributes?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
}

// Include id alias for compatibility

export type ProductCreateProps = Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>;

export type ProductUpdateProps = Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>;

export interface ProductFilterOptions {
  status?: ProductStatus | ProductStatus[];
  visibility?: ProductVisibility | ProductVisibility[];
  type?: ProductType | ProductType[];
  isFeatured?: boolean;
  isVirtual?: boolean;
  hasVariants?: boolean;
  /** Price bounds are integer cents, matched against the pricing-owned productBasePrice table. */
  priceMinCents?: number;
  priceMaxCents?: number;
  organizationId?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

