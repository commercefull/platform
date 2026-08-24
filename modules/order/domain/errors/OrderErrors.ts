/**
 * Order Domain Errors
 *
 * Typed errors for order module operations.
 * All errors extend AppError with stable codes and appropriate status codes.
 */

import { AppError } from '../../../../libs/errors';

// ============================================================================
// Order Not Found / Permission Errors
// ============================================================================

export class OrderNotFoundError extends AppError {
  constructor() {
    super('Order not found', 404, { code: 'order.not_found' });
  }
}

export class OrderPermissionError extends AppError {
  constructor() {
    super('You do not have permission to view this order', 403, { code: 'order.permission_denied' });
  }
}

export class CancelOrderPermissionError extends AppError {
  constructor() {
    super('You do not have permission to cancel this order', 403, { code: 'order.cancel_permission_denied' });
  }
}

// ============================================================================
// Order State Errors
// ============================================================================

export class OrderCannotBeCancelledError extends AppError {
  constructor(status: string) {
    super(`Order cannot be cancelled. Current status: ${status}`, 400, { code: 'order.cannot_be_cancelled' });
  }
}

export class OrderCannotBeRefundedError extends AppError {
  constructor(status: string, paymentStatus: string) {
    super(`Order cannot be refunded. Current status: ${status}, Payment status: ${paymentStatus}`, 400, { code: 'order.cannot_be_refunded' });
  }
}

export class OrderCannotBeModifiedError extends AppError {
  constructor(status: string) {
    super(`Cannot modify order in status: ${status}`, 400, { code: 'order.cannot_be_modified' });
  }
}

export class InvalidOrderTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`Cannot transition order from ${from} to ${to}`, 400, { code: 'order.invalid_transition' });
  }
}

export class InvalidPaymentTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`Cannot transition payment from ${from} to ${to}`, 400, { code: 'order.invalid_payment_transition' });
  }
}

export class InvalidFulfillmentTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`Cannot transition fulfillment from ${from} to ${to}`, 400, { code: 'order.invalid_fulfillment_transition' });
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class OrderMustContainItemsError extends AppError {
  constructor() {
    super('Order must contain at least one item', 400, { code: 'order.must_contain_items' });
  }
}

export class CustomerEmailRequiredError extends AppError {
  constructor() {
    super('Customer email is required', 400, { code: 'order.customer_email_required' });
  }
}

export class ShippingAddressRequiredError extends AppError {
  constructor() {
    super('Shipping address is required', 400, { code: 'order.shipping_address_required' });
  }
}

export class NoteContentEmptyError extends AppError {
  constructor() {
    super('Note content cannot be empty', 400, { code: 'order.note_content_empty' });
  }
}

export class CustomerIdRequiredError extends AppError {
  constructor() {
    super('Customer ID is required', 400, { code: 'order.customer_id_required' });
  }
}

export class OrderIdOrNumberRequiredError extends AppError {
  constructor() {
    super('Either orderId or orderNumber must be provided', 400, { code: 'order.id_or_number_required' });
  }
}

// ============================================================================
// Refund Errors
// ============================================================================

export class OrderPaymentNotFoundError extends AppError {
  constructor() {
    super('Order payment not found', 404, { code: 'order.payment_not_found' });
  }
}

export class RefundAmountMustBePositiveError extends AppError {
  constructor() {
    super('Refund amount must be greater than zero', 400, { code: 'order.refund_amount_must_be_positive' });
  }
}

export class RefundExceedsOrderTotalError extends AppError {
  constructor() {
    super('Refund amount cannot exceed order total', 400, { code: 'order.refund_exceeds_total' });
  }
}

export class RefundExceedsRefundableBalanceError extends AppError {
  constructor(maxRefundable: number) {
    super(`Refund amount exceeds refundable balance of ${maxRefundable}`, 400, { code: 'order.refund_exceeds_refundable_balance' });
  }
}

// ============================================================================
// Domain Entity Errors
// ============================================================================

export class OrderItemNotFoundError extends AppError {
  constructor(orderItemId: string) {
    super(`Item ${orderItemId} not found in order`, 404, { code: 'order.item_not_found' });
  }
}

export class QuantityMustBeAtLeastOneError extends AppError {
  constructor() {
    super('Quantity must be at least 1', 400, { code: 'order.quantity_must_be_at_least_one' });
  }
}

export class FulfillmentPackageNotFoundError extends AppError {
  constructor() {
    super('Fulfillment package not found', 404, { code: 'order.fulfillment_package_not_found' });
  }
}

// ============================================================================
// Order Router Errors
// ============================================================================

export class NoEligibleStoresError extends AppError {
  constructor() {
    super('No eligible stores found for order fulfillment', 400, { code: 'order.no_eligible_stores' });
  }
}

export class NoStoresWithInventoryError extends AppError {
  constructor() {
    super('No stores have sufficient inventory', 400, { code: 'order.no_stores_with_inventory' });
  }
}

export class NoPickupStoresError extends AppError {
  constructor() {
    super('No pickup-enabled stores available', 400, { code: 'order.no_pickup_stores' });
  }
}

export class NoFulfillmentStoresError extends AppError {
  constructor() {
    super('No fulfillment-enabled stores available', 400, { code: 'order.no_fulfillment_stores' });
  }
}

export class NoStoresWithInventoryForFulfillmentError extends AppError {
  constructor() {
    super('No stores have inventory for fulfillment', 400, { code: 'order.no_stores_with_inventory_for_fulfillment' });
  }
}

// ============================================================================
// Infrastructure Errors
// ============================================================================

export class FailedToCreateFulfillmentStatusHistoryError extends AppError {
  constructor() {
    super('Failed to create fulfillment status history', 500, { code: 'order.fulfillment_status_history_creation_failed' });
  }
}

export class FailedToCreateOrderAddressError extends AppError {
  constructor() {
    super('Failed to create order address', 500, { code: 'order.address_creation_failed' });
  }
}

export class FailedToCreateOrderAllocationError extends AppError {
  constructor() {
    super('Failed to create order allocation', 500, { code: 'order.allocation_creation_failed' });
  }
}

export class FailedToCreateOrderDiscountError extends AppError {
  constructor() {
    super('Failed to create orderDiscount', 500, { code: 'order.discount_creation_failed' });
  }
}

export class FailedToCreateOrderFulfillmentItemError extends AppError {
  constructor() {
    super('Failed to create orderFulfillmentItem', 500, { code: 'order.fulfillment_item_creation_failed' });
  }
}

export class FailedToCreateOrderFulfillmentPackageError extends AppError {
  constructor() {
    super('Failed to create orderFulfillmentPackage', 500, { code: 'order.fulfillment_package_creation_failed' });
  }
}

export class FailedToCreateOrderFulfillmentError extends AppError {
  constructor() {
    super('Failed to create order fulfillment', 500, { code: 'order.fulfillment_creation_failed' });
  }
}

export class FailedToCreateOrderItemError extends AppError {
  constructor() {
    super('Failed to create order item', 500, { code: 'order.item_creation_failed' });
  }
}

export class FailedToCreateOrderNoteError extends AppError {
  constructor() {
    super('Failed to create orderNote', 500, { code: 'order.note_creation_failed' });
  }
}

export class FailedToCreateOrderPaymentRefundError extends AppError {
  constructor() {
    super('Failed to create orderPaymentRefund', 500, { code: 'order.payment_refund_creation_failed' });
  }
}

export class FailedToCreateOrderPaymentError extends AppError {
  constructor() {
    super('Failed to create orderPayment', 500, { code: 'order.payment_creation_failed' });
  }
}

export class FailedToCreateOrderError extends AppError {
  constructor() {
    super('Failed to create order', 500, { code: 'order.creation_failed' });
  }
}

export class FailedToCreateOrderReturnItemError extends AppError {
  constructor() {
    super('Failed to create orderReturnItem', 500, { code: 'order.return_item_creation_failed' });
  }
}

export class FailedToCreateOrderReturnError extends AppError {
  constructor() {
    super('Failed to create order return', 500, { code: 'order.return_creation_failed' });
  }
}

export class FailedToCreateOrderShippingRateError extends AppError {
  constructor() {
    super('Failed to create orderShippingRate', 500, { code: 'order.shipping_rate_creation_failed' });
  }
}

export class FailedToCreateOrderShippingError extends AppError {
  constructor() {
    super('Failed to create orderShipping', 500, { code: 'order.shipping_creation_failed' });
  }
}

export class FailedToCreateOrderTaxError extends AppError {
  constructor() {
    super('Failed to create orderTax', 500, { code: 'order.tax_creation_failed' });
  }
}
