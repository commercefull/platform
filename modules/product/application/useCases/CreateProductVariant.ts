/**
 * Create Product Variant Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import type { ProductVariantPort } from '../../domain/repositories/ProductCatalogPorts';
import type { ProductPricingPort } from '../ports/ProductPricingPort';
import { ProductValidationError } from '../../domain/errors/ProductErrors';

export class CreateProductVariantCommand {
  constructor(
    public readonly productId: string,
    public readonly sku: string,
    public readonly attributes: Array<{
      attributeId: string;
      attributeName: string;
      value: string;
      displayValue?: string;
      displayOrder?: number;
    }>,
    /** Variant-level base price in integer cents — written to the pricing-owned store. */
    public readonly basePriceCents?: number,
    public readonly compareAtPriceCents?: number,
    public readonly currencyCode?: string,
    public readonly trackInventory?: boolean,
    public readonly inventoryQuantity?: number,
    public readonly allowBackorders?: boolean,
    public readonly lowStockThreshold?: number,
    public readonly isDefault?: boolean,
    public readonly sortOrder?: number,
    public readonly metadata?: Record<string, unknown>,
  ) {}
}

export class CreateProductVariantUseCase {
  constructor(
    private readonly variantRepository: ProductVariantPort,
    private readonly pricingPort: ProductPricingPort,
  ) {}

  async execute(command: CreateProductVariantCommand): Promise<ProductVariant> {
    const variantId = generateUUID();

    // Generate variant name from attributes
    const attributes = command.attributes.map((attr, index) => ({
      attributeId: attr.attributeId,
      attributeName: attr.attributeName,
      value: attr.value,
      displayValue: attr.displayValue || attr.value,
      displayOrder: attr.displayOrder || index,
    }));

    const variantName = `${command.productId} - ${attributes.map(a => a.displayValue).join(' - ')}`;

    const variant = ProductVariant.create({
      variantId,
      productId: command.productId,
      sku: command.sku,
      name: variantName,
      attributes,
      stockQuantity: command.inventoryQuantity,
      lowStockThreshold: command.lowStockThreshold,
      isDefault: command.isDefault,
      position: command.sortOrder,
      metadata: command.metadata,
    });

    const saved = (await this.variantRepository.save(variant)) as ProductVariant;

    // Persist the variant-level base price in the pricing-owned store when provided
    if (command.basePriceCents !== undefined) {
      if (!Number.isInteger(command.basePriceCents) || command.basePriceCents < 0) {
        throw new ProductValidationError('basePriceCents must be a non-negative integer');
      }
      await this.pricingPort.setBasePrice({
        productId: command.productId,
        productVariantId: variantId,
        currencyCode: command.currencyCode || 'USD',
        priceCents: command.basePriceCents,
        compareAtPriceCents: command.compareAtPriceCents ?? null,
      });
    }

    return saved;
  }
}
