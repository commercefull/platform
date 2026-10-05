/**
 * CollectionMap Entity
 *
 * Manual membership entry linking a product to a collection with a
 * merchandising position. `addedManually` distinguishes merchant-curated
 * entries from rule-evaluated ones (reserved for persisted smart membership).
 */

export interface CollectionMapProps {
  assortmentCollectionMapId: string;
  assortmentCollectionId: string;
  productId: string;
  position: number;
  addedManually: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CollectionMap {
  private constructor(private readonly props: CollectionMapProps) {}

  static create(params: {
    assortmentCollectionMapId: string;
    assortmentCollectionId: string;
    productId: string;
    position?: number;
    addedManually?: boolean;
  }): CollectionMap {
    const now = new Date();
    return new CollectionMap({
      assortmentCollectionMapId: params.assortmentCollectionMapId,
      assortmentCollectionId: params.assortmentCollectionId,
      productId: params.productId,
      position: params.position ?? 0,
      addedManually: params.addedManually ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CollectionMapProps): CollectionMap {
    return new CollectionMap(props);
  }

  get assortmentCollectionMapId(): string {
    return this.props.assortmentCollectionMapId;
  }
  get assortmentCollectionId(): string {
    return this.props.assortmentCollectionId;
  }
  get productId(): string {
    return this.props.productId;
  }
  get position(): number {
    return this.props.position;
  }
  get addedManually(): boolean {
    return this.props.addedManually;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): Record<string, unknown> {
    return {
      assortmentCollectionMapId: this.props.assortmentCollectionMapId,
      assortmentCollectionId: this.props.assortmentCollectionId,
      productId: this.props.productId,
      position: this.props.position,
      addedManually: this.props.addedManually,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
