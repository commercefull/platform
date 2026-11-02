/**
 * ProductRelationship Domain Entity
 *
 * A merchant-curated link between two products, created during product setup.
 * Types drive which storefront placement shows the link:
 * - 'related'    → alternatives ("You may also like")
 * - 'accessory' / 'cross_sell' → complements ("Complete your purchase")
 * - 'up_sell'    → premium option ("Upgrade")
 * - 'grouped'    → grouped-product children (not a recommendation)
 * - 'bundle'     → reserved for the bundles feature (not a recommendation)
 *
 * `isAutomated = true` marks a link the merchant accepted from a computed
 * suggestion (recommendation module). It is still a manual link — automated
 * recommendation writes never overwrite or delete merchant links.
 */

export type ProductRelationType = 'related' | 'accessory' | 'bundle' | 'cross_sell' | 'up_sell' | 'grouped';

export const PRODUCT_RELATION_TYPES: ProductRelationType[] = ['related', 'accessory', 'bundle', 'cross_sell', 'up_sell', 'grouped'];


export interface ProductRelationshipProps {
  productRelatedId: string;
  productId: string;
  relatedProductId: string;
  type: ProductRelationType;
  position: number;
  isAutomated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductRelationshipCreateProps = Omit<ProductRelationshipProps, 'productRelatedId' | 'createdAt' | 'updatedAt'>;


