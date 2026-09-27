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

/** Relation types that drive recommendation placements. */
export const RECOMMENDATION_RELATION_TYPES: ProductRelationType[] = ['related', 'accessory', 'cross_sell', 'up_sell'];

export interface ProductRelationshipProps {
  productRelatedId: string;
  productId: string;
  relatedProductId: string;
  type: ProductRelationType;
  position: number;
  isAutomated: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductRelationshipCreateProps = Omit<ProductRelationshipProps, 'productRelatedId' | 'createdAt' | 'updatedAt'>;

export class ProductRelationship {
  private constructor(private readonly props: ProductRelationshipProps) {}

  static create(
    props: Omit<ProductRelationshipProps, 'productRelatedId' | 'createdAt' | 'updatedAt' | 'position' | 'isAutomated'> &
      Partial<Pick<ProductRelationshipProps, 'position' | 'isAutomated'>>,
  ): ProductRelationshipCreateProps {
    if (props.productId === props.relatedProductId) {
      throw new Error('Product cannot be related to itself');
    }
    return {
      productId: props.productId,
      relatedProductId: props.relatedProductId,
      type: props.type || 'related',
      position: props.position ?? 0,
      isAutomated: props.isAutomated ?? false,
    };
  }

  static reconstitute(props: ProductRelationshipProps): ProductRelationship {
    return new ProductRelationship(props);
  }

  get productRelatedId(): string {
    return this.props.productRelatedId;
  }
  get productId(): string {
    return this.props.productId;
  }
  get relatedProductId(): string {
    return this.props.relatedProductId;
  }
  get type(): ProductRelationType {
    return this.props.type;
  }
  get position(): number {
    return this.props.position;
  }
  get isAutomated(): boolean {
    return this.props.isAutomated;
  }

  toJSON(): ProductRelationshipProps {
    return { ...this.props };
  }
}
