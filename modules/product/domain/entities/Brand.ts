export interface BrandProps {
  brandId: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  countryOfOrigin?: string;
  status: BrandStatus;
  metadata?: Record<string, unknown>;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type BrandStatus = 'active' | 'inactive' | 'archived';

export class Brand {
  private props: BrandProps;

  private constructor(props: BrandProps) {
    this.props = props;
  }

  static create(props: {
    organizationId: string;
    name: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    countryOfOrigin?: string;
    externalId?: string;
    metadata?: Record<string, unknown>;
  }): Brand {
    const now = new Date();
    const slug = props.slug || Brand.generateSlug(props.name);
    return new Brand({
      brandId: crypto.randomUUID(),
      organizationId: props.organizationId,
      name: props.name,
      slug,
      description: props.description,
      logoUrl: props.logoUrl,
      website: props.website,
      countryOfOrigin: props.countryOfOrigin,
      status: 'active',
      externalId: props.externalId,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: BrandProps): Brand {
    return new Brand(props);
  }

  private static generateSlug(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  get brandId(): string { return this.props.brandId; }
  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug; }
  get description(): string | undefined { return this.props.description; }
  get logoUrl(): string | undefined { return this.props.logoUrl; }
  get website(): string | undefined { return this.props.website; }
  get countryOfOrigin(): string | undefined { return this.props.countryOfOrigin; }
  get status(): BrandStatus { return this.props.status; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get externalId(): string | undefined { return this.props.externalId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | undefined { return this.props.deletedAt; }

  updateProfile(updates: {
    name?: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    countryOfOrigin?: string;
  }): void {
    if (updates.name !== undefined) this.props.name = updates.name;
    if (updates.description !== undefined) this.props.description = updates.description;
    if (updates.logoUrl !== undefined) this.props.logoUrl = updates.logoUrl;
    if (updates.website !== undefined) this.props.website = updates.website;
    if (updates.countryOfOrigin !== undefined) this.props.countryOfOrigin = updates.countryOfOrigin;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    if (this.props.status === 'archived') return;
    this.props.status = 'inactive';
    this.props.updatedAt = new Date();
  }

  archive(): void {
    this.props.status = 'archived';
    this.props.updatedAt = new Date();
  }

  setExternalId(externalId: string): void {
    this.props.externalId = externalId;
    this.props.updatedAt = new Date();
  }

  toJSON(): BrandProps {
    return { ...this.props };
  }
}
