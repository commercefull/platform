/**
 * Brand Entity
 * 
 * Represents a product brand in the catalog.
 */

export interface BrandProps {
  brandId: string;
  name: string;
  slug: string;
  description?: string;
  logoMediaId?: string;
  coverImageMediaId?: string;
  website?: string;
  countryOfOrigin?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Brand {
  private props: BrandProps;

  private constructor(props: BrandProps) {
    this.props = props;
  }

  get brandId(): string { return this.props.brandId; }
  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug; }
  get description(): string | undefined { return this.props.description; }
  get logoMediaId(): string | undefined { return this.props.logoMediaId; }
  get coverImageMediaId(): string | undefined { return this.props.coverImageMediaId; }
  get website(): string | undefined { return this.props.website; }
  get countryOfOrigin(): string | undefined { return this.props.countryOfOrigin; }
  get isActive(): boolean { return this.props.isActive; }
  get isFeatured(): boolean { return this.props.isFeatured; }
  get sortOrder(): number { return this.props.sortOrder; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static create(props: Omit<BrandProps, 'brandId' | 'createdAt' | 'updatedAt' | 'slug'> & { slug?: string }): Brand {
    const now = new Date();
    return new Brand({
      ...props,
      brandId: generateBrandId(),
      slug: props.slug || generateSlug(props.name),
      isActive: props.isActive ?? true,
      isFeatured: props.isFeatured ?? false,
      sortOrder: props.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: BrandProps): Brand {
    return new Brand(props);
  }

  update(updates: Partial<Omit<BrandProps, 'brandId' | 'createdAt'>>): void {
    Object.assign(this.props, updates, { updatedAt: new Date() });
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  feature(): void {
    this.props.isFeatured = true;
    this.props.updatedAt = new Date();
  }

  unfeature(): void {
    this.props.isFeatured = false;
    this.props.updatedAt = new Date();
  }

  setLogo(mediaId: string): void {
    this.props.logoMediaId = mediaId;
    this.props.updatedAt = new Date();
  }

  setCoverImage(mediaId: string): void {
    this.props.coverImageMediaId = mediaId;
    this.props.updatedAt = new Date();
  }

  toPersistence(): BrandProps {
    return { ...this.props };
  }
}

function generateBrandId(): string {
  return `brd_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
