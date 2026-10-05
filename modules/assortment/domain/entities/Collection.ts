/**
 * Collection Entity (Aggregate Root)
 *
 * A curated or rule-based grouping of products. Moved from modules/product —
 * collections are merchandising primitives owned by assortment.
 *
 * `isAutomated` + `conditions` define smart collections whose membership is
 * resolved at read time via CollectionRuleEvaluator → CatalogQueryPort.
 * `sortOrder` controls how resolved products are ordered.
 */

export type CollectionSortOrder = 'manual' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

export type CollectionConditionField = 'query' | 'categoryId' | 'brandId' | 'tag' | 'priceCents' | 'isFeatured';

export type CollectionConditionOperator = 'equals' | 'notEquals' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains';

export interface CollectionCondition {
  field: CollectionConditionField;
  operator: CollectionConditionOperator;
  value: string | number | boolean;
}

export interface CollectionProps {
  assortmentCollectionId: string;
  organizationId?: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  isFeatured: boolean;
  isAutomated: boolean;
  conditions?: CollectionCondition[];
  sortOrder: CollectionSortOrder;
  publishAt?: Date;
  unpublishAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Collection {
  private props: CollectionProps;

  private constructor(props: CollectionProps) {
    this.props = props;
  }

  static create(params: {
    assortmentCollectionId: string;
    organizationId?: string;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    bannerUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    isAutomated?: boolean;
    conditions?: CollectionCondition[];
    sortOrder?: CollectionSortOrder;
    publishAt?: Date;
    unpublishAt?: Date;
  }): Collection {
    const now = new Date();
    return new Collection({
      assortmentCollectionId: params.assortmentCollectionId,
      organizationId: params.organizationId,
      name: params.name,
      slug: params.slug,
      description: params.description,
      imageUrl: params.imageUrl,
      bannerUrl: params.bannerUrl,
      metaTitle: params.metaTitle,
      metaDescription: params.metaDescription,
      isActive: params.isActive ?? true,
      isFeatured: params.isFeatured ?? false,
      isAutomated: params.isAutomated ?? false,
      conditions: params.conditions,
      sortOrder: params.sortOrder ?? 'manual',
      publishAt: params.publishAt,
      unpublishAt: params.unpublishAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CollectionProps): Collection {
    return new Collection(props);
  }

  get assortmentCollectionId(): string {
    return this.props.assortmentCollectionId;
  }
  get organizationId(): string | undefined {
    return this.props.organizationId;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }
  get bannerUrl(): string | undefined {
    return this.props.bannerUrl;
  }
  get metaTitle(): string | undefined {
    return this.props.metaTitle;
  }
  get metaDescription(): string | undefined {
    return this.props.metaDescription;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get isFeatured(): boolean {
    return this.props.isFeatured;
  }
  get isAutomated(): boolean {
    return this.props.isAutomated;
  }
  get conditions(): CollectionCondition[] | undefined {
    return this.props.conditions;
  }
  get sortOrder(): CollectionSortOrder {
    return this.props.sortOrder;
  }
  get publishAt(): Date | undefined {
    return this.props.publishAt;
  }
  get unpublishAt(): Date | undefined {
    return this.props.unpublishAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  isPublished(now: Date = new Date()): boolean {
    if (!this.props.isActive || this.props.deletedAt) return false;
    if (this.props.publishAt && this.props.publishAt > now) return false;
    if (this.props.unpublishAt && this.props.unpublishAt <= now) return false;
    return true;
  }

  update(details: {
    name?: string;
    slug?: string;
    description?: string | null;
    imageUrl?: string | null;
    bannerUrl?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    isActive?: boolean;
    isFeatured?: boolean;
    isAutomated?: boolean;
    conditions?: CollectionCondition[] | null;
    sortOrder?: CollectionSortOrder;
    publishAt?: Date | null;
    unpublishAt?: Date | null;
    organizationId?: string | null;
  }): void {
    const p = this.props;
    if (details.name !== undefined) p.name = details.name;
    if (details.slug !== undefined) p.slug = details.slug;
    if (details.description !== undefined) p.description = details.description ?? undefined;
    if (details.imageUrl !== undefined) p.imageUrl = details.imageUrl ?? undefined;
    if (details.bannerUrl !== undefined) p.bannerUrl = details.bannerUrl ?? undefined;
    if (details.metaTitle !== undefined) p.metaTitle = details.metaTitle ?? undefined;
    if (details.metaDescription !== undefined) p.metaDescription = details.metaDescription ?? undefined;
    if (details.isActive !== undefined) p.isActive = details.isActive;
    if (details.isFeatured !== undefined) p.isFeatured = details.isFeatured;
    if (details.isAutomated !== undefined) p.isAutomated = details.isAutomated;
    if (details.conditions !== undefined) p.conditions = details.conditions ?? undefined;
    if (details.sortOrder !== undefined) p.sortOrder = details.sortOrder;
    if (details.publishAt !== undefined) p.publishAt = details.publishAt ?? undefined;
    if (details.unpublishAt !== undefined) p.unpublishAt = details.unpublishAt ?? undefined;
    if (details.organizationId !== undefined) p.organizationId = details.organizationId ?? undefined;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      assortmentCollectionId: this.props.assortmentCollectionId,
      organizationId: this.props.organizationId,
      name: this.props.name,
      slug: this.props.slug,
      description: this.props.description,
      imageUrl: this.props.imageUrl,
      bannerUrl: this.props.bannerUrl,
      metaTitle: this.props.metaTitle,
      metaDescription: this.props.metaDescription,
      isActive: this.props.isActive,
      isFeatured: this.props.isFeatured,
      isAutomated: this.props.isAutomated,
      conditions: this.props.conditions,
      sortOrder: this.props.sortOrder,
      publishAt: this.props.publishAt,
      unpublishAt: this.props.unpublishAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
