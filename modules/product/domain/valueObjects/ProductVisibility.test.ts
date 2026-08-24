import { ProductVisibility, getVisibilityLabel, isVisibleInCatalog, isSearchable, isFeaturedVisibility } from './ProductVisibility';

describe('ProductVisibility', () => {
  it('should return human-readable labels', () => {
    expect(getVisibilityLabel(ProductVisibility.VISIBLE)).toBe('Visible');
    expect(getVisibilityLabel(ProductVisibility.NOT_VISIBLE)).toBe('Not Visible');
    expect(getVisibilityLabel(ProductVisibility.CATALOG_ONLY)).toBe('Catalog Only');
    expect(getVisibilityLabel(ProductVisibility.SEARCH_ONLY)).toBe('Search Only');
    expect(getVisibilityLabel(ProductVisibility.FEATURED)).toBe('Featured');
  });

  it('should check catalog visibility', () => {
    expect(isVisibleInCatalog(ProductVisibility.VISIBLE)).toBe(true);
    expect(isVisibleInCatalog(ProductVisibility.CATALOG_ONLY)).toBe(true);
    expect(isVisibleInCatalog(ProductVisibility.FEATURED)).toBe(true);
    expect(isVisibleInCatalog(ProductVisibility.SEARCH_ONLY)).toBe(false);
    expect(isVisibleInCatalog(ProductVisibility.NOT_VISIBLE)).toBe(false);
  });

  it('should check searchability', () => {
    expect(isSearchable(ProductVisibility.VISIBLE)).toBe(true);
    expect(isSearchable(ProductVisibility.SEARCH_ONLY)).toBe(true);
    expect(isSearchable(ProductVisibility.FEATURED)).toBe(true);
    expect(isSearchable(ProductVisibility.CATALOG_ONLY)).toBe(false);
  });

  it('should check featured visibility', () => {
    expect(isFeaturedVisibility(ProductVisibility.FEATURED)).toBe(true);
    expect(isFeaturedVisibility(ProductVisibility.VISIBLE)).toBe(false);
  });
});
