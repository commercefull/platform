/**
 * InventoryStockAvailabilityAdapter
 *
 * ACL adapter implementing product's StockAvailabilityPort.
 * Translates inventory's inventoryRepo into product's
 * StockCheckResult vocabulary.
 *
 * Only this adapter may import from inventory's public API.
 */

import { StockAvailabilityPort, StockCheckRequest, StockCheckResult } from '../../application/ports/StockAvailabilityPort';
import InventoryRepo from '../../../inventory/infrastructure/repositories/inventoryRepo';

export class InventoryStockAvailabilityAdapter implements StockAvailabilityPort {
  async checkAvailability(request: StockCheckRequest): Promise<StockCheckResult> {
    const result = await InventoryRepo.checkProductAvailability(
      request.productId,
      request.productVariantId,
      request.quantity,
    );
    return {
      available: result.available,
      totalAvailable: result.totalAvailable,
      locationCount: result.locations.length,
    };
  }

  async getTotalStock(productId: string): Promise<number> {
    return InventoryRepo.getTotalStockForProduct(productId);
  }
}
