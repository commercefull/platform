/**
 * Product Aggregate Root
 * The main entity that manages product lifecycle and business logic
 */

import { ProductStatus, canTransitionProductTo } from '../valueObjects/ProductStatus';
import { ProductVisibility } from '../valueObjects/ProductVisibility';
import { Price } from '../valueObjects/Price';
import { Dimensions } from '../valueObjects/Dimensions';

export interface ProductImage {
  imageId: string;
  url: string;
  altText?: string;
  position: number;
  isPrimary: boolean;
  // New fields for processed images
  webpUrl?: string;
  thumbnailUrl?: string;
  responsiveUrls?: Record<string, string>;
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    format?: string;
  };
}

export interface ProductProps {
  productId: string;
  name: string;
  description: string;
  shortDescription?: string;
  sku?: string;
  slug: string;
  productTypeId: string;
  categoryId?: string;
  brandId?: string;
  merchantId?: string;  // For marketplace products owned by merchants
  businessId?: string;  // For multi-store products owned by businesses
  storeId?: string;     // For store-specific product overrides
  status: ProductStatus;
  visibility: ProductVisibility;
  price: Price;
  dimensions: Dimensions;
  isFeatured: boolean;
  isVirtual: boolean;
  isDownloadable: boolean;
  isSubscription: boolean;
  isTaxable: boolean;
  taxClass?: string;
  hasVariants: boolean;
  variantAttributes?: Record<string, any>;
  images: ProductImage[];
  primaryImageId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  returnPolicy?: string;
  warranty?: string;
  externalId?: string;
  tags: string[];
  metadata?: Record<string, any>;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Product {
  private props: ProductProps;

  private constructor(props: ProductProps) {
    this.props = props;
  }

  static create(props: {
    productId: string;
    name: string;
    description: string;
    productTypeId: string;
    slug?: string;
    shortDescription?: string;
    sku?: string;
    categoryId?: string;
    brandId?: string;
    merchantId?: string;
    businessId?: string;
    storeId?: string;
    basePrice?: number;
    salePrice?: number;
    cost?: number;
    currencyCode?: string;
    weight?: number;
    weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
    isFeatured?: boolean;
    isVirtual?: boolean;
    isDownloadable?: boolean;
    isSubscription?: boolean;
    isTaxable?: boolean;
    taxClass?: string;
    hasVariants?: boolean;
    variantAttributes?: Record<string, any>;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    minOrderQuantity?: number;
    maxOrderQuantity?: number;
    returnPolicy?: string;
    warranty?: string;
    externalId?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Product {
    const now = new Date();
    const slug = props.slug || Product.generateSlug(props.name);

    // Validate ownership - products must be owned by either merchant or business
    if (!props.merchantId && !props.businessId) {
      throw new Error('Product must be owned by either a merchant or business');
    }

    return new Product({
      productId: props.productId,
      name: props.name,
      description: props.description,
      shortDescription: props.shortDescription,
      sku: props.sku,
      slug,
      productTypeId: props.productTypeId,
      categoryId: props.categoryId,
      brandId: props.brandId,
      merchantId: props.merchantId,
      businessId: props.businessId,
      storeId: props.storeId,
      status: ProductStatus.DRAFT,
      visibility: ProductVisibility.HIDDEN,
      price: Price.create(
        props.basePrice || 0,
        props.currencyCode || 'USD',
        props.salePrice,
        props.cost
      ),
      dimensions: Dimensions.create({
        weight: props.weight,
        weightUnit: props.weightUnit,
        length: props.length,
        width: props.width,
        height: props.height,
        dimensionUnit: props.dimensionUnit
      }),
      isFeatured: props.isFeatured || false,
      isVirtual: props.isVirtual || false,
      isDownloadable: props.isDownloadable || false,
      isSubscription: props.isSubscription || false,
      isTaxable: props.isTaxable !== false,
      taxClass: props.taxClass,
      hasVariants: props.hasVariants || false,
      variantAttributes: props.variantAttributes,
      images: [],
      metaTitle: props.metaTitle,
      metaDescription: props.metaDescription,
      metaKeywords: props.metaKeywords,
      minOrderQuantity: props.minOrderQuantity || 1,
      maxOrderQuantity: props.maxOrderQuantity,
      returnPolicy: props.returnPolicy,
      warranty: props.warranty,
      externalId: props.externalId,
      tags: props.tags || [],
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  // Getters
  get productId(): string { return this.props.productId; }
  get name(): string { return this.props.name; }
  get description(): string { return this.props.description; }
  get shortDescription(): string | undefined { return this.props.shortDescription; }
  get sku(): string | undefined { return this.props.sku; }
  get slug(): string { return this.props.slug; }
  get productTypeId(): string { return this.props.productTypeId; }
  get categoryId(): string | undefined { return this.props.categoryId; }
  get brandId(): string | undefined { return this.props.brandId; }
  get merchantId(): string | undefined { return this.props.merchantId; }
  get businessId(): string | undefined { return this.props.businessId; }
  get storeId(): string | undefined { return this.props.storeId; }
  get ownerId(): string { return this.props.merchantId || this.props.businessId!; }
  get isMerchantOwned(): boolean { return !!this.props.merchantId; }
  get isBusinessOwned(): boolean { return !!this.props.businessId; }
  get isStoreSpecific(): boolean { return !!this.props.storeId; }
  get status(): ProductStatus { return this.props.status; }
  get visibility(): ProductVisibility { return this.props.visibility; }
  get price(): Price { return this.props.price; }
  get dimensions(): Dimensions { return this.props.dimensions; }
  get isFeatured(): boolean { return this.props.isFeatured; }
  get isVirtual(): boolean { return this.props.isVirtual; }
  get isDownloadable(): boolean { return this.props.isDownloadable; }
  get isSubscription(): boolean { return this.props.isSubscription; }
  get isTaxable(): boolean { return this.props.isTaxable; }
  get taxClass(): string | undefined { return this.props.taxClass; }
  get hasVariants(): boolean { return this.props.hasVariants; }
  get variantAttributes(): Record<string, any> | undefined { return this.props.variantAttributes; }
  get images(): ProductImage[] { return [...this.props.images]; }
  get primaryImageId(): string | undefined { return this.props.primaryImageId; }
  get metaTitle(): string | undefined { return this.props.metaTitle; }
  get metaDescription(): string | undefined { return this.props.metaDescription; }
  get metaKeywords(): string | undefined { return this.props.metaKeywords; }
  get minOrderQuantity(): number { return this.props.minOrderQuantity; }
  get maxOrderQuantity(): number | undefined { return this.props.maxOrderQuantity; }
  get returnPolicy(): string | undefined { return this.props.returnPolicy; }
  get warranty(): string | undefined { return this.props.warranty; }
  get externalId(): string | undefined { return this.props.externalId; }
  get tags(): string[] { return [...this.props.tags]; }
  get metadata(): Record<string, any> | undefined { return this.props.metadata; }
  get publishedAt(): Date | undefined { return this.props.publishedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | undefined { return this.props.deletedAt; }

  // Computed properties
  get isActive(): boolean { return this.props.status === ProductStatus.ACTIVE; }
  get isDraft(): boolean { return this.props.status === ProductStatus.DRAFT; }
  get isArchived(): boolean { return this.props.status === ProductStatus.ARCHIVED; }
  get isVisible(): boolean { return this.props.visibility === ProductVisibility.VISIBLE; }
  get isPublished(): boolean { return this.props.publishedAt !== undefined; }
  
  get primaryImage(): ProductImage | undefined {
    return this.props.images.find(img => img.isPrimary) || this.props.images[0];
  }

  get isPurchasable(): boolean {
    return this.isActive && (this.isVisible || this.props.visibility === ProductVisibility.FEATURED);
  }

  // Domain methods
  updateBasicInfo(updates: {
    name?: string;
    description?: string;
    shortDescription?: string;
    sku?: string;
  }): void {
    if (updates.name) {
      this.props.name = updates.name;
      this.props.slug = Product.generateSlug(updates.name);
    }
    if (updates.description !== undefined) this.props.description = updates.description;
    if (updates.shortDescription !== undefined) this.props.shortDescription = updates.shortDescription;
    if (updates.sku !== undefined) this.props.sku = updates.sku;
    this.touch();
  }

  updatePrice(basePrice: number, salePrice?: number, cost?: number): void {
    this.props.price = Price.create(basePrice, this.props.price.currency, salePrice, cost);
    this.touch();
  }

  setSalePrice(salePrice: number | null): void {
    this.props.price = this.props.price.setSalePrice(salePrice);
    this.touch();
  }

  updateDimensions(dimensions: {
    weight?: number;
    weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
  }): void {
    this.props.dimensions = Dimensions.create(dimensions);
    this.touch();
  }

  updateStatus(newStatus: ProductStatus): void {
    if (!canTransitionProductTo(this.props.status, newStatus)) {
      throw new Error(`Cannot transition product from ${this.props.status} to ${newStatus}`);
    }
    this.props.status = newStatus;
    this.touch();
  }

  updateVisibility(visibility: ProductVisibility): void {
    this.props.visibility = visibility;
    this.touch();
  }

  publish(): void {
    if (this.props.status !== ProductStatus.ACTIVE) {
      throw new Error('Product must be active to publish');
    }
    this.props.publishedAt = new Date();
    this.props.visibility = ProductVisibility.VISIBLE;
    this.touch();
  }

  unpublish(): void {
    this.props.visibility = ProductVisibility.HIDDEN;
    this.touch();
  }

  setFeatured(featured: boolean): void {
    this.props.isFeatured = featured;
    if (featured && this.props.visibility === ProductVisibility.VISIBLE) {
      this.props.visibility = ProductVisibility.FEATURED;
    } else if (!featured && this.props.visibility === ProductVisibility.FEATURED) {
      this.props.visibility = ProductVisibility.VISIBLE;
    }
    this.touch();
  }

  assignCategory(categoryId: string): void {
    this.props.categoryId = categoryId;
    this.touch();
  }

  removeCategory(): void {
    this.props.categoryId = undefined;
    this.touch();
  }

  assignBrand(brandId: string): void {
    this.props.brandId = brandId;
    this.touch();
  }

  addImage(image: ProductImage): void {
    const existingIndex = this.props.images.findIndex(img => img.imageId === image.imageId);
    if (existingIndex >= 0) {
      this.props.images[existingIndex] = image;
    } else {
      this.props.images.push(image);
    }
    
    if (image.isPrimary) {
      this.props.primaryImageId = image.imageId;
      this.props.images.forEach(img => {
        if (img.imageId !== image.imageId) {
          img.isPrimary = false;
        }
      });
    }
    
    this.sortImages();
    this.touch();
  }

  removeImage(imageId: string): void {
    const index = this.props.images.findIndex(img => img.imageId === imageId);
    if (index >= 0) {
      const removed = this.props.images.splice(index, 1)[0];
      if (removed.isPrimary && this.props.images.length > 0) {
        this.props.images[0].isPrimary = true;
        this.props.primaryImageId = this.props.images[0].imageId;
      }
    }
    this.touch();
  }

  setPrimaryImage(imageId: string): void {
    const image = this.props.images.find(img => img.imageId === imageId);
    if (!image) {
      throw new Error('Image not found');
    }
    this.props.images.forEach(img => {
      img.isPrimary = img.imageId === imageId;
    });
    this.props.primaryImageId = imageId;
    this.touch();
  }

  reorderImages(imageIds: string[]): void {
    const orderedImages: ProductImage[] = [];
    imageIds.forEach((id, index) => {
      const image = this.props.images.find(img => img.imageId === id);
      if (image) {
        image.position = index;
        orderedImages.push(image);
      }
    });
    this.props.images = orderedImages;
    this.touch();
  }

  updateSeo(seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    slug?: string;
  }): void {
    if (seo.metaTitle !== undefined) this.props.metaTitle = seo.metaTitle;
    if (seo.metaDescription !== undefined) this.props.metaDescription = seo.metaDescription;
    if (seo.metaKeywords !== undefined) this.props.metaKeywords = seo.metaKeywords;
    if (seo.slug) this.props.slug = seo.slug;
    this.touch();
  }

  addTag(tag: string): void {
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.touch();
    }
  }

  removeTag(tag: string): void {
    const index = this.props.tags.indexOf(tag);
    if (index > -1) {
      this.props.tags.splice(index, 1);
      this.touch();
    }
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  enableVariants(variantAttributes: Record<string, any>): void {
    this.props.hasVariants = true;
    this.props.variantAttributes = variantAttributes;
    this.touch();
  }

  disableVariants(): void {
    this.props.hasVariants = false;
    this.props.variantAttributes = undefined;
    this.touch();
  }

  archive(): void {
    this.updateStatus(ProductStatus.ARCHIVED);
    this.props.visibility = ProductVisibility.HIDDEN;
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.status = ProductStatus.ARCHIVED;
    this.props.visibility = ProductVisibility.HIDDEN;
    this.touch();
  }

  private sortImages(): void {
    this.props.images.sort((a, b) => a.position - b.position);
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
      productId: this.props.productId,
      name: this.props.name,
      description: this.props.description,
      shortDescription: this.props.shortDescription,
      sku: this.props.sku,
      slug: this.props.slug,
      productTypeId: this.props.productTypeId,
      categoryId: this.props.categoryId,
      brandId: this.props.brandId,
      merchantId: this.props.merchantId,
      businessId: this.props.businessId,
      storeId: this.props.storeId,
      ownerId: this.ownerId,
      isMerchantOwned: this.isMerchantOwned,
      isBusinessOwned: this.isBusinessOwned,
      isStoreSpecific: this.isStoreSpecific,
      status: this.props.status,
      visibility: this.props.visibility,
      price: this.props.price.toJSON(),
      dimensions: this.props.dimensions.toJSON(),
      isFeatured: this.props.isFeatured,
      isVirtual: this.props.isVirtual,
      isDownloadable: this.props.isDownloadable,
      isSubscription: this.props.isSubscription,
      isTaxable: this.props.isTaxable,
      taxClass: this.props.taxClass,
      hasVariants: this.props.hasVariants,
      variantAttributes: this.props.variantAttributes,
      images: this.props.images,
      primaryImage: this.primaryImage,
      metaTitle: this.props.metaTitle,
      metaDescription: this.props.metaDescription,
      metaKeywords: this.props.metaKeywords,
      minOrderQuantity: this.props.minOrderQuantity,
      maxOrderQuantity: this.props.maxOrderQuantity,
      returnPolicy: this.props.returnPolicy,
      warranty: this.props.warranty,
      externalId: this.props.externalId,
      tags: this.props.tags,
      metadata: this.props.metadata,
      publishedAt: this.props.publishedAt?.toISOString(),
      isPurchasable: this.isPurchasable,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      deletedAt: this.props.deletedAt?.toISOString()
    };
  }
}
