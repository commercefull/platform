import {
  ProductNotFoundError, ProductVariantNotFoundError, ProductSkuAlreadyExistsError,
  ProductSlugAlreadyExistsError, ProductCategoryNotFoundError, ProductCollectionNotFoundError,
  ProductAttributeNotFoundError, ProductImageNotFoundError, InvalidProductStatusError,
  FailedToCreateProductError, ProductValidationError, FailedToEnsureMasterVariantsError,
} from './ProductErrors';

describe('ProductErrors', () => {
  it('ProductNotFoundError', () => { expect(new ProductNotFoundError('p1').statusCode).toBe(404); });
  it('ProductVariantNotFoundError', () => { expect(new ProductVariantNotFoundError('v1').statusCode).toBe(404); });
  it('ProductSkuAlreadyExistsError', () => { expect(new ProductSkuAlreadyExistsError('sku1').statusCode).toBe(409); });
  it('ProductSlugAlreadyExistsError', () => { expect(new ProductSlugAlreadyExistsError('slug1').statusCode).toBe(409); });
  it('ProductCategoryNotFoundError', () => { expect(new ProductCategoryNotFoundError('c1').statusCode).toBe(404); });
  it('ProductCollectionNotFoundError', () => { expect(new ProductCollectionNotFoundError('col1').statusCode).toBe(404); });
  it('ProductAttributeNotFoundError', () => { expect(new ProductAttributeNotFoundError('a1').statusCode).toBe(404); });
  it('ProductImageNotFoundError', () => { expect(new ProductImageNotFoundError('i1').statusCode).toBe(404); });
  it('InvalidProductStatusError with newStatus', () => {
    const err = new InvalidProductStatusError('draft', 'published');
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('draft');
    expect(err.message).toContain('published');
  });
  it('InvalidProductStatusError without newStatus', () => {
    const err = new InvalidProductStatusError('invalid');
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('invalid');
  });
  it('FailedToCreateProductError', () => { expect(new FailedToCreateProductError().statusCode).toBe(500); });
  it('ProductValidationError', () => { expect(new ProductValidationError('bad').statusCode).toBe(400); });
  it('FailedToEnsureMasterVariantsError', () => { expect(new FailedToEnsureMasterVariantsError('reason').statusCode).toBe(500); });
});
