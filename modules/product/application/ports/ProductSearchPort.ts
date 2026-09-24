/**
 * Product Search Port
 *
 * Contract between the product search use cases and the infrastructure
 * search implementation. Record types describe the raw `product` row enriched
 * with the product-level catalog price from the pricing-owned
 * `productBasePrice` table (all amounts are integer cents).
 */

import type { Product as DbProduct } from '../../../../libs/db/types';

/**
 * Search filters for product queries
 */
export interface ProductSearchFilters {
  // Text search
  query?: string;

  // Basic filters
  categoryId?: string;
  categoryIds?: string[];
  productTypeId?: string;

  // Price filters — integer cents, matched against the pricing-owned
  // productBasePrice table (effective price = sale price when present).
  minPriceCents?: number;
  maxPriceCents?: number;

  // Status filters
  status?: string;
  visibility?: string;

  // Boolean filters
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  hasVariants?: boolean;
  inStock?: boolean;

  // Dynamic attribute filters
  attributes?: AttributeFilter[];

  // Sorting
  sortBy?: 'name' | 'price' | 'createdAt' | 'popularity' | 'rating' | 'relevance';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: number;
  limit?: number;
  offset?: number;
}

export interface AttributeFilter {
  attributeId?: string;
  attributeCode?: string;
  value?: string;
  values?: string[];
  minValue?: number;
  maxValue?: number;
  operator?: 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'like';
}

export type ProductSearchRow = DbProduct & {
  priceCents: number | null;
  salePriceCents: number | null;
  effectivePriceCents: number | null;
  currencyCode: string | null;
};

export interface ProductSearchResult {
  products: ProductSearchRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: SearchFacets;
}

export interface SearchFacets {
  categories: FacetValue[];
  brands: FacetValue[];
  priceRanges: PriceRangeFacet[];
  attributes: AttributeFacet[];
}

export interface FacetValue {
  id: string;
  name: string;
  count: number;
}

export interface PriceRangeFacet {
  min: number;
  max: number;
  count: number;
}

export interface AttributeFacet {
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

export interface ProductSearchServicePort {
  search(filters: ProductSearchFilters): Promise<ProductSearchResult>;
  getSuggestions(partialQuery: string, limit?: number): Promise<string[]>;
  findByAttribute(attributeCode: string, value: string): Promise<ProductSearchRow[]>;
  findSimilar(productId: string, limit?: number): Promise<ProductSearchRow[]>;
}
