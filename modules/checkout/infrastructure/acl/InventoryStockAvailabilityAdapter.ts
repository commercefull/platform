/**
 * InventoryStockAvailabilityAdapter
 *
 * ACL adapter implementing checkout's StockAvailabilityPort.
 * Translates inventory's inventoryRepo into checkout's
 * StockAvailabilityResult vocabulary.
 */

import { StockAvailabilityPort, StockAvailabilityRequest, StockAvailabilityResult } from '../../application/ports/StockAvailabilityPort';
import InventoryRepo from '../../../inventory/infrastructure/repositories/inventoryRepo';

export class InventoryStockAvailabilityAdapter implements StockAvailabilityPort {
  async checkAvailability(request: StockAvailabilityRequest): Promise<StockAvailabilityResult> {
    const result = await InventoryRepo.checkProductAvailability(
      request.productId,
      request.productVariantId,
      request.quantity,
    );
    return {
      available: result.available,
      stockLevel: result.totalAvailable,
    };
  }
}
