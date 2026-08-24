import {
  StoreNotFoundError, StoreSlugAlreadyExistsError, StoreNotActiveError, StoreHierarchyNotFoundError,
  PickupConfigNotFoundError, LocalDeliveryZoneNotFoundError, FailedToCreateStoreError, StoreValidationError,
} from './StoreErrors';

describe('StoreErrors', () => {
  it('StoreNotFoundError', () => { expect(new StoreNotFoundError('s1').statusCode).toBe(404); });
  it('StoreSlugAlreadyExistsError', () => { expect(new StoreSlugAlreadyExistsError('slug').statusCode).toBe(409); });
  it('StoreNotActiveError', () => { expect(new StoreNotActiveError('s1').statusCode).toBe(400); });
  it('StoreHierarchyNotFoundError', () => { expect(new StoreHierarchyNotFoundError('h1').statusCode).toBe(404); });
  it('PickupConfigNotFoundError', () => { expect(new PickupConfigNotFoundError('s1').statusCode).toBe(404); });
  it('LocalDeliveryZoneNotFoundError', () => { expect(new LocalDeliveryZoneNotFoundError('z1').statusCode).toBe(404); });
  it('FailedToCreateStoreError', () => { expect(new FailedToCreateStoreError().statusCode).toBe(500); });
  it('StoreValidationError', () => { expect(new StoreValidationError('bad').statusCode).toBe(400); });
});
