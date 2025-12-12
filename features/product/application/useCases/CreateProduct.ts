/**
 * Create Product Use Case
 * Creates a new product
 */

import { generateUUID } from '../../../../libs/uuid';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { Product } from '../../domain/entities/Product';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class CreateProductCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly productTypeId: string,
    public readonly sku?: string,
    public readonly slug?: string,
    public readonly shortDescription?: string,
    public readonly categoryId?: string,
    public readonly brandId?: string,
    public readonly merchantId?: string,
    public readonly basePrice?: number,
    public readonly salePrice?: number,
    public readonly cost?: number,
    public readonly currencyCode?: string,
    public readonly weight?: number,
    public readonly weightUnit?: 'kg' | 'lb' | 'oz' | 'g',
    public readonly length?: number,
    public readonly width?: number,
    public readonly height?: number,
    public readonly dimensionUnit?: 'cm' | 'in' | 'm' | 'mm',
    public readonly isFeatured?: boolean,
    public readonly isVirtual?: boolean,
    public readonly isDownloadable?: boolean,
    public readonly isSubscription?: boolean,
    public readonly isTaxable?: boolean,
    public readonly taxClass?: string,
    public readonly metaTitle?: string,
    public readonly metaDescription?: string,
    public readonly metaKeywords?: string,
    public readonly tags?: string[],
    public readonly metadata?: Record<string, any>
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CreateProductResponse {
  productId: string;
  name: string;
  slug: string;
  sku?: string;
  status: string;
  visibility: string;
  basePrice: number;
  effectivePrice: number;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(command: CreateProductCommand): Promise<CreateProductResponse> {
    // Validate command
    if (!command.name?.trim()) {
      throw new Error('Product name is required');
    }
    if (!command.productTypeId) {
      throw new Error('Product type is required');
    }

    // Check for duplicate SKU
    if (command.sku) {
      const existingProduct = await this.productRepository.findBySku(command.sku);
      if (existingProduct) {
        throw new Error(`Product with SKU "${command.sku}" already exists`);
      }
    }

    // Check for duplicate slug
    const slug = command.slug || Product.generateSlug(command.name);
    const existingBySlug = await this.productRepository.findBySlug(slug);
    if (existingBySlug) {
      throw new Error(`Product with slug "${slug}" already exists`);
    }

    const productId = generateUUID();

    // Create product using domain entity
    const product = Product.create({
      productId,
      name: command.name,
      description: command.description,
      productTypeId: command.productTypeId,
      sku: command.sku,
      slug: command.slug,
      shortDescription: command.shortDescription,
      categoryId: command.categoryId,
      brandId: command.brandId,
      merchantId: command.merchantId,
      basePrice: command.basePrice,
      salePrice: command.salePrice,
      cost: command.cost,
      currencyCode: command.currencyCode,
      weight: command.weight,
      weightUnit: command.weightUnit,
      length: command.length,
      width: command.width,
      height: command.height,
      dimensionUnit: command.dimensionUnit,
      isFeatured: command.isFeatured,
      isVirtual: command.isVirtual,
      isDownloadable: command.isDownloadable,
      isSubscription: command.isSubscription,
      isTaxable: command.isTaxable,
      taxClass: command.taxClass,
      metaTitle: command.metaTitle,
      metaDescription: command.metaDescription,
      metaKeywords: command.metaKeywords,
      tags: command.tags,
      metadata: command.metadata
    });

    // Save product
    const savedProduct = await this.productRepository.save(product);

    // Emit event
    eventBus.emit('product.created', {
      productId: savedProduct.productId,
      name: savedProduct.name,
      sku: savedProduct.sku,
      categoryId: savedProduct.categoryId,
      merchantId: savedProduct.merchantId
    });

    return this.mapToResponse(savedProduct);
  }

  private mapToResponse(product: Product): CreateProductResponse {
    return {
      productId: product.productId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      status: product.status,
      visibility: product.visibility,
      basePrice: product.price.basePrice,
      effectivePrice: product.price.effectivePrice,
      createdAt: product.createdAt.toISOString()
    };
  }
}
