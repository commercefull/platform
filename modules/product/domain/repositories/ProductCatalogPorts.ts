import { PaginatedResult, PaginationOptions } from 'libs/types/shared';

// ============================================================================
// Product Q&A
// ============================================================================

export type ProductQaStatus = 'pending' | 'answered' | 'closed';

export interface ProductQa {
  productQaId: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  customerId?: string | null;
  question: string;
  status: ProductQaStatus;
  askerName?: string | null;
  askerEmail?: string | null;
}

export type ProductQaCreateParams = Omit<ProductQa, 'productQaId' | 'createdAt' | 'updatedAt'>;

export interface ProductQaPort {
  findByProduct(productId: string, status?: ProductQaStatus): Promise<ProductQa[]>;
  updateStatus(qaId: string, status: ProductQaStatus): Promise<ProductQa | null>;
  create(params: ProductQaCreateParams): Promise<ProductQa>;
}

// ============================================================================
// Product Q&A Answers
// ============================================================================

export type ProductQaAnswerStatus = 'pending' | 'approved' | 'rejected';

export interface ProductQaAnswer {
  productQaAnswerId: string;
  createdAt: string;
  updatedAt: string;
  productQaId: string;
  customerId?: string | null;
  organizationId?: string | null;
  answer: string;
  status: ProductQaAnswerStatus;
  isOfficial: boolean;
}

export interface ProductQaAnswerPort {
  findByQuestion(productQaId: string, status?: ProductQaAnswerStatus): Promise<ProductQaAnswer[]>;
}

// ============================================================================
// Product Prices
// ============================================================================

export interface ProductPrice {
  productPriceId: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  productVariantId?: string | null;
  priceListId?: string | null;
  currencyCode: string;
  amount: number;
  compareAtAmount?: number | null;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export type ProductPriceCreateParams = Omit<ProductPrice, 'productPriceId' | 'createdAt' | 'updatedAt'>;
export type ProductPriceUpdateParams = Partial<Omit<ProductPriceCreateParams, 'productId'>>;

export interface ProductPricePort {
  findByProduct(productId: string): Promise<ProductPrice[]>;
  create(params: ProductPriceCreateParams): Promise<ProductPrice>;
  update(id: string, params: ProductPriceUpdateParams): Promise<ProductPrice | null>;
}

// ============================================================================
// Product Categories (productCategoryRepo)
// ============================================================================

export interface ProductCategoryRow {
  productCategoryId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  position: number;
  isActive: boolean;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export type ProductCategoryCreateParams = Omit<ProductCategoryRow, 'productCategoryId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type ProductCategoryUpdateParams = Partial<Omit<ProductCategoryCreateParams, never>>;

export interface ProductCategoryPort {
  findAll(includeDeleted?: boolean): Promise<ProductCategoryRow[]>;
  findById(id: string): Promise<ProductCategoryRow | null>;
  create(params: ProductCategoryCreateParams): Promise<ProductCategoryRow>;
  update(id: string, params: ProductCategoryUpdateParams): Promise<ProductCategoryRow | null>;
  softDelete(id: string): Promise<boolean>;
}

// ============================================================================
// Product To Category mapping
// ============================================================================

export interface ProductToCategory {
  productToCategoryId: string;
  createdAt: string;
  productId: string;
  productCategoryId: string;
  position: number;
  isPrimary: boolean;
}

export interface ProductToCategoryPort {
  findByProduct(productId: string): Promise<ProductToCategory[]>;
}

// ============================================================================
// Product Tags
// ============================================================================

export interface ProductTag {
  productTagId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  name: string;
  slug: string;
  description?: string | null;
}

export type ProductTagCreateParams = Omit<ProductTag, 'productTagId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export interface ProductTagPort {
  findAll(includeDeleted?: boolean): Promise<ProductTag[]>;
  create(params: ProductTagCreateParams): Promise<ProductTag>;
  softDelete(id: string): Promise<boolean>;
}

// ============================================================================
// Categories (categoryRepo — different from ProductCategoryRow)
// ============================================================================

export interface CategoryRow {
  productCategoryId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  path?: string;
  depth: number;
  position: number;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl?: string;
  bannerUrl?: string;
  iconUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  includeInMenu: boolean;
  productCount: number;
  organizationId?: string;
  isGlobal: boolean;
  customLayout?: string;
  displaySettings?: Record<string, unknown>;
}

export interface CategoryCreateProps {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  position?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
  bannerUrl?: string;
  iconUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  includeInMenu?: boolean;
  organizationId?: string;
  isGlobal?: boolean;
  customLayout?: string;
  displaySettings?: Record<string, unknown>;
}

export type CategoryUpdateProps = Partial<CategoryCreateProps>;

export interface CategoryPort {
  findOne(id: string): Promise<CategoryRow | null>;
  findBySlug(slug: string): Promise<CategoryRow | null>;
  findAll(): Promise<CategoryRow[]>;
  findActive(): Promise<CategoryRow[]>;
  findChildren(parentId: string): Promise<CategoryRow[]>;
  findForMenu(): Promise<CategoryRow[]>;
  create(props: CategoryCreateProps): Promise<CategoryRow>;
  update(id: string, props: CategoryUpdateProps): Promise<CategoryRow | null>;
  delete(id: string): Promise<boolean>;
}

// ============================================================================
// Product Reviews
// ============================================================================

export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface ProductReview {
  productReviewId: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  productVariantId?: string;
  customerId?: string;
  orderId?: string;
  rating: ReviewRating;
  title?: string;
  content?: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  isHighlighted: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  reportCount: number;
  reviewerName?: string;
  reviewerEmail?: string;
  adminResponse?: string;
  adminResponseDate?: string;
}

export type ProductReviewCreateParams = Omit<
  ProductReview,
  'productReviewId' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'unhelpfulCount' | 'reportCount' | 'isHighlighted'
>;

export type ProductReviewUpdateParams = Partial<
  Omit<ProductReviewCreateParams, 'productId' | 'customerId'>
>;

export interface ReviewFilters {
  productId?: string;
  productVariantId?: string;
  customerId?: string;
  status?: ReviewStatus;
  rating?: ReviewRating;
  isVerifiedPurchase?: boolean;
  isHighlighted?: boolean;
  minRating?: number;
  maxRating?: number;
}

export interface ProductReviewPort {
  findById(id: string): Promise<ProductReview | null>;
  findByProductId(productId: string, status?: ReviewStatus, limit?: number, offset?: number): Promise<ProductReview[]>;
  findByCustomerId(customerId: string, limit?: number, offset?: number): Promise<ProductReview[]>;
  findWithFilters(filters: ReviewFilters, limit?: number, offset?: number): Promise<ProductReview[]>;
  findPending(limit?: number, offset?: number): Promise<ProductReview[]>;
  create(params: ProductReviewCreateParams): Promise<ProductReview>;
  update(id: string, params: ProductReviewUpdateParams): Promise<ProductReview | null>;
  updateStatus(id: string, status: ReviewStatus): Promise<ProductReview | null>;
  approve(id: string): Promise<ProductReview | null>;
  reject(id: string): Promise<ProductReview | null>;
  highlight(id: string, highlighted?: boolean): Promise<ProductReview | null>;
  addAdminResponse(id: string, response: string): Promise<ProductReview | null>;
  incrementHelpful(id: string): Promise<ProductReview | null>;
  getProductStatistics(productId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    distribution: Record<ReviewRating, number>;
    verifiedPurchaseCount: number;
  }>;
  findByCustomerAndProduct(customerId: string, productId: string): Promise<ProductReview | null>;
  checkCustomerPurchase(customerId: string, productId: string): Promise<boolean>;
}

// ============================================================================
// Product Review Media
// ============================================================================

export interface ProductReviewMedia {
  productReviewMediaId: string;
  createdAt: string;
  updatedAt: string;
  productReviewId: string;
  url: string;
  type: string;
  position: number;
}

export type ProductReviewMediaCreateParams = Omit<ProductReviewMedia, 'productReviewMediaId' | 'createdAt' | 'updatedAt'>;

export interface ProductReviewMediaPort {
  findByReview(reviewId: string): Promise<ProductReviewMedia[]>;
  delete(mediaId: string): Promise<boolean>;
}

// ============================================================================
// Product Review Votes
// ============================================================================

export interface ProductReviewVote {
  productReviewVoteId: string;
  createdAt: string;
  productReviewId: string;
  customerId: string;
  isHelpful: boolean;
}

export type ProductReviewVoteCreateParams = Omit<ProductReviewVote, 'productReviewVoteId' | 'createdAt'>;

export interface ProductReviewVotePort {
  create(params: ProductReviewVoteCreateParams): Promise<ProductReviewVote | null>;
  countByReview(productReviewId: string): Promise<{ helpful: number; unhelpful: number }>;
}

// ============================================================================
// Product Collections
// ============================================================================

export interface ProductCollection {
  productCollectionId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  organizationId?: string | null;
}

export type ProductCollectionCreateParams = Omit<ProductCollection, 'productCollectionId' | 'createdAt' | 'updatedAt'>;
export type ProductCollectionUpdateParams = Partial<Omit<ProductCollectionCreateParams, never>>;

export interface ProductCollectionPort {
  findAll(): Promise<ProductCollection[]>;
  findById(id: string): Promise<ProductCollection | null>;
  create(params: ProductCollectionCreateParams): Promise<ProductCollection>;
  update(id: string, params: ProductCollectionUpdateParams): Promise<ProductCollection | null>;
  softDelete(id: string): Promise<boolean>;
}

// ============================================================================
// Product Collection Maps
// ============================================================================

export interface ProductCollectionMap {
  productCollectionMapId: string;
  createdAt: string;
  productCollectionId: string;
  productId: string;
  position: number;
}

export type ProductCollectionMapCreateParams = Omit<ProductCollectionMap, 'productCollectionMapId' | 'createdAt'>;

export interface ProductCollectionMapPort {
  findByCollection(productCollectionId: string): Promise<ProductCollectionMap[]>;
  create(params: ProductCollectionMapCreateParams): Promise<ProductCollectionMap>;
  delete(productCollectionMapId: string): Promise<boolean>;
}

// ============================================================================
// Product Types
// ============================================================================

export interface ProductTypeRow {
  productTypeId: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductTypeCreateInput {
  name: string;
  slug?: string;
}

export interface ProductTypeUpdateInput {
  name?: string;
  slug?: string;
}

export interface ProductTypePort {
  findAll(): Promise<ProductTypeRow[]>;
  findById(id: string): Promise<ProductTypeRow | null>;
  findBySlug(slug: string): Promise<ProductTypeRow | null>;
  create(params: ProductTypeCreateInput): Promise<ProductTypeRow>;
  update(id: string, params: ProductTypeUpdateInput): Promise<ProductTypeRow | null>;
  delete(id: string): Promise<boolean>;
}

// ============================================================================
// Product Variants (infra-typed port for variant repo)
// ============================================================================

export interface ProductVariantFilters {
  productId?: string;
  sku?: string;
  isActive?: boolean;
  isDefault?: boolean;
  inStock?: boolean;
  attributes?: Record<string, string>;
}

export interface ProductVariantRow {
  variantId: string;
  productId: string;
  sku: string;
  name: string;
  attributes: Array<{
    attributeId: string;
    attributeName: string;
    value: string;
    displayValue?: string;
    displayOrder?: number;
  }>;
  price: {
    effectivePrice: number;
    currency: string;
    salePrice?: number | null;
    cost?: number | null;
    isOnSale: boolean;
    discountPercentage?: number;
  };
  stockQuantity: number;
  lowStockThreshold?: number;
  isDefault: boolean;
  isActive: boolean;
  position: number;
  isInStock: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export interface ProductVariantPort {
  findById(variantId: string): Promise<ProductVariantRow | null>;
  findBySku(sku: string): Promise<ProductVariantRow | null>;
  findByProductId(productId: string): Promise<ProductVariantRow[]>;
  save(variant: unknown): Promise<unknown>;
  delete(variantId: string): Promise<void>;
  findAll(filters: ProductVariantFilters, pagination?: PaginationOptions): Promise<PaginatedResult<ProductVariantRow>>;
}

// Fallback for infra repos that return domain entities
export interface ProductVariantSavePort {
  findById(variantId: string): Promise<unknown>;
  findBySku(sku: string): Promise<unknown>;
  findByProductId(productId: string): Promise<unknown[]>;
  save(variant: unknown): Promise<unknown>;
  delete(variantId: string): Promise<void>;
  findAll(filters: ProductVariantFilters, pagination?: PaginationOptions): Promise<PaginatedResult<unknown>>;
}

// ============================================================================
// Dynamic Attributes
// ============================================================================

export type AttributeType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'image'
  | 'video'
  | 'document';

export interface ProductAttribute {
  productAttributeId: string;
  name: string;
  code: string;
  description?: string;
  groupId?: string;
  type: AttributeType;
  inputType: AttributeType;
  isRequired: boolean;
  isUnique: boolean;
  isSystem: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  isVisibleOnFront: boolean;
  isUsedInProductListing: boolean;
  defaultValue?: string | null;
  position: number;
}

export interface ProductAttributeData {
  productAttributeValueMapId: string;
  productId: string;
  productVariantId?: string;
  attributeId: string;
  value?: string;
  valueText?: string;
  valueNumeric?: number;
  valueBoolean?: boolean;
  valueJson?: Record<string, unknown>;
  valueDate?: Date;
}

export interface SetProductAttributeInput {
  attributeId: string;
  value: string;
}

export interface DynamicAttributePort {
  getProductAttributes(productId: string): Promise<Array<ProductAttributeData & { attribute: ProductAttribute }>>;
  findAllAttributes(): Promise<ProductAttribute[]>;
  setProductAttributes(productId: string, attributes: SetProductAttributeInput[]): Promise<void>;
}

// ============================================================================
// Product Attribute Sets
// ============================================================================

export interface ProductAttributeSetAttribute {
  productAttributeId: string;
  name: string;
  code: string;
  type: string;
  isRequired: boolean;
  defaultValue?: string | null;
  position: number;
}

export interface ProductAttributeSetPort {
  getAttributesForProductType(productTypeId: string): Promise<ProductAttributeSetAttribute[]>;
}

// ============================================================================
// Product lookup (for use cases that need to check product existence)
// ============================================================================

export interface ProductLookupPort {
  findById(productId: string): Promise<{ productId: string; name: string; status: string } | null>;
}
