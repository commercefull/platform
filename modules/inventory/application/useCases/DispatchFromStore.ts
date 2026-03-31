import { eventBus } from '../../../../libs/events/eventBus';
import { StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';

export class DispatchFromStoreUseCase {
  constructor(
    private readonly dispatchRepository: StoreDispatchRepository,
    private readonly inventoryRepository: any,
  ) {}

  async execute(
    dispatchId: string,
    dispatchedBy: string,
    dispatchedItems?: Array<{ dispatchItemId: string; dispatchedQuantity: number }>,
  ): Promise<Record<string, any>> {
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    if (!dispatch) {
      throw new Error('Dispatch not found');
    }

    const sourceLocation = await this.inventoryRepository.getLocationByStoreId(dispatch.fromStoreId);
    if (!sourceLocation) {
      throw new Error('Source store inventory location not found');
    }

    dispatch.markDispatched(dispatchedBy, dispatchedItems);

    for (const item of dispatch.items) {
      if (item.dispatchedQuantity <= 0) {
        continue;
      }

      const inventory = await this.inventoryRepository.findByProductAndLocation(item.productId, sourceLocation.locationId, item.variantId);
      if (!inventory) {
        throw new Error(`Inventory not found for product ${item.productId}`);
      }

      inventory.fulfillReservation(item.dispatchedQuantity, dispatchedBy);
      await this.inventoryRepository.save(inventory);
      await this.inventoryRepository.recordMovement({
        inventoryId: inventory.inventoryId,
        productId: inventory.productId,
        variantId: inventory.variantId,
        locationId: inventory.locationId,
        type: 'outbound',
        quantity: item.dispatchedQuantity,
        previousQuantity: inventory.quantity + item.dispatchedQuantity,
        newQuantity: inventory.quantity,
        reason: 'Store dispatch shipped',
        referenceId: dispatch.dispatchId,
        referenceType: 'store_dispatch',
        performedBy: dispatchedBy,
        notes: dispatch.dispatchNumber,
      });
    }

    const savedDispatch = await this.dispatchRepository.save(dispatch);

    eventBus.emit('inventory.dispatch.shipped', {
      dispatchId: savedDispatch.dispatchId,
      dispatchedBy,
    });

    return savedDispatch.toJSON();
  }
}
