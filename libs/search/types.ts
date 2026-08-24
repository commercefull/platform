/**
 * Search Index Abstraction Layer
 *
 * Defines the adapter interface for product search backends.
 * The default adapter uses PostgreSQL full-text search (tsvector/tsquery).
 * Future adapters can implement this interface for OpenSearch, pgvector, etc.
 *
 * Configuration:
 *   SEARCH_BACKEND=postgres  (default) | opensearch | pgvector
 */

import { logger } from '../logger';

// ============================================================================
// Search Types
// ============================================================================

export interface SearchQuery {
  /** Full-text search query string */
  query?: string;
  /** Category filter */
  categoryId?: string;
  categoryIds?: string[];
  /** Product type filter */
  productTypeId?: string;
  /** Price range */
  minPrice?: number;
  maxPrice?: number;
  /** Status filters */
  status?: string;
  visibility?: string;
  /** Boolean filters */
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  hasVariants?: boolean;
  inStock?: boolean;
  /** Dynamic attribute filters */
  attributes?: SearchAttributeFilter[];
  /** Merchandising rules to apply */
  merchandising?: MerchandisingContext;
  /** Per-category manual ordering */
  manualOrdering?: ManualOrderingContext;
  /** Sorting */
  sortBy?: SearchSortField;
  sortOrder?: 'asc' | 'desc';
  /** Pagination */
  page?: number;
  limit?: number;
  offset?: number;
  /** Include facets in response */
  includeFacets?: boolean;
}

export interface SearchAttributeFilter {
  attributeId?: string;
  attributeCode?: string;
  value?: string;
  values?: string[];
  minValue?: number;
  maxValue?: number;
  operator?: 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'like';
}

export interface MerchandisingContext {
  /** Product IDs to boost (move to top of results) */
  boostProductIds?: string[];
  /** Product IDs to bury (move to bottom of results) */
  buryProductIds?: string[];
  /** Product IDs to pin at specific positions */
  pinnedProducts?: PinnedProduct[];
  /** Boost factor for featured products (0-10, default 1) */
  featuredBoost?: number;
  /** Boost factor for bestsellers (0-10, default 1) */
  bestsellerBoost?: number;
  /** Boost factor for new arrivals (0-10, default 1) */
  newBoost?: number;
}

export interface PinnedProduct {
  productId: string;
  position: number;
}

export interface ManualOrderingContext {
  /** Category ID to apply manual ordering for */
  categoryId: string;
  /** Ordered list of product IDs (first = top of results) */
  productIds: string[];
}

export type SearchSortField =
  | 'name'
  | 'price'
  | 'createdAt'
  | 'popularity'
  | 'rating'
  | 'relevance'
  | 'manual';

export interface SearchResult {
  products: SearchProductItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: SearchFacets;
}

export interface SearchProductItem {
  productId: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  status: string;
  visibility: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  averageRating?: number;
  reviewCount?: number;
  primaryImageUrl?: string;
  shortDescription?: string;
  /** Relevance score from search backend (0-1) */
  score?: number;
  /** Whether this result was boosted/buried/pinned by merchandising */
  merchandisingApplied?: 'boosted' | 'buried' | 'pinned' | 'manual';
}

export interface SearchFacets {
  categories: SearchFacetValue[];
  priceRanges: SearchPriceRangeFacet[];
  attributes: SearchAttributeFacet[];
}

export interface SearchFacetValue {
  id: string;
  name: string;
  count: number;
}

export interface SearchPriceRangeFacet {
  min: number;
  max: number;
  count: number;
}

export interface SearchAttributeFacet {
  attributeId: string;
  attributeCode: string;
  attributeName: string;
  type: string;
  values: Array<{
    value: string;
    displayValue: string;
    count: number;
  }>;
}

export interface AutocompleteSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand' | 'suggestion';
  productId?: string;
  categoryId?: string;
}

// ============================================================================
// Search Adapter Interface
// ============================================================================

export interface SearchAdapter {
  /** Search products with filters, facets, and merchandising */
  search(query: SearchQuery): Promise<SearchResult>;

  /** Get autocomplete suggestions for a partial query */
  autocomplete(partialQuery: string, limit?: number): Promise<AutocompleteSuggestion[]>;

  /** Index or re-index a single product */
  indexProduct(productId: string): Promise<void>;

  /** Index or re-index all products (bulk) */
  indexAll(): Promise<number>;

  /** Remove a product from the index */
  removeProduct(productId: string): Promise<void>;

  /** Get backend health/status */
  health(): Promise<{ healthy: boolean; details?: Record<string, unknown> }>;
}

// ============================================================================
// Search Adapter Registry
// ============================================================================

let activeAdapter: SearchAdapter | null = null;

export function setSearchAdapter(adapter: SearchAdapter): void {
  activeAdapter = adapter;
  logger.info('Search adapter set', { adapter: adapter.constructor.name });
}

export function getSearchAdapter(): SearchAdapter {
  if (!activeAdapter) {
    throw new Error('No search adapter configured. Call setSearchAdapter() at boot.');
  }
  return activeAdapter;
}

export function isSearchAdapterConfigured(): boolean {
  return activeAdapter !== null;
}
