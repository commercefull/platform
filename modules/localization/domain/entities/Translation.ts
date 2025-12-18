/**
 * Translation Entity
 * Generic translation entity for multi-language content
 */

export type TranslatableEntityType = 
  | 'product'
  | 'category'
  | 'collection'
  | 'brand'
  | 'contentPage'
  | 'notificationTemplate'
  | 'attribute'
  | 'attributeOption';

export interface TranslationProps {
  translationId: string;
  entityType: TranslatableEntityType;
  entityId: string;
  localeId: string;
  localeCode: string;
  // Common translatable fields
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  // Additional content (JSON for flexible storage)
  additionalFields?: Record<string, any>;
  // Translation metadata
  isAutoTranslated: boolean;
  translationSource?: string; // manual, google, deepl, ai
  translationQuality?: number; // 0-1 confidence score
  isApproved: boolean;
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Translation {
  private props: TranslationProps;

  private constructor(props: TranslationProps) {
    this.props = props;
  }

  static create(params: {
    translationId: string;
    entityType: TranslatableEntityType;
    entityId: string;
    localeId: string;
    localeCode: string;
    name?: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    additionalFields?: Record<string, any>;
    isAutoTranslated?: boolean;
    translationSource?: string;
    translationQuality?: number;
  }): Translation {
    const now = new Date();
    return new Translation({
      translationId: params.translationId,
      entityType: params.entityType,
      entityId: params.entityId,
      localeId: params.localeId,
      localeCode: params.localeCode,
      name: params.name,
      slug: params.slug,
      description: params.description,
      shortDescription: params.shortDescription,
      metaTitle: params.metaTitle,
      metaDescription: params.metaDescription,
      metaKeywords: params.metaKeywords,
      additionalFields: params.additionalFields,
      isAutoTranslated: params.isAutoTranslated || false,
      translationSource: params.translationSource || 'manual',
      translationQuality: params.translationQuality,
      isApproved: false,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: TranslationProps): Translation {
    return new Translation(props);
  }

  // Getters
  get translationId(): string { return this.props.translationId; }
  get entityType(): TranslatableEntityType { return this.props.entityType; }
  get entityId(): string { return this.props.entityId; }
  get localeId(): string { return this.props.localeId; }
  get localeCode(): string { return this.props.localeCode; }
  get name(): string | undefined { return this.props.name; }
  get slug(): string | undefined { return this.props.slug; }
  get description(): string | undefined { return this.props.description; }
  get shortDescription(): string | undefined { return this.props.shortDescription; }
  get metaTitle(): string | undefined { return this.props.metaTitle; }
  get metaDescription(): string | undefined { return this.props.metaDescription; }
  get metaKeywords(): string | undefined { return this.props.metaKeywords; }
  get additionalFields(): Record<string, any> | undefined { return this.props.additionalFields; }
  get isAutoTranslated(): boolean { return this.props.isAutoTranslated; }
  get translationSource(): string | undefined { return this.props.translationSource; }
  get translationQuality(): number | undefined { return this.props.translationQuality; }
  get isApproved(): boolean { return this.props.isApproved; }
  get reviewedAt(): Date | undefined { return this.props.reviewedAt; }
  get reviewedBy(): string | undefined { return this.props.reviewedBy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * Update translation content
   */
  update(params: {
    name?: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    additionalFields?: Record<string, any>;
  }): void {
    if (params.name !== undefined) this.props.name = params.name;
    if (params.slug !== undefined) this.props.slug = params.slug;
    if (params.description !== undefined) this.props.description = params.description;
    if (params.shortDescription !== undefined) this.props.shortDescription = params.shortDescription;
    if (params.metaTitle !== undefined) this.props.metaTitle = params.metaTitle;
    if (params.metaDescription !== undefined) this.props.metaDescription = params.metaDescription;
    if (params.metaKeywords !== undefined) this.props.metaKeywords = params.metaKeywords;
    if (params.additionalFields !== undefined) this.props.additionalFields = params.additionalFields;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as auto-translated
   */
  markAsAutoTranslated(source: string, quality?: number): void {
    this.props.isAutoTranslated = true;
    this.props.translationSource = source;
    this.props.translationQuality = quality;
    this.props.isApproved = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Approve the translation
   */
  approve(reviewerId: string): void {
    this.props.isApproved = true;
    this.props.reviewedAt = new Date();
    this.props.reviewedBy = reviewerId;
    this.props.updatedAt = new Date();
  }

  /**
   * Reject approval (needs review)
   */
  rejectApproval(): void {
    this.props.isApproved = false;
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
