/**
 * Shared test utilities for product use-case tests.
 * Mocks module boundaries (eventBus, uuid, libs/db, logger) once and
 * provides typed lazy port mocks.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { query } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn(), registerHandler: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'product-uuid-123'),
  isUuid: jest.fn(() => true),
}));

jest.mock('../../../libs/logger', () => ({
  logger: { warn: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../libs/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(async (fn: (client?: unknown) => Promise<unknown>) => fn()),
}));

export const emitMock = jest.mocked(eventBus.emit);
export const queryMock = jest.mocked(query);
export const uuidMock = jest.mocked(generateUUID);

export function lazyMock<T extends object>(): jest.Mocked<T> {
  const cache = new Map<string | symbol, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!cache.has(prop)) cache.set(prop, jest.fn());
      return cache.get(prop);
    },
    // `in` checks must see every port method
    has(target, prop) {
      return typeof prop === 'string' && prop !== 'then';
    },
  });
}

// ============================================================================
// Domain record factories
// ============================================================================

import type {
  ProductAttribute,
  ProductAttributeValue,
  ProductAttributeData,
} from '../domain/repositories/ProductCatalogPorts';

export function createAttribute(overrides: Partial<ProductAttribute> = {}): ProductAttribute {
  return {
    productAttributeId: 'attr-1',
    name: 'Color',
    code: 'color',
    type: 'select',
    inputType: 'select',
    isRequired: false,
    isUnique: false,
    isSystem: false,
    isSearchable: true,
    isFilterable: true,
    isComparable: false,
    isVisibleOnFront: true,
    isUsedInProductListing: false,
    position: 0,
    ...overrides,
  };
}

export function createAttributeValue(overrides: Partial<ProductAttributeValue> = {}): ProductAttributeValue {
  return {
    productAttributeValueId: 'av-1',
    attributeId: 'attr-1',
    value: 'Red',
    position: 0,
    isDefault: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createAttributeData(overrides: Partial<ProductAttributeData> = {}): ProductAttributeData {
  return {
    productAttributeValueMapId: 'avm-1',
    productId: 'p1',
    attributeId: 'attr-1',
    value: 'Red',
    ...overrides,
  };
}

import type {
  CategoryRow,
  ProductCategoryRow,
  ProductToCategory,
  ProductTag,
  ProductQa,
  ProductQaAnswer,
  ProductCollection,
  ProductCollectionMap,
  ProductTypeRow,
  ProductVariantRow,
} from '../domain/repositories/ProductCatalogPorts';

const ISO = '2026-01-01T00:00:00.000Z';

export function createCategoryRow(overrides: Partial<CategoryRow> = {}): CategoryRow {
  return {
    productCategoryId: 'c1',
    name: 'Electronics',
    slug: 'electronics',
    depth: 0,
    position: 0,
    isActive: true,
    isFeatured: false,
    includeInMenu: true,
    productCount: 0,
    isGlobal: true,
    ...overrides,
  };
}

export function createProductCategory(overrides: Partial<ProductCategoryRow> = {}): ProductCategoryRow {
  return {
    productCategoryId: 'pc1',
    createdAt: ISO,
    updatedAt: ISO,
    name: 'Electronics',
    slug: 'electronics',
    position: 0,
    isActive: true,
    ...overrides,
  };
}

export function createProductToCategory(overrides: Partial<ProductToCategory> = {}): ProductToCategory {
  return {
    productToCategoryId: 'ptc1',
    createdAt: ISO,
    productId: 'p1',
    productCategoryId: 'pc1',
    position: 0,
    isPrimary: true,
    ...overrides,
  };
}

export function createProductTag(overrides: Partial<ProductTag> = {}): ProductTag {
  return { productTagId: 't1', createdAt: ISO, updatedAt: ISO, name: 'Sale', slug: 'sale', ...overrides };
}

export function createProductQa(overrides: Partial<ProductQa> = {}): ProductQa {
  return {
    productQaId: 'q1',
    createdAt: ISO,
    updatedAt: ISO,
    productId: 'p1',
    question: 'Is it good?',
    status: 'pending',
    ...overrides,
  };
}

export function createProductQaAnswer(overrides: Partial<ProductQaAnswer> = {}): ProductQaAnswer {
  return {
    productQaAnswerId: 'a1',
    createdAt: ISO,
    updatedAt: ISO,
    productQaId: 'q1',
    answer: 'Yes',
    status: 'approved',
    isOfficial: true,
    ...overrides,
  };
}

export function createProductCollection(overrides: Partial<ProductCollection> = {}): ProductCollection {
  return {
    productCollectionId: 'col1',
    createdAt: ISO,
    updatedAt: ISO,
    name: 'Summer',
    slug: 'summer',
    isActive: true,
    ...overrides,
  };
}

export function createProductCollectionMap(overrides: Partial<ProductCollectionMap> = {}): ProductCollectionMap {
  return {
    productCollectionMapId: 'pcm1',
    createdAt: ISO,
    productCollectionId: 'col1',
    productId: 'p1',
    position: 0,
    ...overrides,
  };
}

export function createProductTypeRow(overrides: Partial<ProductTypeRow> = {}): ProductTypeRow {
  return {
    productTypeId: 'pt1',
    name: 'Physical',
    slug: 'physical',
    createdAt: new Date(ISO),
    updatedAt: new Date(ISO),
    ...overrides,
  };
}

export function createProductVariantRow(overrides: Partial<ProductVariantRow> = {}): ProductVariantRow {
  return {
    variantId: 'v1',
    productId: 'p1',
    sku: 'SKU-1',
    name: 'Default',
    attributes: [],
    stockQuantity: 10,
    isDefault: true,
    isActive: true,
    position: 0,
    isInStock: true,
    isLowStock: false,
    isOutOfStock: false,
    ...overrides,
  };
}

import type {
  ProductReview,
  ProductReviewMedia,
  ProductReviewVote,
  ProductLookupPort,
} from '../domain/repositories/ProductCatalogPorts';

export function createProductReview(overrides: Partial<ProductReview> = {}): ProductReview {
  return {
    productReviewId: 'r1',
    createdAt: ISO,
    updatedAt: ISO,
    productId: 'p1',
    rating: 5,
    status: 'pending',
    isVerifiedPurchase: false,
    isHighlighted: false,
    helpfulCount: 0,
    unhelpfulCount: 0,
    reportCount: 0,
    ...overrides,
  };
}

export function createReviewMedia(overrides: Partial<ProductReviewMedia> = {}): ProductReviewMedia {
  return {
    productReviewMediaId: 'm1',
    createdAt: ISO,
    updatedAt: ISO,
    productReviewId: 'r1',
    url: 'https://example.com/img.jpg',
    type: 'image',
    position: 0,
    ...overrides,
  };
}

export function createReviewVote(overrides: Partial<ProductReviewVote> = {}): ProductReviewVote {
  return {
    productReviewVoteId: 'v1',
    createdAt: ISO,
    productReviewId: 'r1',
    customerId: 'c1',
    isHelpful: true,
    ...overrides,
  };
}

export function createProductLookup(
  overrides: Partial<Awaited<ReturnType<ProductLookupPort['findById']>>> = {},
): NonNullable<Awaited<ReturnType<ProductLookupPort['findById']>>> {
  return { productId: 'p1', name: 'Widget', status: 'active', ...overrides };
}

import { Product } from '../domain/entities/Product';
import type { ProductSearchRow } from '../infrastructure/services/ProductSearchService';

/**
 * Raw `product` table row enriched with pricing-owned base price columns,
 * as returned by `ProductSearchService`. Price fields are integer cents.
 */
export function createProductSearchRow(overrides: Partial<ProductSearchRow> = {}): ProductSearchRow {
  return {
    productId: 'p1',
    createdAt: new Date(ISO),
    updatedAt: new Date(ISO),
    sku: 'SKU-1',
    name: 'Widget',
    slug: 'widget',
    description: 'A test product',
    type: 'physical',
    status: 'active',
    visibility: 'public',
    taxClass: null,
    isTaxable: true,
    isInventoryManaged: true,
    minOrderQuantity: null,
    maxOrderQuantity: null,
    orderIncrementQuantity: null,
    weight: null,
    weightUnit: null,
    length: null,
    width: null,
    height: null,
    dimensionUnit: null,
    metaTitle: null,
    metaDescription: null,
    hsCode: null,
    countryOfOrigin: null,
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    warningThreshold: null,
    preorderEnabled: false,
    preorderReleaseDate: null,
    preorderAllowance: null,
    averageRating: null,
    reviewCount: null,
    customFields: null,
    seoData: null,
    relatedProducts: null,
    crossSellProducts: null,
    upSellProducts: null,
    shortDescription: null,
    metaKeywords: null,
    isVirtual: false,
    isDownloadable: false,
    isSubscription: false,
    primaryImageId: null,
    publishedAt: null,
    deletedAt: null,
    userId: null,
    organizationId: null,
    returnPolicy: null,
    warranty: null,
    externalId: null,
    hasVariants: false,
    variantAttributes: null,
    storeId: null,
    approvalStatus: null,
    platformVisible: null,
    createdBy: null,
    updatedBy: null,
    brandId: null,
    priceCents: 4500,
    salePriceCents: null,
    effectivePriceCents: 4500,
    currencyCode: 'USD',
    ...overrides,
  };
}

export function createProduct(overrides: Partial<Parameters<typeof Product.create>[0]> = {}): Product {
  return Product.create({
    productId: 'p1',
    name: 'Widget',
    description: 'A test product',
    productTypeId: 'pt1',
    sku: 'SKU-1',
    ...overrides,
  });
}

import { ProductVariant } from '../domain/entities/ProductVariant';

export function createProductVariant(overrides: Partial<Parameters<typeof ProductVariant.create>[0]> = {}): ProductVariant {
  return ProductVariant.create({
    variantId: 'v1',
    productId: 'p1',
    sku: 'VAR-SKU1',
    attributes: [],
    ...overrides,
  });
}
