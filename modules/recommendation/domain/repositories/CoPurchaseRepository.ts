/**
 * Signal repository ports — the raw stores the nightly job reads:
 * co-purchase pairs, per-product order counts, tenant totals, and the
 * processed-order idempotency ledger.
 */

export interface CoPurchaseRow {
  productId: string;
  relatedProductId: string;
  coCount: number;
}

export interface SignalScope {
  organizationId: string;
  storeId?: string | null;
}

export interface ProcessedOrderRecord {
  orderId: string;
  organizationId: string;
  storeId: string | null;
  productIds: string[];
  status: 'counted' | 'reversed' | 'skipped';
}

export interface CoPurchaseRepository {
  /** +delta on every ordered pair (A≠B) within the scope. */
  incrementPairs(scope: SignalScope, productIds: string[], delta?: number): Promise<void>;
  /** -1 on every ordered pair for a reversed order. */
  decrementPairs(scope: SignalScope, productIds: string[]): Promise<void>;
  /** +delta on each product's order count. */
  incrementProductCounts(scope: SignalScope, productIds: string[], delta?: number): Promise<void>;
  /** +delta on the tenant/store total order count. */
  incrementTotalOrders(scope: SignalScope, delta?: number): Promise<void>;

  /** Decayed pairs for a source product (nightly FBT rebuild input). */
  listPairsForProducts(scope: SignalScope, productIds: string[]): Promise<CoPurchaseRow[]>;
  /** All pairs in scope — nightly rebuild scans the whole tenant. */
  listAllPairs(scope: SignalScope): Promise<CoPurchaseRow[]>;
  /** Decayed order count per product. */
  listProductCounts(scope: SignalScope, productIds: string[]): Promise<Map<string, number>>;
  /** All product order counts in scope (popular rebuild). */
  listAllProductCounts(scope: SignalScope): Promise<Map<string, number>>;
  /** Decayed tenant order total. */
  getTotalOrders(scope: SignalScope): Promise<number>;

  /** Nightly decay across all rows in scope; prune rows below `floor`. */
  applyDecay(scope: SignalScope, factor: number, floor: number): Promise<void>;
}

export interface ProcessedOrderRepository {
  get(orderId: string): Promise<ProcessedOrderRecord | null>;
  insert(record: ProcessedOrderRecord): Promise<void>;
  markStatus(orderId: string, status: ProcessedOrderRecord['status']): Promise<void>;
}
