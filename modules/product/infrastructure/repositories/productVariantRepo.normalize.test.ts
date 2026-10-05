import { normalizeInventoryPolicy, InventoryPolicy } from './productVariantRepo';
import { ProductValidationError } from '../../domain/errors/ProductErrors';

describe('normalizeInventoryPolicy', () => {
  it('should pass through valid domain policies', () => {
    expect(normalizeInventoryPolicy('tracked')).toBe('tracked');
    expect(normalizeInventoryPolicy('unlimited')).toBe('unlimited');
    expect(normalizeInventoryPolicy('backorderable')).toBe('backorderable');
  });

  it('should default to tracked when the value is missing', () => {
    expect(normalizeInventoryPolicy(undefined)).toBe('tracked');
    expect(normalizeInventoryPolicy(null)).toBe('tracked');
  });

  it('should map legacy Shopify-style values onto domain policies', () => {
    expect(normalizeInventoryPolicy(InventoryPolicy.DENY)).toBe('tracked');
    expect(normalizeInventoryPolicy(InventoryPolicy.CONTINUE)).toBe('backorderable');
  });

  it('should reject unknown values', () => {
    expect(() => normalizeInventoryPolicy('anything-else')).toThrow(ProductValidationError);
  });
});
