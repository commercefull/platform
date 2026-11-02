/**
 * Product Repository Interface
 * Defines the contract for product persistence operations
 */

import { Product } from '../entities/Product';
import { CatalogFeature } from '../entities/CatalogFeature';
import { ProductVariant } from '../entities/ProductVariant';

import { ProductStatus } from '../valueObjects/ProductStatus';
import { ProductVisibility } from '../valueObjects/ProductVisibility';
import { PaginatedResult, PaginationOptions } from 'libs/types/pagination';

export interface ProductFilters {
  status?: ProductStatus | ProductStatus[];
  visibility?: ProductVisibility | ProductVisibility[];
  categoryId?: string;
  organizationId?: string;
  storeId?: string;
  /** Restrict results to these product ids (assortment include scoping). */
  productIds?: string[];
  /** Drop these product ids from results (assortment exclude/hidden scoping). */
  excludeProductIds?: string[];
  brandId?: string;
  brandIds?: string[];
  isFeatured?: boolean;
  isVirtual?: boolean;
  hasVariants?: boolean;
  /** Price bounds are integer cents, matched against the pricing-owned productBasePrice table. */
  priceMinCents?: number;
  priceMaxCents?: number;
  tags?: string[];
  search?: string;
}

export interface ProductRepository {
  // Product CRUD
  findById(productId: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findByBarcode(barcode: string): Promise<{ product: Product; variant: ProductVariant } | null>;
  findAll(filters?: ProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  save(product: Product): Promise<Product>;
  delete(productId: string): Promise<void>;
  hardDelete(productId: string): Promise<void>;
  count(filters?: ProductFilters): Promise<number>;

  // Product queries
  findByCategory(categoryId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findByMerchant(organizationId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findByBusiness(organizationId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findByStore(storeId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findByBusinessAndStore(organizationId: string, storeId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findFeatured(pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findRelated(productId: string, limit?: number): Promise<Product[]>;
  /** Batch lookup used by cross-module consumers (recommendation serving). */
  findByIds(productIds: string[]): Promise<Product[]>;
  /** Cursor-paged catalog feature export (recommendation rebuilds, feeds). */
  listCatalogFeatureRows(params: { organizationId?: string; afterProductId?: string; limit?: number }): Promise<CatalogFeature[]>;
  search(query: string, filters?: ProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;

  // Product Variants
  findVariantsByProductId(productId: string): Promise<ProductVariant[]>;
  findVariantById(variantId: string): Promise<ProductVariant | null>;
  findVariantBySku(sku: string): Promise<ProductVariant | null>;
  saveVariant(variant: ProductVariant): Promise<ProductVariant>;
  deleteVariant(variantId: string): Promise<void>;
  getDefaultVariant(productId: string): Promise<ProductVariant | null>;

  // Product Images
  getProductImages(productId: string): Promise<
    Array<{
      imageId: string;
      url: string;
      altText?: string;
      position: number;
      isPrimary: boolean;
    }>
  >;
  addProductImage(
    productId: string,
    image: {
      imageId: string;
      url: string;
      altText?: string;
      position: number;
      isPrimary: boolean;
    },
  ): Promise<void>;
  updateProductImage(
    imageId: string,
    updates: {
      altText?: string;
      position?: number;
      isPrimary?: boolean;
    },
  ): Promise<void>;
  deleteProductImage(imageId: string): Promise<void>;
  reorderProductImages(productId: string, imageIds: string[]): Promise<void>;
}



