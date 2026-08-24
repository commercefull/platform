import {
  SupplierNotFoundError, SupplierCodeAlreadyExistsError, SupplierNotActiveError,
  SupplierAddressNotFoundError, SupplierProductNotFoundError, PurchaseOrderNotFoundError,
  PurchaseOrderCannotBeCancelledError, PurchaseOrderCannotBeApprovedError, ReceivingRecordNotFoundError,
  FailedToCreateSupplierError, SupplierValidationError, FailedToCreateSupplierEntityError,
  PurchaseOrderItemNotFoundError,
} from './SupplierErrors';

describe('SupplierErrors', () => {
  it('SupplierNotFoundError', () => { expect(new SupplierNotFoundError('s1').statusCode).toBe(404); });
  it('SupplierCodeAlreadyExistsError', () => { expect(new SupplierCodeAlreadyExistsError('code').statusCode).toBe(409); });
  it('SupplierNotActiveError', () => { expect(new SupplierNotActiveError('s1').statusCode).toBe(400); });
  it('SupplierAddressNotFoundError', () => { expect(new SupplierAddressNotFoundError('a1').statusCode).toBe(404); });
  it('SupplierProductNotFoundError', () => { expect(new SupplierProductNotFoundError('p1').statusCode).toBe(404); });
  it('PurchaseOrderNotFoundError', () => { expect(new PurchaseOrderNotFoundError('po1').statusCode).toBe(404); });
  it('PurchaseOrderCannotBeCancelledError', () => { expect(new PurchaseOrderCannotBeCancelledError('bad').statusCode).toBe(400); });
  it('PurchaseOrderCannotBeApprovedError', () => { expect(new PurchaseOrderCannotBeApprovedError('bad').statusCode).toBe(400); });
  it('ReceivingRecordNotFoundError', () => { expect(new ReceivingRecordNotFoundError('r1').statusCode).toBe(404); });
  it('FailedToCreateSupplierError', () => { expect(new FailedToCreateSupplierError().statusCode).toBe(500); });
  it('SupplierValidationError', () => { expect(new SupplierValidationError('bad').statusCode).toBe(400); });
  it('FailedToCreateSupplierEntityError', () => { expect(new FailedToCreateSupplierEntityError('err').statusCode).toBe(500); });
  it('PurchaseOrderItemNotFoundError', () => { expect(new PurchaseOrderItemNotFoundError('i1').statusCode).toBe(404); });
});
