import { AppError } from '../../../../libs/errors';

export class SupplierNotFoundError extends AppError {
  constructor(supplierId: string) {
    super(`Supplier not found: ${supplierId}`, 404, { code: 'supplier.not_found' });
  }
}

export class SupplierCodeAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Supplier code already exists: ${code}`, 409, { code: 'supplier.code_already_exists' });
  }
}

export class SupplierNotActiveError extends AppError {
  constructor(supplierId: string) {
    super(`Supplier ${supplierId} is not active`, 400, { code: 'supplier.not_active' });
  }
}

export class SupplierAddressNotFoundError extends AppError {
  constructor(addressId: string) {
    super(`Supplier address not found: ${addressId}`, 404, { code: 'supplier.address_not_found' });
  }
}

export class SupplierProductNotFoundError extends AppError {
  constructor(productId: string) {
    super(`Supplier product not found: ${productId}`, 404, { code: 'supplier.product_not_found' });
  }
}

export class PurchaseOrderNotFoundError extends AppError {
  constructor(poId: string) {
    super(`Purchase order not found: ${poId}`, 404, { code: 'supplier.po_not_found' });
  }
}

export class PurchaseOrderCannotBeCancelledError extends AppError {
  constructor(status: string) {
    super(`Purchase order cannot be cancelled in status: ${status}`, 400, { code: 'supplier.po_cannot_be_cancelled' });
  }
}

export class PurchaseOrderCannotBeApprovedError extends AppError {
  constructor(status: string) {
    super(`Purchase order cannot be approved in status: ${status}`, 400, { code: 'supplier.po_cannot_be_approved' });
  }
}

export class ReceivingRecordNotFoundError extends AppError {
  constructor(recordId: string) {
    super(`Receiving record not found: ${recordId}`, 404, { code: 'supplier.receiving_not_found' });
  }
}

export class FailedToCreateSupplierError extends AppError {
  constructor() {
    super('Failed to create supplier', 500, { code: 'supplier.creation_failed' });
  }
}

export class SupplierValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'supplier.validation_error' });
  }
}

export class FailedToCreateSupplierEntityError extends AppError {
  constructor(message: string) {
    super(message, 500, { code: 'supplier.entity_creation_failed' });
  }
}

export class PurchaseOrderItemNotFoundError extends AppError {
  constructor(itemId: string) {
    super(`Purchase order item not found: ${itemId}`, 404, { code: 'supplier.po_item_not_found' });
  }
}
