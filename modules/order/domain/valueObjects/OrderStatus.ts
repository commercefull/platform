/**
 * Order Status Value Object
 * Represents the possible states of an order
 */

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_FAILED = 'payment_failed',
  BACKORDERED = 'backordered',
}

/**
 * State machine for order status transitions
 */
export const OrderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED, OrderStatus.FAILED],
  [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [
    OrderStatus.SHIPPED,
    OrderStatus.ON_HOLD,
    OrderStatus.BACKORDERED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.ON_HOLD]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.BACKORDERED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED],
  [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
  [OrderStatus.FAILED]: [OrderStatus.PENDING],
};

/**
 * Check if a status transition is valid
 */
export function canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const allowedTransitions = OrderStatusTransitions[currentStatus];
  return allowedTransitions?.includes(newStatus) ?? false;
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Pending',
    [OrderStatus.PROCESSING]: 'Processing',
    [OrderStatus.ON_HOLD]: 'On Hold',
    [OrderStatus.COMPLETED]: 'Completed',
    [OrderStatus.SHIPPED]: 'Shipped',
    [OrderStatus.DELIVERED]: 'Delivered',
    [OrderStatus.CANCELLED]: 'Cancelled',
    [OrderStatus.REFUNDED]: 'Refunded',
    [OrderStatus.FAILED]: 'Failed',
    [OrderStatus.PAYMENT_PENDING]: 'Payment Pending',
    [OrderStatus.PAYMENT_FAILED]: 'Payment Failed',
    [OrderStatus.BACKORDERED]: 'Backordered',
  };
  return labels[status] || status;
}
