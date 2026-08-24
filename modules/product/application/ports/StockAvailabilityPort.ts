/**
 * StockAvailabilityPort
 *
 * ACL port owned by product. Checks inventory availability
 * for products displayed to customers.
 */

export interface StockCheckRequest {
  productId: string;
  productVariantId?: string;
  quantity: number;
}

export interface StockCheckResult {
  available: boolean;
  totalAvailable: number;
  locationCount: number;
}

export interface StockAvailabilityPort {
  checkAvailability(request: StockCheckRequest): Promise<StockCheckResult>;
  getTotalStock(productId: string): Promise<number>;
}
