import { TransactionStatus, TransactionStatusTransitions, canTransitionTo, getStatusLabel } from './PaymentStatus';

describe('PaymentStatus (Payment module)', () => {
  it('should have correct enum values', () => {
    expect(TransactionStatus.PENDING).toBe('pending');
    expect(TransactionStatus.PAID).toBe('paid');
    expect(TransactionStatus.REFUNDED).toBe('refunded');
  });

  it('should allow valid transitions', () => {
    expect(canTransitionTo(TransactionStatus.PENDING, TransactionStatus.AUTHORIZED)).toBe(true);
    expect(canTransitionTo(TransactionStatus.PENDING, TransactionStatus.PAID)).toBe(true);
    expect(canTransitionTo(TransactionStatus.AUTHORIZED, TransactionStatus.PAID)).toBe(true);
    expect(canTransitionTo(TransactionStatus.PAID, TransactionStatus.REFUNDED)).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(canTransitionTo(TransactionStatus.REFUNDED, TransactionStatus.PAID)).toBe(false);
    expect(canTransitionTo(TransactionStatus.VOIDED, TransactionStatus.PAID)).toBe(false);
    expect(canTransitionTo(TransactionStatus.CANCELLED, TransactionStatus.PENDING)).toBe(false);
  });

  it('should return human-readable labels', () => {
    expect(getStatusLabel(TransactionStatus.PENDING)).toBe('Pending');
    expect(getStatusLabel(TransactionStatus.PARTIALLY_REFUNDED)).toBe('Partially Refunded');
    expect(getStatusLabel(TransactionStatus.EXPIRED)).toBe('Expired');
  });

  it('should have terminal states with no transitions', () => {
    expect(TransactionStatusTransitions[TransactionStatus.REFUNDED]).toHaveLength(0);
    expect(TransactionStatusTransitions[TransactionStatus.VOIDED]).toHaveLength(0);
    expect(TransactionStatusTransitions[TransactionStatus.CANCELLED]).toHaveLength(0);
    expect(TransactionStatusTransitions[TransactionStatus.EXPIRED]).toHaveLength(0);
  });
});
