import {
  OrderNotFoundError, OrderPermissionError, CancelOrderPermissionError,
  OrderCannotBeCancelledError, OrderCannotBeRefundedError, OrderCannotBeModifiedError,
  InvalidOrderTransitionError, InvalidPaymentTransitionError, InvalidFulfillmentTransitionError,
  OrderMustContainItemsError, CustomerEmailRequiredError, ShippingAddressRequiredError,
  NoteContentEmptyError, CustomerIdRequiredError, OrderIdOrNumberRequiredError,
  OrderPaymentNotFoundError, RefundAmountMustBePositiveError, RefundExceedsOrderTotalError,
  RefundExceedsRefundableBalanceError, OrderItemNotFoundError, QuantityMustBeAtLeastOneError,
  FulfillmentPackageNotFoundError, NoEligibleStoresError, NoStoresWithInventoryError,
  NoPickupStoresError, NoFulfillmentStoresError, NoStoresWithInventoryForFulfillmentError,
  FailedToCreateFulfillmentStatusHistoryError, FailedToCreateOrderAddressError,
  FailedToCreateOrderAllocationError, FailedToCreateOrderDiscountError,
  FailedToCreateOrderFulfillmentItemError, FailedToCreateOrderFulfillmentPackageError,
  FailedToCreateOrderFulfillmentError, FailedToCreateOrderItemError, FailedToCreateOrderNoteError,
  FailedToCreateOrderPaymentRefundError, FailedToCreateOrderPaymentError, FailedToCreateOrderError,
  FailedToCreateOrderReturnItemError, FailedToCreateOrderReturnError,
  FailedToCreateOrderShippingRateError, FailedToCreateOrderShippingError, FailedToCreateOrderTaxError,
} from './OrderErrors';

describe('OrderErrors', () => {
  it('OrderNotFoundError', () => { expect(new OrderNotFoundError().statusCode).toBe(404); });
  it('OrderPermissionError', () => { expect(new OrderPermissionError().statusCode).toBe(403); });
  it('CancelOrderPermissionError', () => { expect(new CancelOrderPermissionError().statusCode).toBe(403); });
  it('OrderCannotBeCancelledError', () => { expect(new OrderCannotBeCancelledError('shipped').statusCode).toBe(400); });
  it('OrderCannotBeRefundedError', () => { expect(new OrderCannotBeRefundedError('bad', 'paid').statusCode).toBe(400); });
  it('OrderCannotBeModifiedError', () => { expect(new OrderCannotBeModifiedError('bad').statusCode).toBe(400); });
  it('InvalidOrderTransitionError', () => { expect(new InvalidOrderTransitionError('a', 'b').statusCode).toBe(400); });
  it('InvalidPaymentTransitionError', () => { expect(new InvalidPaymentTransitionError('a', 'b').statusCode).toBe(400); });
  it('InvalidFulfillmentTransitionError', () => { expect(new InvalidFulfillmentTransitionError('a', 'b').statusCode).toBe(400); });
  it('OrderMustContainItemsError', () => { expect(new OrderMustContainItemsError().statusCode).toBe(400); });
  it('CustomerEmailRequiredError', () => { expect(new CustomerEmailRequiredError().statusCode).toBe(400); });
  it('ShippingAddressRequiredError', () => { expect(new ShippingAddressRequiredError().statusCode).toBe(400); });
  it('NoteContentEmptyError', () => { expect(new NoteContentEmptyError().statusCode).toBe(400); });
  it('CustomerIdRequiredError', () => { expect(new CustomerIdRequiredError().statusCode).toBe(400); });
  it('OrderIdOrNumberRequiredError', () => { expect(new OrderIdOrNumberRequiredError().statusCode).toBe(400); });
  it('OrderPaymentNotFoundError', () => { expect(new OrderPaymentNotFoundError().statusCode).toBe(404); });
  it('RefundAmountMustBePositiveError', () => { expect(new RefundAmountMustBePositiveError().statusCode).toBe(400); });
  it('RefundExceedsOrderTotalError', () => { expect(new RefundExceedsOrderTotalError().statusCode).toBe(400); });
  it('RefundExceedsRefundableBalanceError', () => { expect(new RefundExceedsRefundableBalanceError(100).statusCode).toBe(400); });
  it('OrderItemNotFoundError', () => { expect(new OrderItemNotFoundError('i1').statusCode).toBe(404); });
  it('QuantityMustBeAtLeastOneError', () => { expect(new QuantityMustBeAtLeastOneError().statusCode).toBe(400); });
  it('FulfillmentPackageNotFoundError', () => { expect(new FulfillmentPackageNotFoundError().statusCode).toBe(404); });
  it('NoEligibleStoresError', () => { expect(new NoEligibleStoresError().statusCode).toBe(400); });
  it('NoStoresWithInventoryError', () => { expect(new NoStoresWithInventoryError().statusCode).toBe(400); });
  it('NoPickupStoresError', () => { expect(new NoPickupStoresError().statusCode).toBe(400); });
  it('NoFulfillmentStoresError', () => { expect(new NoFulfillmentStoresError().statusCode).toBe(400); });
  it('NoStoresWithInventoryForFulfillmentError', () => { expect(new NoStoresWithInventoryForFulfillmentError().statusCode).toBe(400); });
  it('FailedToCreateFulfillmentStatusHistoryError', () => { expect(new FailedToCreateFulfillmentStatusHistoryError().statusCode).toBe(500); });
  it('FailedToCreateOrderAddressError', () => { expect(new FailedToCreateOrderAddressError().statusCode).toBe(500); });
  it('FailedToCreateOrderAllocationError', () => { expect(new FailedToCreateOrderAllocationError().statusCode).toBe(500); });
  it('FailedToCreateOrderDiscountError', () => { expect(new FailedToCreateOrderDiscountError().statusCode).toBe(500); });
  it('FailedToCreateOrderFulfillmentItemError', () => { expect(new FailedToCreateOrderFulfillmentItemError().statusCode).toBe(500); });
  it('FailedToCreateOrderFulfillmentPackageError', () => { expect(new FailedToCreateOrderFulfillmentPackageError().statusCode).toBe(500); });
  it('FailedToCreateOrderFulfillmentError', () => { expect(new FailedToCreateOrderFulfillmentError().statusCode).toBe(500); });
  it('FailedToCreateOrderItemError', () => { expect(new FailedToCreateOrderItemError().statusCode).toBe(500); });
  it('FailedToCreateOrderNoteError', () => { expect(new FailedToCreateOrderNoteError().statusCode).toBe(500); });
  it('FailedToCreateOrderPaymentRefundError', () => { expect(new FailedToCreateOrderPaymentRefundError().statusCode).toBe(500); });
  it('FailedToCreateOrderPaymentError', () => { expect(new FailedToCreateOrderPaymentError().statusCode).toBe(500); });
  it('FailedToCreateOrderError', () => { expect(new FailedToCreateOrderError().statusCode).toBe(500); });
  it('FailedToCreateOrderReturnItemError', () => { expect(new FailedToCreateOrderReturnItemError().statusCode).toBe(500); });
  it('FailedToCreateOrderReturnError', () => { expect(new FailedToCreateOrderReturnError().statusCode).toBe(500); });
  it('FailedToCreateOrderShippingRateError', () => { expect(new FailedToCreateOrderShippingRateError().statusCode).toBe(500); });
  it('FailedToCreateOrderShippingError', () => { expect(new FailedToCreateOrderShippingError().statusCode).toBe(500); });
  it('FailedToCreateOrderTaxError', () => { expect(new FailedToCreateOrderTaxError().statusCode).toBe(500); });
});
