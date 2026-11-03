/**
 * InventoryStockAvailabilityAdapter
 *
 * ACL adapter implementing checkout's StockAvailabilityPort.
 * Translates inventory's inventoryRepo into checkout's
 * StockAvailabilityResult vocabulary.
 */

import { StockAvailabilityPort, StockAvailabilityRequest, StockAvailabilityResult } from '../../application/ports/StockAvailabilityPort';
import type { InventoryAvailabilityRepository } from '../../../inventory';

export class InventoryStockAvailabilityAdapter implements StockAvailabilityPort {
  constructor(private readonly inventoryRepo: Pick<InventoryAvailabilityRepository, 'checkProductAvailability'>) {}

  async checkAvailability(request: StockAvailabilityRequest): Promise<StockAvailabilityResult> {
    const result = await this.inventoryRepo.checkProductAvailability(request.productId, request.productVariantId, request.quantity);
    return {
      available: result.available,
      stockLevel: result.totalAvailable,
    };
  }
}
