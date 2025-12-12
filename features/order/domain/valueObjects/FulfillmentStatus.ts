/**
 * Fulfillment Status Value Object
 * Represents the possible fulfillment states of an order
 */

export enum FulfillmentStatus {
  UNFULFILLED = 'unfulfilled',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  FULFILLED = 'fulfilled',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  PENDING_PICKUP = 'pending_pickup',
  PICKED_UP = 'picked_up'
}

/**
 * State machine for fulfillment status transitions
 */
export const FulfillmentStatusTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  [FulfillmentStatus.UNFULFILLED]: [FulfillmentStatus.PARTIALLY_FULFILLED, FulfillmentStatus.FULFILLED, FulfillmentStatus.CANCELLED],
  [FulfillmentStatus.PARTIALLY_FULFILLED]: [FulfillmentStatus.FULFILLED, FulfillmentStatus.CANCELLED],
  [FulfillmentStatus.FULFILLED]: [FulfillmentStatus.SHIPPED, FulfillmentStatus.PENDING_PICKUP, FulfillmentStatus.CANCELLED],
  [FulfillmentStatus.SHIPPED]: [FulfillmentStatus.DELIVERED, FulfillmentStatus.RETURNED],
  [FulfillmentStatus.PENDING_PICKUP]: [FulfillmentStatus.PICKED_UP, FulfillmentStatus.CANCELLED],
  [FulfillmentStatus.PICKED_UP]: [FulfillmentStatus.RETURNED],
  [FulfillmentStatus.DELIVERED]: [FulfillmentStatus.RETURNED],
  [FulfillmentStatus.CANCELLED]: [],
  [FulfillmentStatus.RETURNED]: []
};

/**
 * Check if a fulfillment status transition is valid
 */
export function canTransitionFulfillmentTo(currentStatus: FulfillmentStatus, newStatus: FulfillmentStatus): boolean {
  const allowedTransitions = FulfillmentStatusTransitions[currentStatus];
  return allowedTransitions?.includes(newStatus) ?? false;
}

/**
 * Get human-readable fulfillment status label
 */
export function getFulfillmentStatusLabel(status: FulfillmentStatus): string {
  const labels: Record<FulfillmentStatus, string> = {
    [FulfillmentStatus.UNFULFILLED]: 'Unfulfilled',
    [FulfillmentStatus.PARTIALLY_FULFILLED]: 'Partially Fulfilled',
    [FulfillmentStatus.FULFILLED]: 'Fulfilled',
    [FulfillmentStatus.SHIPPED]: 'Shipped',
    [FulfillmentStatus.DELIVERED]: 'Delivered',
    [FulfillmentStatus.CANCELLED]: 'Cancelled',
    [FulfillmentStatus.RETURNED]: 'Returned',
    [FulfillmentStatus.PENDING_PICKUP]: 'Pending Pickup',
    [FulfillmentStatus.PICKED_UP]: 'Picked Up'
  };
  return labels[status] || status;
}
