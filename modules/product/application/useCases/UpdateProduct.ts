/**
 * Update Product Use Case
 * Updates an existing product
 */

import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { ProductNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';
import type { ProductPriceInfo, ProductPricingPort } from '../ports/ProductPricingPort';
import type { Product } from '../../domain/entities/Product';

// ============================================================================
// Command
// ============================================================================

export class UpdateProductCommand {
  constructor(
    public readonly productId: string,
    public readonly updates: {
      name?: string;
      description?: string;
      shortDescription?: string;
      sku?: string;
      slug?: string;
      categoryId?: string;
      /** Price fields are integer cents — written to the pricing-owned store. */
      basePriceCents?: number;
      salePriceCents?: number | null;
      costPriceCents?: number | null;
      compareAtPriceCents?: number | null;
      currencyCode?: string;
      weight?: number;
      weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
      length?: number;
      width?: number;
      height?: number;
      dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
      isFeatured?: boolean;
      isTaxable?: boolean;
      taxClass?: string;
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string;
      minOrderQuantity?: number;
      maxOrderQuantity?: number;
      returnPolicy?: string;
      warranty?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    },
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface UpdateProductResponse {
  productId: string;
  name: string;
  slug: string;
  status: string;
  updatedFields: string[];
  updatedAt: string;
}

type ProductUpdates = UpdateProductCommand['updates'];

// ============================================================================
// Use Case
// ============================================================================

export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly pricingPort: ProductPricingPort,
  ) {}

  async execute(command: UpdateProductCommand): Promise<UpdateProductResponse> {
    const product = await this.productRepository.findById(command.productId);

    if (!product) {
      throw new ProductNotFoundError(command.productId);
    }

    const updatedFields: string[] = [];
    const updates = command.updates;

    this.applyBasicInfo(product, updates, updatedFields);
    this.applySlug(product, updates, updatedFields);
    await this.applyPrice(product, updates, updatedFields);
    this.applyDimensions(product, updates, updatedFields);
    this.applyCategory(product, updates, updatedFields);
    this.applyFeatured(product, updates, updatedFields);
    this.applySeo(product, updates, updatedFields);
    this.applyTags(product, updates, updatedFields);
    this.applyMetadata(product, updates, updatedFields);

    // Save product
    await this.productRepository.save(product);

    // Emit event
    eventBus.emit('product.updated', {
      productId: product.productId,
      updatedFields,
    });

    return {
      productId: product.productId,
      name: product.name,
      slug: product.slug,
      status: product.status,
      updatedFields,
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private applyBasicInfo(product: Product, updates: ProductUpdates, updatedFields: string[]): void {
    if (!updates.name && updates.description === undefined && updates.shortDescription === undefined && updates.sku === undefined) {
      return;
    }
    product.updateBasicInfo({
      name: updates.name,
      description: updates.description,
      shortDescription: updates.shortDescription,
      sku: updates.sku,
    });
    if (updates.name) updatedFields.push('name');
    if (updates.description !== undefined) updatedFields.push('description');
    if (updates.shortDescription !== undefined) updatedFields.push('shortDescription');
    if (updates.sku !== undefined) updatedFields.push('sku');
  }

  private applySlug(product: Product, updates: ProductUpdates, updatedFields: string[]): void {
    if (!updates.slug) return;
    product.updateSeo({ slug: updates.slug });
    updatedFields.push('slug');
  }

  // Price fields are integer cents — the pricing module owns catalog prices.
  private async applyPrice(product: Product, updates: ProductUpdates, updatedFields: string[]): Promise<void> {
    if (
      updates.basePriceCents === undefined &&
      updates.salePriceCents === undefined &&
      updates.costPriceCents === undefined &&
      updates.compareAtPriceCents === undefined
    ) {
      return;
    }
    const existing = await this.pricingPort.getBasePrice(product.productId);
    const values = this.resolvePriceValues(updates, existing);
    await this.pricingPort.setBasePrice({
      productId: product.productId,
      currencyCode: updates.currencyCode ?? existing?.currencyCode ?? 'USD',
      ...values,
      taxRate: null,
    });
    updatedFields.push('price');
  }

  private resolvePriceValues(updates: ProductUpdates, existing: ProductPriceInfo | null) {
    const priceCents = updates.basePriceCents ?? existing?.priceCents;
    if (priceCents === undefined || !Number.isInteger(priceCents) || priceCents < 0) {
      throw new ProductValidationError('basePriceCents must be a non-negative integer');
    }
    const optionalPrices = {
      salePriceCents: this.resolveOptionalPrice(updates.salePriceCents, existing?.salePriceCents),
      costPriceCents: this.resolveOptionalPrice(updates.costPriceCents, existing?.costPriceCents),
      compareAtPriceCents: this.resolveOptionalPrice(updates.compareAtPriceCents, existing?.compareAtPriceCents),
    };
    this.assertOptionalPrices(optionalPrices);
    if (optionalPrices.salePriceCents !== null && optionalPrices.salePriceCents > priceCents) {
      throw new ProductValidationError('salePriceCents cannot exceed basePriceCents');
    }
    return { priceCents, ...optionalPrices };
  }

  // `undefined` keeps the existing price; `null` clears it; a number replaces it.
  private resolveOptionalPrice(update: number | null | undefined, existing: number | null | undefined): number | null {
    return update !== undefined ? update : (existing ?? null);
  }

  private assertOptionalPrices(prices: Record<string, number | null>): void {
    for (const [field, value] of Object.entries(prices)) {
      if (value !== null && (!Number.isInteger(value) || value < 0)) {
        throw new ProductValidationError(`${field} must be a non-negative integer or null`);
      }
    }
  }

  private applyDimensions(product: Product, updates: ProductUpdates, updatedFields: string[]): void {
    if (updates.weight === undefined && updates.length === undefined && updates.width === undefined && updates.height === undefined) {
      return;
    }
    product.updateDimensions({
      weight: updates.weight,
      weightUnit: updates.weightUnit,
      length: updates.length,
      width: updates.width,
      height: updates.height,
      dimensionUnit: updates.dimensionUnit,
    });
    updatedFields.push('dimensions');
  }

  private applyCategory(product: Product, updates: ProductUpdates, updatedFields: string[]): void {
    if (updates.categoryId === undefined) return;
    if (updates.categoryId) {
      product.assignCategory(updates.categoryId);
    } else {
      product.removeCategory();
    }
    updatedFields.push('categoryId');
  }

  private applyFeatured(product: Product, updates: ProductUpdates, updatedFields: string[]): void {
    if (updates.isFeatured === undefined) return;
    product.setFeatured(updates.isFeatured);
    updatedFields.push('isFeatured');
  }

  private applySeo(product: Product, updates: ProductUpdates, updatedFields: string[]): void {
    if (updates.metaTitle === undefined && updates.metaDescription === undefined && updates.metaKeywords === undefined) return;
    product.updateSeo({
      metaTitle: updates.metaTitle,
      metaDescription: updates.metaDescription,
      metaKeywords: updates.metaKeywords,
    });
    updatedFields.push('seo');
  }

  private applyTags(product: Product, updates: ProductUpdates, updatedFields: string[]): void {
    if (!updates.tags) return;
    // Clear existing tags and add new ones
    for (const tag of product.tags) {
      product.removeTag(tag);
    }
    for (const tag of updates.tags) {
      product.addTag(tag);
    }
    updatedFields.push('tags');
  }

  private applyMetadata(product: Product, updates: ProductUpdates, updatedFields: string[]): void {
    if (!updates.metadata) return;
    product.updateMetadata(updates.metadata);
    updatedFields.push('metadata');
  }
}
