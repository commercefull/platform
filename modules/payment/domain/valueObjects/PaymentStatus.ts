/**
 * Payment Status Value Object
 */

export enum TransactionStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  PAID = 'paid',
  PARTIALLY_REFUNDED = 'partially_refunded',
  REFUNDED = 'refunded',
  VOIDED = 'voided',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export const TransactionStatusTransitions: Record<TransactionStatus, TransactionStatus[]> = {
  [TransactionStatus.PENDING]: [
    TransactionStatus.AUTHORIZED,
    TransactionStatus.PAID,
    TransactionStatus.FAILED,
    TransactionStatus.CANCELLED,
    TransactionStatus.EXPIRED,
  ],
  [TransactionStatus.AUTHORIZED]: [TransactionStatus.PAID, TransactionStatus.VOIDED, TransactionStatus.FAILED, TransactionStatus.EXPIRED],
  [TransactionStatus.PAID]: [TransactionStatus.PARTIALLY_REFUNDED, TransactionStatus.REFUNDED],
  [TransactionStatus.PARTIALLY_REFUNDED]: [TransactionStatus.REFUNDED],
  [TransactionStatus.REFUNDED]: [],
  [TransactionStatus.VOIDED]: [],
  [TransactionStatus.FAILED]: [TransactionStatus.PENDING],
  [TransactionStatus.CANCELLED]: [],
  [TransactionStatus.EXPIRED]: [],
};

export function canTransitionTo(current: TransactionStatus, next: TransactionStatus): boolean {
  return TransactionStatusTransitions[current]?.includes(next) ?? false;
}

export function getStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    [TransactionStatus.PENDING]: 'Pending',
    [TransactionStatus.AUTHORIZED]: 'Authorized',
    [TransactionStatus.PAID]: 'Paid',
    [TransactionStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
    [TransactionStatus.REFUNDED]: 'Refunded',
    [TransactionStatus.VOIDED]: 'Voided',
    [TransactionStatus.FAILED]: 'Failed',
    [TransactionStatus.CANCELLED]: 'Cancelled',
    [TransactionStatus.EXPIRED]: 'Expired',
  };
  return labels[status] || status;
}
