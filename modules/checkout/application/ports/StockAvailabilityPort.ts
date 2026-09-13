/**
 * StockAvailabilityPort
 *
 * ACL port owned by checkout. Checks inventory availability
 * for line items before confirming checkout.
 *
 * Extended in Epic J to surface allocation-rule-derived fields:
 * allocatedLocationId, isBackordered, estimatedRestockDate.
 */

export interface StockAvailabilityRequest {
  productId: string;
  productVariantId?: string;
  quantity: number;
}

export interface StockAvailabilityResult {
  available: boolean;
  stockLevel?: number;
  /** Location allocated to fulfill this request (Epic J) */
  allocatedLocationId?: string;
  /** Whether this item will be backordered (Epic J) */
  isBackordered?: boolean;
  /** Estimated restock date if backordered (Epic J) */
  estimatedRestockDate?: Date;
}

export interface StockAvailabilityPort {
  checkAvailability(request: StockAvailabilityRequest): Promise<StockAvailabilityResult>;
}
