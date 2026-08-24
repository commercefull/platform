import { ProductType, StandardProductTypes } from './ProductType';

describe('ProductType', () => {
  it('should create a product type (happy path)', () => {
    const pt = ProductType.create({ name: 'Simple', slug: 'simple' });
    expect(pt.name).toBe('Simple');
    expect(pt.slug).toBe('simple');
  });

  it('should auto-generate slug from name', () => {
    const pt = ProductType.create({ name: 'Configurable Product', slug: '' });
    expect(pt.slug).toBe('configurable-product');
  });

  it('should manage attribute sets', () => {
    const pt = ProductType.create({ name: 'Simple', slug: 'simple' });
    expect(pt.hasAttributeSets()).toBe(false);
    pt.setAttributeSets([
      { productAttributeSetId: 'as1', name: 'Default', code: 'default', attributeCount: 5 },
    ]);
    expect(pt.hasAttributeSets()).toBe(true);
    expect(pt.getAttributeSets()).toHaveLength(1);
  });

  it('should update name', () => {
    const pt = ProductType.create({ name: 'Old', slug: 'old' });
    pt.updateName('New');
    expect(pt.name).toBe('New');
  });

  it('should serialize to object', () => {
    const pt = ProductType.create({ name: 'Simple', slug: 'simple' });
    pt.setAttributeSets([
      { productAttributeSetId: 'as1', name: 'Default', code: 'default', attributeCount: 3 },
    ]);
    const obj = pt.toObject();
    expect(obj.name).toBe('Simple');
    expect(obj.attributeSets).toHaveLength(1);
  });

  it('should have predefined product type constants', () => {
    expect(ProductType.SIMPLE).toBe('simple');
    expect(ProductType.CONFIGURABLE).toBe('configurable');
    expect(ProductType.BUNDLE).toBe('bundle');
  });

  it('should export standard product types', () => {
    expect(StandardProductTypes).toContainEqual({ name: 'Simple', slug: 'simple' });
    expect(StandardProductTypes).toHaveLength(7);
  });
});
