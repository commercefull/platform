/**
 * Create Product Variant Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import { ProductVariantRepository } from '../../infrastructure/repositories/ProductVariantRepository';

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
    public readonly basePrice?: number,
    public readonly compareAtPrice?: number,
    public readonly currencyCode?: string,
    public readonly trackInventory?: boolean,
    public readonly inventoryQuantity?: number,
    public readonly allowBackorders?: boolean,
    public readonly lowStockThreshold?: number,
    public readonly isDefault?: boolean,
    public readonly sortOrder?: number,
    public readonly metadata?: Record<string, any>
  ) {}
}

export class CreateProductVariantUseCase {
  constructor(private readonly variantRepository: ProductVariantRepository) {}

  async execute(command: CreateProductVariantCommand): Promise<ProductVariant> {
    const variantId = generateUUID();

    // Generate variant name from attributes
    const attributes = command.attributes.map((attr, index) => ({
      attributeId: attr.attributeId,
      attributeName: attr.attributeName,
      value: attr.value,
      displayValue: attr.displayValue || attr.value,
      displayOrder: attr.displayOrder || index
    }));

    const variantName = `${command.productId} - ${attributes.map(a => a.displayValue).join(' - ')}`;

    const variant = ProductVariant.create({
      variantId,
      productId: command.productId,
      sku: command.sku,
      name: variantName,
      attributes,
      basePrice: command.basePrice || 0,
      salePrice: command.compareAtPrice,
      currencyCode: command.currencyCode,
      stockQuantity: command.inventoryQuantity,
      lowStockThreshold: command.lowStockThreshold,
      isDefault: command.isDefault,
      position: command.sortOrder,
      metadata: command.metadata
    });

    return await this.variantRepository.save(variant);
  }
}
