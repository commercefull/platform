/**
 * StockAvailabilityPort
 *
 * ACL port owned by checkout. Checks inventory availability
 * for line items before confirming checkout.
 */

export interface StockAvailabilityRequest {
  productId: string;
  productVariantId?: string;
  quantity: number;
}

export interface StockAvailabilityResult {
  available: boolean;
  stockLevel?: number;
}

export interface StockAvailabilityPort {
  checkAvailability(request: StockAvailabilityRequest): Promise<StockAvailabilityResult>;
}
