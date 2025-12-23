/**
 * Product Category Entity
 * Represents a category for organizing products
 */

export interface CategoryProps {
  categoryId: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  level: number;
  path: string;
  imageUrl?: string;
  iconUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  position: number;
  productCount: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductCategory {
  private props: CategoryProps;

  private constructor(props: CategoryProps) {
    this.props = props;
  }

  static create(props: {
    categoryId: string;
    name: string;
    description?: string;
    slug?: string;
    parentId?: string;
    parentPath?: string;
    imageUrl?: string;
    iconUrl?: string;
    isFeatured?: boolean;
    position?: number;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    metadata?: Record<string, any>;
  }): ProductCategory {
    const now = new Date();
    const slug = props.slug || ProductCategory.generateSlug(props.name);
    const level = props.parentPath ? props.parentPath.split('/').filter(Boolean).length + 1 : 0;
    const path = props.parentPath ? `${props.parentPath}/${props.categoryId}` : props.categoryId;

    return new ProductCategory({
      categoryId: props.categoryId,
      name: props.name,
      description: props.description,
      slug,
      parentId: props.parentId,
      level,
      path,
      imageUrl: props.imageUrl,
      iconUrl: props.iconUrl,
      isActive: true,
      isFeatured: props.isFeatured || false,
      position: props.position || 0,
      productCount: 0,
      metaTitle: props.metaTitle,
      metaDescription: props.metaDescription,
      metaKeywords: props.metaKeywords,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CategoryProps): ProductCategory {
    return new ProductCategory(props);
  }

  // Getters
  get categoryId(): string {
    return this.props.categoryId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get slug(): string {
    return this.props.slug;
  }
  get parentId(): string | undefined {
    return this.props.parentId;
  }
  get level(): number {
    return this.props.level;
  }
  get path(): string {
    return this.props.path;
  }
  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }
  get iconUrl(): string | undefined {
    return this.props.iconUrl;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get isFeatured(): boolean {
    return this.props.isFeatured;
  }
  get position(): number {
    return this.props.position;
  }
  get productCount(): number {
    return this.props.productCount;
  }
  get metaTitle(): string | undefined {
    return this.props.metaTitle;
  }
  get metaDescription(): string | undefined {
    return this.props.metaDescription;
  }
  get metaKeywords(): string | undefined {
    return this.props.metaKeywords;
  }
  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed properties
  get isRootCategory(): boolean {
    return this.props.parentId === undefined;
  }

  get hasProducts(): boolean {
    return this.props.productCount > 0;
  }

  get ancestorIds(): string[] {
    return this.props.path.split('/').filter(id => id !== this.props.categoryId);
  }

  // Domain methods
  updateInfo(updates: { name?: string; description?: string; slug?: string }): void {
    if (updates.name) {
      this.props.name = updates.name;
      if (!updates.slug) {
        this.props.slug = ProductCategory.generateSlug(updates.name);
      }
    }
    if (updates.description !== undefined) this.props.description = updates.description;
    if (updates.slug) this.props.slug = updates.slug;
    this.touch();
  }

  setImage(imageUrl: string): void {
    this.props.imageUrl = imageUrl;
    this.touch();
  }

  removeImage(): void {
    this.props.imageUrl = undefined;
    this.touch();
  }

  setIcon(iconUrl: string): void {
    this.props.iconUrl = iconUrl;
    this.touch();
  }

  removeIcon(): void {
    this.props.iconUrl = undefined;
    this.touch();
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  setFeatured(featured: boolean): void {
    this.props.isFeatured = featured;
    this.touch();
  }

  updatePosition(position: number): void {
    this.props.position = position;
    this.touch();
  }

  updateProductCount(count: number): void {
    this.props.productCount = count;
    this.touch();
  }

  incrementProductCount(): void {
    this.props.productCount += 1;
    this.touch();
  }

  decrementProductCount(): void {
    if (this.props.productCount > 0) {
      this.props.productCount -= 1;
    }
    this.touch();
  }

  moveToParent(parentId: string | undefined, parentPath: string): void {
    this.props.parentId = parentId;
    this.props.level = parentPath ? parentPath.split('/').filter(Boolean).length + 1 : 0;
    this.props.path = parentPath ? `${parentPath}/${this.props.categoryId}` : this.props.categoryId;
    this.touch();
  }

  updateSeo(seo: { metaTitle?: string; metaDescription?: string; metaKeywords?: string }): void {
    if (seo.metaTitle !== undefined) this.props.metaTitle = seo.metaTitle;
    if (seo.metaDescription !== undefined) this.props.metaDescription = seo.metaDescription;
    if (seo.metaKeywords !== undefined) this.props.metaKeywords = seo.metaKeywords;
    this.touch();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 200);
  }

  toJSON(): Record<string, any> {
    return {
      categoryId: this.props.categoryId,
      name: this.props.name,
      description: this.props.description,
      slug: this.props.slug,
      parentId: this.props.parentId,
      level: this.props.level,
      path: this.props.path,
      imageUrl: this.props.imageUrl,
      iconUrl: this.props.iconUrl,
      isActive: this.props.isActive,
      isFeatured: this.props.isFeatured,
      isRootCategory: this.isRootCategory,
      position: this.props.position,
      productCount: this.props.productCount,
      metaTitle: this.props.metaTitle,
      metaDescription: this.props.metaDescription,
      metaKeywords: this.props.metaKeywords,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
