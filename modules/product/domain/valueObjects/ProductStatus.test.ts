import { ProductStatus, ProductStatusTransitions, canTransitionProductTo, getProductStatusLabel, isProductPurchasable } from './ProductStatus';

describe('ProductStatus', () => {
  it('should have correct enum values', () => {
    expect(ProductStatus.DRAFT).toBe('draft');
    expect(ProductStatus.ACTIVE).toBe('active');
    expect(ProductStatus.ARCHIVED).toBe('archived');
  });

  it('should allow valid transitions', () => {
    expect(canTransitionProductTo(ProductStatus.DRAFT, ProductStatus.ACTIVE)).toBe(true);
    expect(canTransitionProductTo(ProductStatus.ACTIVE, ProductStatus.INACTIVE)).toBe(true);
    expect(canTransitionProductTo(ProductStatus.PENDING_REVIEW, ProductStatus.ACTIVE)).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(canTransitionProductTo(ProductStatus.ARCHIVED, ProductStatus.ACTIVE)).toBe(false);
    expect(canTransitionProductTo(ProductStatus.DRAFT, 'invalid' as unknown as ProductStatus)).toBe(false);
  });

  it('should return human-readable labels', () => {
    expect(getProductStatusLabel(ProductStatus.DRAFT)).toBe('Draft');
    expect(getProductStatusLabel(ProductStatus.PENDING_REVIEW)).toBe('Pending Review');
    expect(getProductStatusLabel(ProductStatus.ACTIVE)).toBe('Active');
  });

  it('should check if product is purchasable', () => {
    expect(isProductPurchasable(ProductStatus.ACTIVE)).toBe(true);
    expect(isProductPurchasable(ProductStatus.DRAFT)).toBe(false);
    expect(isProductPurchasable(ProductStatus.INACTIVE)).toBe(false);
  });

  it('should have terminal states with no transitions', () => {
    expect(ProductStatusTransitions[ProductStatus.ARCHIVED]).toHaveLength(0);
  });
});
