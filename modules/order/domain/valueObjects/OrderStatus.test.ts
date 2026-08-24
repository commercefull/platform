import { OrderStatus, OrderStatusTransitions, canTransitionTo, getStatusLabel } from './OrderStatus';

describe('OrderStatus', () => {
  it('should have correct enum values', () => {
    expect(OrderStatus.PENDING).toBe('pending');
    expect(OrderStatus.COMPLETED).toBe('completed');
    expect(OrderStatus.CANCELLED).toBe('cancelled');
  });

  it('should allow valid transitions', () => {
    expect(canTransitionTo(OrderStatus.PENDING, OrderStatus.PROCESSING)).toBe(true);
    expect(canTransitionTo(OrderStatus.PROCESSING, OrderStatus.SHIPPED)).toBe(true);
    expect(canTransitionTo(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).toBe(true);
    expect(canTransitionTo(OrderStatus.DELIVERED, OrderStatus.COMPLETED)).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(canTransitionTo(OrderStatus.CANCELLED, OrderStatus.PENDING)).toBe(false);
    expect(canTransitionTo(OrderStatus.COMPLETED, OrderStatus.PENDING)).toBe(false);
    expect(canTransitionTo(OrderStatus.REFUNDED, OrderStatus.PENDING)).toBe(false);
  });

  it('should return human-readable labels', () => {
    expect(getStatusLabel(OrderStatus.PENDING)).toBe('Pending');
    expect(getStatusLabel(OrderStatus.PAYMENT_PENDING)).toBe('Payment Pending');
    expect(getStatusLabel(OrderStatus.ON_HOLD)).toBe('On Hold');
  });

  it('should have terminal states with no transitions', () => {
    expect(OrderStatusTransitions[OrderStatus.CANCELLED]).toHaveLength(0);
    expect(OrderStatusTransitions[OrderStatus.REFUNDED]).toHaveLength(0);
  });
});
