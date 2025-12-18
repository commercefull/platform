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
    public readonly includeImages: boolean = true
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
  basePrice: number;
  salePrice: number | null;
  effectivePrice: number;
  isOnSale: boolean;
  attributes: Array<{
    attributeId: string;
    attributeName: string;
    value: string;
    displayValue?: string;
  }>;
  stockQuantity: number;
  isInStock: boolean;
  isDefault: boolean;
  imageUrl?: string;
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
  status: string;
  visibility: string;
  basePrice: number;
  salePrice: number | null;
  effectivePrice: number;
  isOnSale: boolean;
  discountPercentage: number;
  currency: string;
  isFeatured: boolean;
  isVirtual: boolean;
  isDownloadable: boolean;
  isPurchasable: boolean;
  hasVariants: boolean;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags: string[];
  variants?: ProductVariantResponse[];
  images?: ProductImageResponse[];
  primaryImage?: ProductImageResponse;
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
        isPrimary: img.isPrimary
      }));
    }

    return this.mapToResponse(product, variants, images);
  }

  private mapToResponse(
    product: Product, 
    variants: ProductVariant[],
    images: ProductImageResponse[]
  ): ProductDetailResponse {
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
      status: product.status,
      visibility: product.visibility,
      basePrice: product.price.basePrice,
      salePrice: product.price.salePrice,
      effectivePrice: product.price.effectivePrice,
      isOnSale: product.price.isOnSale,
      discountPercentage: product.price.discountPercentage,
      currency: product.price.currency,
      isFeatured: product.isFeatured,
      isVirtual: product.isVirtual,
      isDownloadable: product.isDownloadable,
      isPurchasable: product.isPurchasable,
      hasVariants: product.hasVariants,
      minOrderQuantity: product.minOrderQuantity,
      maxOrderQuantity: product.maxOrderQuantity,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      metaKeywords: product.metaKeywords,
      tags: product.tags,
      variants: variants.map(v => ({
        variantId: v.variantId,
        sku: v.sku,
        name: v.name,
        basePrice: v.price.basePrice,
        salePrice: v.price.salePrice,
        effectivePrice: v.price.effectivePrice,
        isOnSale: v.price.isOnSale,
        attributes: v.attributes,
        stockQuantity: v.stockQuantity,
        isInStock: v.isInStock,
        isDefault: v.isDefault,
        imageUrl: v.imageUrl
      })),
      images,
      primaryImage,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    };
  }
}
