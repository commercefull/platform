/**
 * Product Repository Interface
 * Defines the contract for product persistence operations
 */

import { Product } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';
import { ProductCategory } from '../entities/ProductCategory';
import { ProductStatus } from '../valueObjects/ProductStatus';
import { ProductVisibility } from '../valueObjects/ProductVisibility';

export interface ProductFilters {
  status?: ProductStatus | ProductStatus[];
  visibility?: ProductVisibility | ProductVisibility[];
  categoryId?: string;
  brandId?: string;
  merchantId?: string;
  businessId?: string;
  storeId?: string;
  isFeatured?: boolean;
  isVirtual?: boolean;
  hasVariants?: boolean;
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
  search?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ProductRepository {
  // Product CRUD
  findById(productId: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findAll(filters?: ProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  save(product: Product): Promise<Product>;
  delete(productId: string): Promise<void>;
  hardDelete(productId: string): Promise<void>;
  count(filters?: ProductFilters): Promise<number>;

  // Product queries
  findByCategory(categoryId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findByBrand(brandId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findByMerchant(merchantId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findByBusiness(businessId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findByStore(storeId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findByBusinessAndStore(businessId: string, storeId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findFeatured(pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findRelated(productId: string, limit?: number): Promise<Product[]>;
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

export interface CategoryRepository {
  // Category CRUD
  findById(categoryId: string): Promise<ProductCategory | null>;
  findBySlug(slug: string): Promise<ProductCategory | null>;
  findAll(pagination?: PaginationOptions): Promise<PaginatedResult<ProductCategory>>;
  findRootCategories(pagination?: PaginationOptions): Promise<PaginatedResult<ProductCategory>>;
  findChildren(parentId: string, pagination?: PaginationOptions): Promise<PaginatedResult<ProductCategory>>;
  findAncestors(categoryId: string): Promise<ProductCategory[]>;
  findDescendants(categoryId: string): Promise<ProductCategory[]>;
  save(category: ProductCategory): Promise<ProductCategory>;
  delete(categoryId: string): Promise<void>;
  count(): Promise<number>;

  // Category tree
  getFullTree(): Promise<ProductCategory[]>;
  getBreadcrumb(categoryId: string): Promise<ProductCategory[]>;
  moveCategory(categoryId: string, newParentId: string | null): Promise<void>;
  reorderCategories(parentId: string | null, categoryIds: string[]): Promise<void>;

  // Product counts
  updateProductCount(categoryId: string): Promise<void>;
  recalculateAllProductCounts(): Promise<void>;
}

export interface VariantRepository {
  findById(variantId: string): Promise<ProductVariant | null>;
  findBySku(sku: string): Promise<ProductVariant | null>;
  findByProductId(productId: string): Promise<ProductVariant[]>;
  save(variant: ProductVariant): Promise<ProductVariant>;
  delete(variantId: string): Promise<void>;

  // Stock management
  updateStock(variantId: string, quantity: number): Promise<void>;
  incrementStock(variantId: string, amount: number): Promise<void>;
  decrementStock(variantId: string, amount: number): Promise<void>;
  findLowStock(threshold?: number): Promise<ProductVariant[]>;
  findOutOfStock(): Promise<ProductVariant[]>;
}
