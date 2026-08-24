import { ProductVariant } from './ProductVariant';
import { ProductValidationError } from '../errors/ProductErrors';

describe('ProductVariant', () => {
  const baseProps = {
    variantId: 'v1',
    productId: 'p1',
    sku: 'SKU1',
    basePrice: 100,
    attributes: [
      { attributeId: 'a1', attributeName: 'Color', value: 'red', displayValue: 'Red' },
      { attributeId: 'a2', attributeName: 'Size', value: 'm', displayValue: 'M' },
    ],
  };

  it('should create a variant (happy path)', () => {
    const v = ProductVariant.create(baseProps);
    expect(v.variantId).toBe('v1');
    expect(v.sku).toBe('SKU1');
    expect(v.price.basePrice).toBe(100);
    expect(v.isActive).toBe(true);
    expect(v.isInStock).toBe(false);
    expect(v.isOutOfStock).toBe(true);
  });

  it('should generate name from attributes when not provided', () => {
    const v = ProductVariant.create(baseProps);
    expect(v.name).toBe('Red / M');
  });

  it('should compute attribute string', () => {
    const v = ProductVariant.create(baseProps);
    expect(v.attributeString).toBe('Color: Red, Size: M');
  });

  it('should detect low stock', () => {
    const v = ProductVariant.create({ ...baseProps, stockQuantity: 3, lowStockThreshold: 5 });
    expect(v.isLowStock).toBe(true);
    expect(v.isInStock).toBe(true);
  });

  it('should update price', () => {
    const v = ProductVariant.create(baseProps);
    v.updatePrice(150, 120);
    expect(v.price.basePrice).toBe(150);
    expect(v.price.effectivePrice).toBe(120);
  });

  it('should update stock', () => {
    const v = ProductVariant.create(baseProps);
    v.updateStock(50);
    expect(v.stockQuantity).toBe(50);
  });

  it('should throw on negative stock', () => {
    const v = ProductVariant.create(baseProps);
    expect(() => v.updateStock(-1)).toThrow(ProductValidationError);
  });

  it('should decrement stock', () => {
    const v = ProductVariant.create({ ...baseProps, stockQuantity: 10 });
    v.decrementStock(3);
    expect(v.stockQuantity).toBe(7);
  });

  it('should throw on insufficient stock decrement', () => {
    const v = ProductVariant.create({ ...baseProps, stockQuantity: 2 });
    expect(() => v.decrementStock(5)).toThrow(ProductValidationError);
  });

  it('should increment stock', () => {
    const v = ProductVariant.create({ ...baseProps, stockQuantity: 10 });
    v.incrementStock(5);
    expect(v.stockQuantity).toBe(15);
  });

  it('should activate and deactivate', () => {
    const v = ProductVariant.create(baseProps);
    v.deactivate();
    expect(v.isActive).toBe(false);
    v.activate();
    expect(v.isActive).toBe(true);
  });

  it('should set and unset default', () => {
    const v = ProductVariant.create(baseProps);
    v.setAsDefault();
    expect(v.isDefault).toBe(true);
    v.unsetDefault();
    expect(v.isDefault).toBe(false);
  });

  it('should set and remove image', () => {
    const v = ProductVariant.create(baseProps);
    v.setImage('img1', 'http://img.url');
    expect(v.imageId).toBe('img1');
    expect(v.imageUrl).toBe('http://img.url');
    v.removeImage();
    expect(v.imageId).toBeUndefined();
  });

  it('should generate name from attributes statically', () => {
    const name = ProductVariant.generateName([
      { attributeId: 'a1', attributeName: 'Color', value: 'blue' },
    ]);
    expect(name).toBe('blue');
  });

  it('should serialize to JSON', () => {
    const v = ProductVariant.create({ ...baseProps, stockQuantity: 5 });
    const json = v.toJSON();
    expect(json.variantId).toBe('v1');
    expect(json.isInStock).toBe(true);
    expect(json.attributes).toHaveLength(2);
  });
});
