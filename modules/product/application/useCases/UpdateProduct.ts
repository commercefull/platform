/**
 * Update Product Use Case
 * Updates an existing product
 */

import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { ProductNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';
import type { ProductPricingPort } from '../ports/ProductPricingPort';

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

    // Update basic info
    if (
      command.updates.name ||
      command.updates.description !== undefined ||
      command.updates.shortDescription !== undefined ||
      command.updates.sku !== undefined
    ) {
      product.updateBasicInfo({
        name: command.updates.name,
        description: command.updates.description,
        shortDescription: command.updates.shortDescription,
        sku: command.updates.sku,
      });
      if (command.updates.name) updatedFields.push('name');
      if (command.updates.description !== undefined) updatedFields.push('description');
      if (command.updates.shortDescription !== undefined) updatedFields.push('shortDescription');
      if (command.updates.sku !== undefined) updatedFields.push('sku');
    }

    // Update slug
    if (command.updates.slug) {
      product.updateSeo({ slug: command.updates.slug });
      updatedFields.push('slug');
    }

    // Update price — the pricing module owns catalog prices (integer cents)
    if (
      command.updates.basePriceCents !== undefined ||
      command.updates.salePriceCents !== undefined ||
      command.updates.costPriceCents !== undefined ||
      command.updates.compareAtPriceCents !== undefined
    ) {
      const existing = await this.pricingPort.getBasePrice(product.productId);
      const priceCents = command.updates.basePriceCents ?? existing?.priceCents;
      if (priceCents === undefined || !Number.isInteger(priceCents) || priceCents < 0) {
        throw new ProductValidationError('basePriceCents must be a non-negative integer');
      }
      const salePriceCents =
        command.updates.salePriceCents !== undefined ? command.updates.salePriceCents : (existing?.salePriceCents ?? null);
      const costPriceCents =
        command.updates.costPriceCents !== undefined ? command.updates.costPriceCents : (existing?.costPriceCents ?? null);
      const compareAtPriceCents =
        command.updates.compareAtPriceCents !== undefined
          ? command.updates.compareAtPriceCents
          : (existing?.compareAtPriceCents ?? null);
      for (const [field, value] of Object.entries({ salePriceCents, costPriceCents, compareAtPriceCents })) {
        if (value !== null && (!Number.isInteger(value) || value < 0)) {
          throw new ProductValidationError(`${field} must be a non-negative integer or null`);
        }
      }
      if (salePriceCents !== null && salePriceCents > priceCents) {
        throw new ProductValidationError('salePriceCents cannot exceed basePriceCents');
      }
      await this.pricingPort.setBasePrice({
        productId: product.productId,
        currencyCode: command.updates.currencyCode ?? existing?.currencyCode ?? 'USD',
        priceCents,
        salePriceCents,
        costPriceCents,
        compareAtPriceCents,
        taxRate: null,
      });
      updatedFields.push('price');
    }

    // Update dimensions
    if (
      command.updates.weight !== undefined ||
      command.updates.length !== undefined ||
      command.updates.width !== undefined ||
      command.updates.height !== undefined
    ) {
      product.updateDimensions({
        weight: command.updates.weight,
        weightUnit: command.updates.weightUnit,
        length: command.updates.length,
        width: command.updates.width,
        height: command.updates.height,
        dimensionUnit: command.updates.dimensionUnit,
      });
      updatedFields.push('dimensions');
    }

    // Update category
    if (command.updates.categoryId !== undefined) {
      if (command.updates.categoryId) {
        product.assignCategory(command.updates.categoryId);
      } else {
        product.removeCategory();
      }
      updatedFields.push('categoryId');
    }

    // Update featured status
    if (command.updates.isFeatured !== undefined) {
      product.setFeatured(command.updates.isFeatured);
      updatedFields.push('isFeatured');
    }

    // Update SEO
    if (
      command.updates.metaTitle !== undefined ||
      command.updates.metaDescription !== undefined ||
      command.updates.metaKeywords !== undefined
    ) {
      product.updateSeo({
        metaTitle: command.updates.metaTitle,
        metaDescription: command.updates.metaDescription,
        metaKeywords: command.updates.metaKeywords,
      });
      updatedFields.push('seo');
    }

    // Update tags
    if (command.updates.tags) {
      // Clear existing tags and add new ones
      for (const tag of product.tags) {
        product.removeTag(tag);
      }
      for (const tag of command.updates.tags) {
        product.addTag(tag);
      }
      updatedFields.push('tags');
    }

    // Update metadata
    if (command.updates.metadata) {
      product.updateMetadata(command.updates.metadata);
      updatedFields.push('metadata');
    }

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
}
