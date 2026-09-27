/**
 * OrderLineExportRepository — domain port for the read-only order-line
 * projection used by cross-module consumers (recommendation co-purchase
 * counting, reporting feeds). Implemented by
 * infrastructure/repositories/orderLineExportRepo.ts.
 */

export interface OrderLineRef {
  orderId: string;
  productId: string;
  organizationId: string | null;
  storeId: string | null;
}

export interface OrderLineExportRepository {
  getLineRefs(orderId: string): Promise<OrderLineRef[]>;
  listPaidOrderIdsSince(since: Date, cursor: string | null, limit: number): Promise<{ orderIds: string[]; nextCursor: string | null }>;
}
