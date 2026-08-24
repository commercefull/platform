import { PaymentStatus, PaymentStatusTransitions, canTransitionPaymentTo, getPaymentStatusLabel } from './PaymentStatus';

describe('PaymentStatus', () => {
  it('should have correct enum values', () => {
    expect(PaymentStatus.PENDING).toBe('pending');
    expect(PaymentStatus.PAID).toBe('paid');
    expect(PaymentStatus.REFUNDED).toBe('refunded');
  });

  it('should allow valid transitions', () => {
    expect(canTransitionPaymentTo(PaymentStatus.PENDING, PaymentStatus.AUTHORIZED)).toBe(true);
    expect(canTransitionPaymentTo(PaymentStatus.PENDING, PaymentStatus.PAID)).toBe(true);
    expect(canTransitionPaymentTo(PaymentStatus.AUTHORIZED, PaymentStatus.PAID)).toBe(true);
    expect(canTransitionPaymentTo(PaymentStatus.PAID, PaymentStatus.REFUNDED)).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(canTransitionPaymentTo(PaymentStatus.REFUNDED, PaymentStatus.PAID)).toBe(false);
    expect(canTransitionPaymentTo(PaymentStatus.VOIDED, PaymentStatus.PAID)).toBe(false);
  });

  it('should return human-readable labels', () => {
    expect(getPaymentStatusLabel(PaymentStatus.PENDING)).toBe('Pending');
    expect(getPaymentStatusLabel(PaymentStatus.PARTIALLY_PAID)).toBe('Partially Paid');
    expect(getPaymentStatusLabel(PaymentStatus.REQUIRES_ACTION)).toBe('Requires Action');
  });

  it('should have terminal states with no transitions', () => {
    expect(PaymentStatusTransitions[PaymentStatus.REFUNDED]).toHaveLength(0);
    expect(PaymentStatusTransitions[PaymentStatus.VOIDED]).toHaveLength(0);
  });
});
