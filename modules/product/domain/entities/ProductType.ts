/**
 * ProductType Entity
 * Represents a type of product (e.g., Simple, Configurable, Virtual, Downloadable, Bundle)
 * Each product type can have different attribute sets associated with it
 */
export interface ProductTypeProps {
  productTypeId: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttributeSetSummary {
  productAttributeSetId: string;
  name: string;
  code: string;
  attributeCount: number;
}

export class ProductType {
  private readonly props: ProductTypeProps;
  private attributeSets: AttributeSetSummary[] = [];

  constructor(props: ProductTypeProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.productTypeId;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Set the attribute sets for this product type
   */
  setAttributeSets(sets: AttributeSetSummary[]): void {
    this.attributeSets = sets;
  }

  /**
   * Get the attribute sets for this product type
   */
  getAttributeSets(): AttributeSetSummary[] {
    return this.attributeSets;
  }

  /**
   * Check if this product type has any attribute sets
   */
  hasAttributeSets(): boolean {
    return this.attributeSets.length > 0;
  }

  /**
   * Update the name
   */
  updateName(name: string): void {
    (this.props as any).name = name;
    (this.props as any).updatedAt = new Date();
  }

  /**
   * Convert to plain object
   */
  toObject(): ProductTypeProps & { attributeSets: AttributeSetSummary[] } {
    return {
      ...this.props,
      attributeSets: this.attributeSets,
    };
  }

  /**
   * Create a new ProductType instance
   */
  static create(props: Omit<ProductTypeProps, 'productTypeId' | 'createdAt' | 'updatedAt'> & { productTypeId?: string }): ProductType {
    const slug =
      props.slug ||
      props.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return new ProductType({
      ...props,
      slug,
      productTypeId: props.productTypeId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Predefined product types
   */
  static readonly SIMPLE = 'simple';
  static readonly CONFIGURABLE = 'configurable';
  static readonly VIRTUAL = 'virtual';
  static readonly DOWNLOADABLE = 'downloadable';
  static readonly BUNDLE = 'bundle';
  static readonly GROUPED = 'grouped';
  static readonly SUBSCRIPTION = 'subscription';
}

/**
 * Standard product type definitions
 */
export const StandardProductTypes = [
  { name: 'Simple', slug: 'simple' },
  { name: 'Configurable', slug: 'configurable' },
  { name: 'Virtual', slug: 'virtual' },
  { name: 'Downloadable', slug: 'downloadable' },
  { name: 'Bundle', slug: 'bundle' },
  { name: 'Grouped', slug: 'grouped' },
  { name: 'Subscription', slug: 'subscription' },
];
