/**
 * Product Visibility Value Object
 * Represents the visibility settings for a product
 */

export enum ProductVisibility {
  VISIBLE = 'visible',
  NOT_VISIBLE = 'not_visible',
  CATALOG_ONLY = 'catalog',
  SEARCH_ONLY = 'search',
  FEATURED = 'featured',
}

/**
 * Get human-readable visibility label
 */
export function getVisibilityLabel(visibility: ProductVisibility): string {
  const labels: Record<ProductVisibility, string> = {
    [ProductVisibility.VISIBLE]: 'Visible',
    [ProductVisibility.NOT_VISIBLE]: 'Not Visible',
    [ProductVisibility.CATALOG_ONLY]: 'Catalog Only',
    [ProductVisibility.SEARCH_ONLY]: 'Search Only',
    [ProductVisibility.FEATURED]: 'Featured',
  };
  return labels[visibility] || visibility;
}

/**
 * Check if product is visible in catalog
 */
export function isVisibleInCatalog(visibility: ProductVisibility): boolean {
  return [ProductVisibility.VISIBLE, ProductVisibility.CATALOG_ONLY, ProductVisibility.FEATURED].includes(visibility);
}

export function isSearchable(visibility: ProductVisibility): boolean {
  return [ProductVisibility.VISIBLE, ProductVisibility.SEARCH_ONLY, ProductVisibility.FEATURED].includes(visibility);
}

export function isFeaturedVisibility(visibility: ProductVisibility): boolean {
  return visibility === ProductVisibility.FEATURED;
}
