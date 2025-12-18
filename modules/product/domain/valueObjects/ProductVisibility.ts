/**
 * Product Visibility Value Object
 * Represents the visibility settings for a product
 */

export enum ProductVisibility {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  CATALOG_ONLY = 'catalog_only',
  SEARCH_ONLY = 'search_only',
  FEATURED = 'featured'
}

/**
 * Get human-readable visibility label
 */
export function getVisibilityLabel(visibility: ProductVisibility): string {
  const labels: Record<ProductVisibility, string> = {
    [ProductVisibility.VISIBLE]: 'Visible',
    [ProductVisibility.HIDDEN]: 'Hidden',
    [ProductVisibility.CATALOG_ONLY]: 'Catalog Only',
    [ProductVisibility.SEARCH_ONLY]: 'Search Only',
    [ProductVisibility.FEATURED]: 'Featured'
  };
  return labels[visibility] || visibility;
}

/**
 * Check if product is visible in catalog
 */
export function isVisibleInCatalog(visibility: ProductVisibility): boolean {
  return [ProductVisibility.VISIBLE, ProductVisibility.CATALOG_ONLY, ProductVisibility.FEATURED].includes(visibility);
}

/**
 * Check if product is searchable
 */
export function isSearchable(visibility: ProductVisibility): boolean {
  return [ProductVisibility.VISIBLE, ProductVisibility.SEARCH_ONLY, ProductVisibility.FEATURED].includes(visibility);
}

/**
 * Check if product is featured
 */
export function isFeaturedVisibility(visibility: ProductVisibility): boolean {
  return visibility === ProductVisibility.FEATURED;
}
