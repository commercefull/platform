import { ProductCategory } from './ProductCategory';

describe('ProductCategory', () => {
  it('should create a root category (happy path)', () => {
    const cat = ProductCategory.create({ categoryId: 'c1', name: 'Electronics' });
    expect(cat.categoryId).toBe('c1');
    expect(cat.name).toBe('Electronics');
    expect(cat.slug).toBe('electronics');
    expect(cat.isRootCategory).toBe(true);
    expect(cat.level).toBe(0);
    expect(cat.path).toBe('c1');
    expect(cat.isActive).toBe(true);
    expect(cat.hasProducts).toBe(false);
  });

  it('should create a child category with parent path', () => {
    const cat = ProductCategory.create({
      categoryId: 'c2', name: 'Phones', parentId: 'c1', parentPath: 'c1',
    });
    expect(cat.level).toBe(2);
    expect(cat.path).toBe('c1/c2');
    expect(cat.isRootCategory).toBe(false);
    expect(cat.ancestorIds).toEqual(['c1']);
  });

  it('should generate slug from name', () => {
    expect(ProductCategory.generateSlug('Home & Garden!')).toBe('home-garden');
    expect(ProductCategory.generateSlug('Electronics')).toBe('electronics');
  });

  it('should update info', () => {
    const cat = ProductCategory.create({ categoryId: 'c1', name: 'Old Name' });
    cat.updateInfo({ name: 'New Name', description: 'Updated' });
    expect(cat.name).toBe('New Name');
    expect(cat.description).toBe('Updated');
    expect(cat.slug).toBe('new-name');
  });

  it('should activate and deactivate', () => {
    const cat = ProductCategory.create({ categoryId: 'c1', name: 'Cat' });
    cat.deactivate();
    expect(cat.isActive).toBe(false);
    cat.activate();
    expect(cat.isActive).toBe(true);
  });

  it('should set and remove image', () => {
    const cat = ProductCategory.create({ categoryId: 'c1', name: 'Cat' });
    cat.setImage('http://img.url');
    expect(cat.imageUrl).toBe('http://img.url');
    cat.removeImage();
    expect(cat.imageUrl).toBeUndefined();
  });

  it('should manage product count', () => {
    const cat = ProductCategory.create({ categoryId: 'c1', name: 'Cat' });
    cat.incrementProductCount();
    cat.incrementProductCount();
    expect(cat.productCount).toBe(2);
    expect(cat.hasProducts).toBe(true);
    cat.decrementProductCount();
    expect(cat.productCount).toBe(1);
  });

  it('should not go below zero product count', () => {
    const cat = ProductCategory.create({ categoryId: 'c1', name: 'Cat' });
    cat.decrementProductCount();
    expect(cat.productCount).toBe(0);
  });

  it('should move to new parent', () => {
    const cat = ProductCategory.create({ categoryId: 'c2', name: 'Child', parentId: 'c1', parentPath: 'c1' });
    cat.moveToParent('c3', 'c3');
    expect(cat.parentId).toBe('c3');
    expect(cat.path).toBe('c3/c2');
    expect(cat.level).toBe(2);
  });

  it('should update SEO', () => {
    const cat = ProductCategory.create({ categoryId: 'c1', name: 'Cat' });
    cat.updateSeo({ metaTitle: 'Best Cat', metaDescription: 'Cat desc' });
    expect(cat.metaTitle).toBe('Best Cat');
    expect(cat.metaDescription).toBe('Cat desc');
  });

  it('should set featured', () => {
    const cat = ProductCategory.create({ categoryId: 'c1', name: 'Cat' });
    cat.setFeatured(true);
    expect(cat.isFeatured).toBe(true);
  });

  it('should serialize to JSON', () => {
    const cat = ProductCategory.create({ categoryId: 'c1', name: 'Cat' });
    const json = cat.toJSON();
    expect(json.categoryId).toBe('c1');
    expect(json.isRootCategory).toBe(true);
  });
});
