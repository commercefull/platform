import type { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import type { CheckoutSession } from '../../domain/entities/CheckoutSession';
import type { StoreFulfillmentPort } from '../ports/StoreFulfillmentPort';
import type { BasketSnapshotPort } from '../ports/BasketSnapshotPort';
import type { StockAvailabilityPort } from '../ports/StockAvailabilityPort';
import { CheckoutSessionNotFoundError, PickupLocationNotFoundError } from '../../domain/errors/CheckoutErrors';

export interface PickupInventoryWarning {
  productId: string;
  available: number;
  requested: number;
}

export interface SetPickupLocationResult {
  session: CheckoutSession;
  inventoryWarnings: PickupInventoryWarning[];
}

/**
 * Set a pickup (BOPIS) location on a checkout session.
 * Validates the location, marks the session as pickup, and performs a
 * best-effort inventory availability check at the pickup location.
 */
export class SetPickupLocationUseCase {
  constructor(
    private readonly checkoutRepo: CheckoutRepository,
    private readonly storeFulfillment: StoreFulfillmentPort,
    private readonly basketSnapshot: BasketSnapshotPort,
    private readonly stockAvailability: StockAvailabilityPort,
  ) {}

  async execute(checkoutId: string, pickupLocationId: string): Promise<SetPickupLocationResult> {
    const location = await this.storeFulfillment.getPickupLocation(pickupLocationId);
    if (!location) {
      throw new PickupLocationNotFoundError(pickupLocationId);
    }

    const session = await this.checkoutRepo.findById(checkoutId);
    if (!session) {
      throw new CheckoutSessionNotFoundError(checkoutId);
    }

    session.setFulfillmentType('pickup');
    session.updateMetadata({
      pickupLocationId: location.locationId,
      pickupLocationName: location.storeName,
      pickupStoreId: location.storeId,
      pickupAddress: location.address,
    });

    // Validate inventory at pickup location for basket items (best-effort)
    const inventoryWarnings: PickupInventoryWarning[] = [];
    try {
      const basket = await this.basketSnapshot.getSnapshot(session.basketId);
      if (basket) {
        for (const item of basket.items) {
          const availability = await this.stockAvailability.checkAvailability({
            productId: item.productId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          });
          if (!availability.available) {
            inventoryWarnings.push({
              productId: item.productId,
              available: availability.stockLevel || 0,
              requested: item.quantity,
            });
          }
        }
      }
    } catch {
      // Inventory check is best-effort
    }

    if (inventoryWarnings.length > 0) {
      session.updateMetadata({ pickupInventoryWarnings: inventoryWarnings });
    }

    return { session: await this.checkoutRepo.save(session), inventoryWarnings };
  }
}
