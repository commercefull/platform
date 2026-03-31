/**
 * Get Product Use Case
 * Retrieves product details by ID, slug, or SKU
 */

import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { Product } from '../../domain/entities/Product';
import { ProductVariant } from '../../domain/entities/ProductVariant';

// ============================================================================
// Command
// ============================================================================

export class GetProductCommand {
  constructor(
    public readonly productId?: string,
    public readonly slug?: string,
    public readonly sku?: string,
    public readonly includeVariants: boolean = true,
    public readonly includeImages: boolean = true,
  ) {
    if (!productId && !slug && !sku) {
      throw new Error('Either productId, slug, or sku must be provided');
    }
  }
}

// ============================================================================
// Response
// ============================================================================

export interface ProductVariantResponse {
  variantId: string;
  sku: string;
  name: string;
  barcode?: string;
  basePrice: number;
  salePrice: number | null;
  cost: number | null;
  effectivePrice: number;
  isOnSale: boolean;
  discountPercentage: number;
  attributes: Array<{
    attributeId: string;
    attributeName: string;
    value: string;
    displayValue?: string;
  }>;
  attributeString: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isInStock: boolean;
  isLowStock: boolean;
  isDefault: boolean;
  isActive: boolean;
  position: number;
  imageUrl?: string;
  weight?: number | null;
  weightUnit?: string;
  dimensions?: {
    length: number | null;
    width: number | null;
    height: number | null;
    dimensionUnit: string;
  };
}

export interface ProductImageResponse {
  imageId: string;
  url: string;
  altText?: string;
  position: number;
  isPrimary: boolean;
}

export interface ProductDetailResponse {
  productId: string;
  name: string;
  description: string;
  shortDescription?: string;
  sku?: string;
  slug: string;
  productTypeId: string;
  categoryId?: string;
  brandId?: string;
  merchantId?: string;
  status: string;
  visibility: string;
  basePrice: number;
  salePrice: number | null;
  cost: number | null;
  effectivePrice: number;
  isOnSale: boolean;
  discountPercentage: number;
  profitMargin: number | null;
  profitMarginPercentage: number | null;
  currency: string;
  isFeatured: boolean;
  isVirtual: boolean;
  isDownloadable: boolean;
  isSubscription: boolean;
  isTaxable: boolean;
  taxClass?: string;
  isPurchasable: boolean;
  hasVariants: boolean;
  variantAttributes?: Record<string, any>;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  returnPolicy?: string;
  warranty?: string;
  externalId?: string;
  weight?: number | null;
  weightUnit?: string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  dimensionUnit?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags: string[];
  metadata?: Record<string, any>;
  variants?: ProductVariantResponse[];
  images?: ProductImageResponse[];
  primaryImage?: ProductImageResponse;
  primaryImageUrl?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class GetProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(command: GetProductCommand): Promise<ProductDetailResponse | null> {
    let product: Product | null = null;

    if (command.productId) {
      product = await this.productRepository.findById(command.productId);
    } else if (command.slug) {
      product = await this.productRepository.findBySlug(command.slug);
    } else if (command.sku) {
      product = await this.productRepository.findBySku(command.sku);
    }

    if (!product) {
      return null;
    }

    let variants: ProductVariant[] = [];
    let images: ProductImageResponse[] = [];

    if (command.includeVariants && product.hasVariants) {
      variants = await this.productRepository.findVariantsByProductId(product.productId);
    }

    if (command.includeImages) {
      const productImages = await this.productRepository.getProductImages(product.productId);
      images = productImages.map(img => ({
        imageId: img.imageId,
        url: img.url,
        altText: img.altText,
        position: img.position,
        isPrimary: img.isPrimary,
      }));
    }

    return this.mapToResponse(product, variants, images);
  }

  private mapToResponse(product: Product, variants: ProductVariant[], images: ProductImageResponse[]): ProductDetailResponse {
    const primaryImage = images.find(img => img.isPrimary) || images[0];

    return {
      productId: product.productId,
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      sku: product.sku,
      slug: product.slug,
      productTypeId: product.productTypeId,
      categoryId: product.categoryId,
      brandId: product.brandId,
      merchantId: product.merchantId,
      status: product.status,
      visibility: product.visibility,
      basePrice: product.price.basePrice,
      salePrice: product.price.salePrice,
      cost: product.price.cost,
      effectivePrice: product.price.effectivePrice,
      isOnSale: product.price.isOnSale,
      discountPercentage: product.price.discountPercentage,
      profitMargin: product.price.profitMargin,
      profitMarginPercentage: product.price.profitMarginPercentage,
      currency: product.price.currency,
      isFeatured: product.isFeatured,
      isVirtual: product.isVirtual,
      isDownloadable: product.isDownloadable,
      isSubscription: product.isSubscription,
      isTaxable: product.isTaxable,
      taxClass: product.taxClass,
      isPurchasable: product.isPurchasable,
      hasVariants: product.hasVariants,
      variantAttributes: product.variantAttributes,
      minOrderQuantity: product.minOrderQuantity,
      maxOrderQuantity: product.maxOrderQuantity,
      returnPolicy: product.returnPolicy,
      warranty: product.warranty,
      externalId: product.externalId,
      weight: product.dimensions.weight,
      weightUnit: product.dimensions.weightUnit,
      length: product.dimensions.length,
      width: product.dimensions.width,
      height: product.dimensions.height,
      dimensionUnit: product.dimensions.dimensionUnit,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      metaKeywords: product.metaKeywords,
      tags: product.tags,
      metadata: product.metadata,
      variants: variants.map(v => ({
        variantId: v.variantId,
        sku: v.sku,
        name: v.name,
        barcode: v.barcode,
        basePrice: v.price.basePrice,
        salePrice: v.price.salePrice,
        cost: v.price.cost,
        effectivePrice: v.price.effectivePrice,
        isOnSale: v.price.isOnSale,
        discountPercentage: v.price.discountPercentage,
        attributes: v.attributes,
        attributeString: v.attributeString,
        stockQuantity: v.stockQuantity,
        lowStockThreshold: v.lowStockThreshold,
        isInStock: v.isInStock,
        isLowStock: v.isLowStock,
        isDefault: v.isDefault,
        isActive: v.isActive,
        position: v.position,
        imageUrl: v.imageUrl,
        weight: v.dimensions.weight,
        weightUnit: v.dimensions.weightUnit,
        dimensions: {
          length: v.dimensions.length,
          width: v.dimensions.width,
          height: v.dimensions.height,
          dimensionUnit: v.dimensions.dimensionUnit,
        },
      })),
      images,
      primaryImage,
      primaryImageUrl: primaryImage?.url,
      publishedAt: product.publishedAt?.toISOString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
