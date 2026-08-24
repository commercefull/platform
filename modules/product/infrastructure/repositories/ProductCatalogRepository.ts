/**
 * Consolidated Product Catalog Repository
 *
 * Merges productRepo, ProductRepository, productVariantRepo, ProductVariantRepository,
 * variantRepo, ProductTypeRepository, productPriceRepo, productSeoRepo, productTagRepo,
 * productToCategoryRepo, productCategoryRepo, categoryRepo, productDownloadRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Product Catalog (products, variants, types, categories, tags, SEO, pricing, downloads)
 */

import productRepo from './productRepo';
import productRepository from './ProductRepository';
import productVariantRepo from './productVariantRepo';
import productVariantRepository from './ProductVariantRepository';
import { VariantRepo } from './variantRepo';
import productTypeRepository from './ProductTypeRepository';
import productPriceRepo from './productPriceRepo';
import productSeoRepo from './productSeoRepo';
import productTagRepo from './productTagRepo';
import productToCategoryRepo from './productToCategoryRepo';
import productCategoryRepo from './productCategoryRepo';
import categoryRepo from './categoryRepo';
import productDownloadRepo from './productDownloadRepo';

// Re-export types for backward compatibility
export type { Product, ProductStatus as ProductStatusEnum, ProductVisibility as ProductVisibilityEnum } from './productRepo';
export type { ProductVariant as ProductVariantType, ProductVariantCreateProps, ProductVariantUpdateProps } from './productVariantRepo';
export type { ProductVariant as DbProductVariant } from './variantRepo';
export type { ProductType } from './ProductTypeRepository';
export type { ProductPrice, ProductPriceCreateParams, ProductPriceUpdateParams } from './productPriceRepo';
export type { ProductSeo, ProductSeoCreateParams, ProductSeoUpdateParams } from './productSeoRepo';
export type { ProductTag, ProductTagCreateParams } from './productTagRepo';
export type { ProductToCategory, ProductToCategoryCreateParams } from './productToCategoryRepo';
export type { ProductCategory, ProductCategoryCreateParams, ProductCategoryUpdateParams } from './productCategoryRepo';
export type { Category, CategoryCreateProps, CategoryUpdateProps } from './categoryRepo';
export type { ProductDownload, ProductDownloadCreateParams, ProductDownloadUpdateParams } from './productDownloadRepo';

const variantRepoInstance = new VariantRepo();

class ProductCatalogRepository {
  readonly products = productRepo;
  readonly productRepository = productRepository;
  readonly variants = productVariantRepo;
  readonly variantRepository = productVariantRepository;
  readonly variantRepo = variantRepoInstance;
  readonly types = productTypeRepository;
  readonly prices = productPriceRepo;
  readonly seo = productSeoRepo;
  readonly tags = productTagRepo;
  readonly toCategory = productToCategoryRepo;
  readonly productCategories = productCategoryRepo;
  readonly categories = categoryRepo;
  readonly downloads = productDownloadRepo;
}

export default new ProductCatalogRepository();
