/**
 * OrderLinesPort — consumer-owned port onto the order module.
 * Implemented by infrastructure/acl/OrderLinesAdapter.
 */

export interface OrderLineRef {
  orderId: string;
  productId: string;
  organizationId: string | null;
  storeId: string | null;
}

export interface OrderLinesPort {
  /** Product ids + scope for one order (order.paid / reversal handling). */
  getLines(orderId: string): Promise<OrderLineRef[]>;

  /**
   * Page through paid orders since a date for the one-off backfill.
   * Returns order ids + a cursor (null = done).
   */
  listPaidOrderIdsSince(since: Date, cursor: string | null, limit: number): Promise<{ orderIds: string[]; nextCursor: string | null }>;
}
