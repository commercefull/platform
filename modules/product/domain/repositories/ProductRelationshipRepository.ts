/**
 * ProductRelationshipRepository — domain port for curated product links.
 *
 * Persisted in the `productRelated` table. Implemented by
 * `infrastructure/repositories/productRelationshipRepo.ts`.
 */

import type { ProductRelationType, ProductRelationshipProps, ProductRelationshipCreateProps } from '../entities/ProductRelationship';

export interface ProductRelationshipRepository {
  findById(productRelatedId: string): Promise<ProductRelationshipProps | null>;
  findByProductId(productId: string, type?: ProductRelationType): Promise<ProductRelationshipProps[]>;
  findReverseRelationships(productId: string, type?: ProductRelationType): Promise<ProductRelationshipProps[]>;
  exists(productId: string, relatedProductId: string, type: ProductRelationType): Promise<boolean>;
  create(params: ProductRelationshipCreateProps): Promise<ProductRelationshipProps>;
  createBidirectional(
    productId1: string,
    productId2: string,
    type: ProductRelationType,
  ): Promise<{ forward: ProductRelationshipProps; reverse: ProductRelationshipProps }>;
  update(
    productRelatedId: string,
    params: Partial<Pick<ProductRelationshipProps, 'type' | 'position' | 'isAutomated'>>,
  ): Promise<ProductRelationshipProps | null>;
  bulkReorder(updates: Array<{ productRelatedId: string; position: number }>): Promise<boolean>;
  delete(productRelatedId: string): Promise<boolean>;
  deleteRelationship(productId: string, relatedProductId: string, type: ProductRelationType): Promise<boolean>;
  deleteAllByProductId(productId: string): Promise<number>;
}
