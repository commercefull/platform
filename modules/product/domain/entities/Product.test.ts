/**
 * Unit Tests for Product Domain Entity
 */

import { Product } from './Product';
import { ProductStatus } from '../valueObjects/ProductStatus';
import { ProductVisibility } from '../valueObjects/ProductVisibility';
import { ProductValidationError } from '../errors/ProductErrors';

describe('Product Entity', () => {
  describe('create', () => {
    it('should create a draft product with auto-generated slug and sku', () => {
      const product = Product.create({
        productId: 'p-1',
        name: 'Test Product',
        description: 'desc',
        productTypeId: 'pt-1',
      });

      expect(product.productId).toBe('p-1');
      expect(product.name).toBe('Test Product');
      expect(product.status).toBe(ProductStatus.DRAFT);
      expect(product.visibility).toBe(ProductVisibility.NOT_VISIBLE);
      expect(product.slug).toBeDefined();
      expect(product.sku).toBeDefined();
      expect(product.isTaxable).toBe(true);
      expect(product.isPurchasable).toBe(false);
    });

    it('should use provided slug and sku', () => {
      const product = Product.create({
        productId: 'p-1',
        name: 'Test',
        description: 'desc',
        productTypeId: 'pt-1',
        slug: 'custom-slug',
        sku: 'CUSTOM-SKU',
      });

      expect(product.slug).toBe('custom-slug');
      expect(product.sku).toBe('CUSTOM-SKU');
    });
  });

  describe('updateStatus', () => {
    it('should transition from draft to active', () => {
      const product = Product.create({
        productId: 'p-1',
        name: 'Test',
        description: 'desc',
        productTypeId: 'pt-1',
      });

      product.updateStatus(ProductStatus.ACTIVE);

      expect(product.status).toBe(ProductStatus.ACTIVE);
    });
  });

  describe('publish / unpublish', () => {
    it('should publish an active product', () => {
      const product = Product.create({
        productId: 'p-1',
        name: 'Test',
        description: 'desc',
        productTypeId: 'pt-1',
      });
      product.updateStatus(ProductStatus.ACTIVE);

      product.publish();

      expect(product.isPublished).toBe(true);
      expect(product.publishedAt).toBeDefined();
    });

    it('should throw when publishing a draft product', () => {
      const product = Product.create({
        productId: 'p-1',
        name: 'Test',
        description: 'desc',
        productTypeId: 'pt-1',
      });

      expect(() => product.publish()).toThrow(ProductValidationError);
    });

    it('should unpublish a published product', () => {
      const product = Product.create({
        productId: 'p-1',
        name: 'Test',
        description: 'desc',
        productTypeId: 'pt-1',
      });
      product.updateStatus(ProductStatus.ACTIVE);
      product.publish();

      product.unpublish();

      expect(product.visibility).toBe(ProductVisibility.NOT_VISIBLE);
    });
  });

  describe('updatePrice', () => {
    it('should update price', () => {
      const product = Product.create({
        productId: 'p-1',
        name: 'Test',
        description: 'desc',
        productTypeId: 'pt-1',
        basePrice: 100,
      });

      product.updatePrice(150, undefined, 80);

      expect(product.price.basePrice).toBe(150);
      expect(product.price.cost).toBe(80);
    });
  });

  describe('archive', () => {
    it('should archive a product', () => {
      const product = Product.create({
        productId: 'p-1',
        name: 'Test',
        description: 'desc',
        productTypeId: 'pt-1',
      });
      product.updateStatus(ProductStatus.ACTIVE);

      product.archive();

      expect(product.status).toBe(ProductStatus.ARCHIVED);
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from name', () => {
      expect(Product.generateSlug('Hello World!')).toBe('hello-world');
      expect(Product.generateSlug('Special -- Characters')).toBe('special-characters');
    });
  });
});
