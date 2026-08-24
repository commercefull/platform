import { AppError } from '../../../../libs/errors';

export class ProductNotFoundError extends AppError {
  constructor(productId: string) {
    super(`Product not found: ${productId}`, 404, { code: 'product.not_found' });
  }
}

export class ProductVariantNotFoundError extends AppError {
  constructor(variantId: string) {
    super(`Product variant not found: ${variantId}`, 404, { code: 'product.variant_not_found' });
  }
}

export class ProductSkuAlreadyExistsError extends AppError {
  constructor(sku: string) {
    super(`Product SKU already exists: ${sku}`, 409, { code: 'product.sku_already_exists' });
  }
}

export class ProductSlugAlreadyExistsError extends AppError {
  constructor(slug: string) {
    super(`Product slug already exists: ${slug}`, 409, { code: 'product.slug_already_exists' });
  }
}

export class ProductCategoryNotFoundError extends AppError {
  constructor(categoryId: string) {
    super(`Product category not found: ${categoryId}`, 404, { code: 'product.category_not_found' });
  }
}

export class ProductCollectionNotFoundError extends AppError {
  constructor(collectionId: string) {
    super(`Product collection not found: ${collectionId}`, 404, { code: 'product.collection_not_found' });
  }
}

export class ProductAttributeNotFoundError extends AppError {
  constructor(attributeId: string) {
    super(`Product attribute not found: ${attributeId}`, 404, { code: 'product.attribute_not_found' });
  }
}

export class ProductImageNotFoundError extends AppError {
  constructor(imageId: string) {
    super(`Product image not found: ${imageId}`, 404, { code: 'product.image_not_found' });
  }
}

export class InvalidProductStatusError extends AppError {
  constructor(currentStatus: string, newStatus?: string) {
    super(
      newStatus
        ? `Cannot transition product from ${currentStatus} to ${newStatus}`
        : `Invalid product status: ${currentStatus}`,
      400,
      { code: 'product.invalid_status' },
    );
  }
}

export class FailedToCreateProductError extends AppError {
  constructor() {
    super('Failed to create product', 500, { code: 'product.creation_failed' });
  }
}

export class ProductValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'product.validation_error' });
  }
}

export class FailedToEnsureMasterVariantsError extends AppError {
  constructor(reason: string) {
    super(`Failed to ensure master variants: ${reason}`, 500, { code: 'product.master_variant_ensure_failed' });
  }
}
