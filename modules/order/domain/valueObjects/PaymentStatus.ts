/**
 * Payment Status Value Object
 * Represents the possible payment states of an order
 */

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  PARTIALLY_REFUNDED = 'partially_refunded',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  VOIDED = 'voided',
  REQUIRES_ACTION = 'requires_action'
}

/**
 * State machine for payment status transitions
 */
export const PaymentStatusTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [PaymentStatus.AUTHORIZED, PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.REQUIRES_ACTION],
  [PaymentStatus.AUTHORIZED]: [PaymentStatus.PAID, PaymentStatus.VOIDED, PaymentStatus.FAILED],
  [PaymentStatus.REQUIRES_ACTION]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.PENDING],
  [PaymentStatus.PAID]: [PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED],
  [PaymentStatus.PARTIALLY_PAID]: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED],
  [PaymentStatus.PARTIALLY_REFUNDED]: [PaymentStatus.REFUNDED],
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.FAILED]: [PaymentStatus.PENDING],
  [PaymentStatus.VOIDED]: []
};

/**
 * Check if a payment status transition is valid
 */
export function canTransitionPaymentTo(currentStatus: PaymentStatus, newStatus: PaymentStatus): boolean {
  const allowedTransitions = PaymentStatusTransitions[currentStatus];
  return allowedTransitions?.includes(newStatus) ?? false;
}

/**
 * Get human-readable payment status label
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'Pending',
    [PaymentStatus.AUTHORIZED]: 'Authorized',
    [PaymentStatus.PAID]: 'Paid',
    [PaymentStatus.PARTIALLY_PAID]: 'Partially Paid',
    [PaymentStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
    [PaymentStatus.REFUNDED]: 'Refunded',
    [PaymentStatus.FAILED]: 'Failed',
    [PaymentStatus.VOIDED]: 'Voided',
    [PaymentStatus.REQUIRES_ACTION]: 'Requires Action'
  };
  return labels[status] || status;
}
