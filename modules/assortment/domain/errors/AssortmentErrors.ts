import { AppError } from '../../../../libs/errors';

export class CollectionNotFoundError extends AppError {
  constructor(id: string) {
    super(`Collection not found: ${id}`, 404, { code: 'assortment.collection_not_found' });
  }
}

export class CollectionValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'assortment.collection_validation' });
  }
}

export class CollectionSlugAlreadyExistsError extends AppError {
  constructor(slug: string) {
    super(`Collection slug already exists: ${slug}`, 409, { code: 'assortment.slug_already_exists' });
  }
}

export class StoreAssortmentNotFoundError extends AppError {
  constructor(storeId: string) {
    super(`Store assortment not found: ${storeId}`, 404, { code: 'assortment.store_not_found' });
  }
}

export class AssortmentEntryNotFoundError extends AppError {
  constructor(entryId: string) {
    super(`Assortment entry not found: ${entryId}`, 404, { code: 'assortment.entry_not_found' });
  }
}
