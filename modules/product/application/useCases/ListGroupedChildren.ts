/**
 * List Grouped Children Use Case
 * Resolves the child products of a grouped product via its 'grouped' relationships
 */

import type { ProductRepository } from '../../domain/repositories/ProductRepository';

// ============================================================================
// Ports
// ============================================================================

export type GroupedRelationType = 'related' | 'accessory' | 'bundle' | 'cross_sell' | 'up_sell' | 'grouped';

export interface ProductRelationshipRecord {
  productRelatedId: string;
  productId: string;
  relatedProductId: string;
  type: GroupedRelationType;
}

export interface ProductRelationshipReadPort {
  findByProductId(productId: string, type?: GroupedRelationType): Promise<ProductRelationshipRecord[]>;
}

// ============================================================================
// Use Case
// ============================================================================

export class ListGroupedChildrenUseCase {
  constructor(
    private readonly relationshipRepo: ProductRelationshipReadPort,
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(productId: string): Promise<Record<string, unknown>[]> {
    const relationships = await this.relationshipRepo.findByProductId(productId, 'grouped');

    const children: Record<string, unknown>[] = [];
    for (const rel of relationships) {
      const product = await this.productRepo.findById(rel.relatedProductId);
      if (product) children.push(product.toJSON());
    }
    return children;
  }
}
