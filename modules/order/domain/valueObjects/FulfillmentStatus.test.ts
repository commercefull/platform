import { FulfillmentStatus, FulfillmentStatusTransitions, canTransitionFulfillmentTo, getFulfillmentStatusLabel } from './FulfillmentStatus';

describe('FulfillmentStatus', () => {
  it('should have correct enum values', () => {
    expect(FulfillmentStatus.UNFULFILLED).toBe('unfulfilled');
    expect(FulfillmentStatus.SHIPPED).toBe('shipped');
    expect(FulfillmentStatus.DELIVERED).toBe('delivered');
  });

  it('should allow valid transitions', () => {
    expect(canTransitionFulfillmentTo(FulfillmentStatus.UNFULFILLED, FulfillmentStatus.FULFILLED)).toBe(true);
    expect(canTransitionFulfillmentTo(FulfillmentStatus.FULFILLED, FulfillmentStatus.SHIPPED)).toBe(true);
    expect(canTransitionFulfillmentTo(FulfillmentStatus.SHIPPED, FulfillmentStatus.DELIVERED)).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(canTransitionFulfillmentTo(FulfillmentStatus.CANCELLED, FulfillmentStatus.SHIPPED)).toBe(false);
    expect(canTransitionFulfillmentTo(FulfillmentStatus.RETURNED, FulfillmentStatus.DELIVERED)).toBe(false);
  });

  it('should return human-readable labels', () => {
    expect(getFulfillmentStatusLabel(FulfillmentStatus.UNFULFILLED)).toBe('Unfulfilled');
    expect(getFulfillmentStatusLabel(FulfillmentStatus.PENDING_PICKUP)).toBe('Pending Pickup');
    expect(getFulfillmentStatusLabel(FulfillmentStatus.PARTIALLY_FULFILLED)).toBe('Partially Fulfilled');
  });

  it('should have terminal states with no transitions', () => {
    expect(FulfillmentStatusTransitions[FulfillmentStatus.CANCELLED]).toHaveLength(0);
    expect(FulfillmentStatusTransitions[FulfillmentStatus.RETURNED]).toHaveLength(0);
  });
});
