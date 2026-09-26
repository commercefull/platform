/**
 * Apply Attribute Set Use Case
 * Applies a product attribute set to a product: copies each attribute's
 * default value into the product's dynamic attributes.
 */

import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import type { DynamicAttributePort } from '../../domain/repositories/ProductCatalogPorts';
import { ProductNotFoundError, AttributeSetNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';

// ============================================================================
// Ports
// ============================================================================

export interface AttributeSetWithDefaults {
  attributes: Array<{
    productAttributeId: string;
    defaultValue?: string | null;
  }>;
}

export interface AttributeSetLookupPort {
  findByIdWithAttributes(id: string): Promise<AttributeSetWithDefaults | null>;
}

// ============================================================================
// Use Case
// ============================================================================

export class ApplyAttributeSetUseCase {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly attributeSetRepo: AttributeSetLookupPort,
    private readonly dynamicAttributeRepo: Pick<DynamicAttributePort, 'setProductAttributes'>,
  ) {}

  async execute(productId: string, attributeSetId: string): Promise<{ applied: boolean; attributeSetId: string; attributesAssigned: number }> {
    if (!attributeSetId) {
      throw new ProductValidationError('attributeSetId is required');
    }

    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const setWithAttrs = await this.attributeSetRepo.findByIdWithAttributes(attributeSetId);
    if (!setWithAttrs) {
      throw new AttributeSetNotFoundError(attributeSetId);
    }

    const attrsToSet = setWithAttrs.attributes.map(attr => ({
      attributeId: attr.productAttributeId,
      value: attr.defaultValue || '',
    }));

    if (attrsToSet.length > 0) {
      await this.dynamicAttributeRepo.setProductAttributes(productId, attrsToSet);
    }

    return { applied: true, attributeSetId, attributesAssigned: attrsToSet.length };
  }
}
