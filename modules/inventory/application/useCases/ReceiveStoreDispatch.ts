import { eventBus } from '../../../../libs/events/eventBus';
import { generateUUID } from '../../../../libs/uuid';
import { Inventory } from '../../domain/entities/Inventory';
import { StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';

export interface ReceiveStoreDispatchInput {
  dispatchId: string;
  receivedBy: string;
  items: Array<{
    dispatchItemId: string;
    receivedQuantity: number;
  }>;
  notes?: string;
}

export class ReceiveStoreDispatchUseCase {
  constructor(
    private readonly dispatchRepository: StoreDispatchRepository,
    private readonly inventoryRepository: any,
  ) {}

  async execute(input: ReceiveStoreDispatchInput): Promise<Record<string, any>> {
    const dispatch = await this.dispatchRepository.findById(input.dispatchId);
    if (!dispatch) {
      throw new Error('Dispatch not found');
    }

    const destinationLocation = await this.inventoryRepository.getLocationByStoreId(dispatch.toStoreId);
    if (!destinationLocation) {
      throw new Error('Destination store inventory location not found');
    }

    dispatch.markReceived(input.receivedBy, input.items, input.notes);

    for (const item of dispatch.items) {
      if (item.receivedQuantity <= 0) {
        continue;
      }

      let inventory = await this.inventoryRepository.findByProductAndLocation(item.productId, destinationLocation.locationId, item.variantId);
      const previousQuantity = inventory?.quantity || 0;

      if (!inventory) {
        inventory = Inventory.create({
          inventoryId: generateUUID(),
          productId: item.productId,
          variantId: item.variantId,
          locationId: destinationLocation.locationId,
          sku: item.sku || item.productId,
          quantity: item.receivedQuantity,
        });
      } else {
        inventory.adjustQuantity(item.receivedQuantity, 'Store dispatch received', input.receivedBy);
      }

      await this.inventoryRepository.save(inventory);
      await this.inventoryRepository.recordMovement({
        inventoryId: inventory.inventoryId,
        productId: inventory.productId,
        variantId: inventory.variantId,
        locationId: inventory.locationId,
        type: 'inbound',
        quantity: item.receivedQuantity,
        previousQuantity,
        newQuantity: inventory.quantity,
        reason: 'Store dispatch received',
        referenceId: dispatch.dispatchId,
        referenceType: 'store_dispatch',
        performedBy: input.receivedBy,
        notes: dispatch.dispatchNumber,
      });
    }

    const savedDispatch = await this.dispatchRepository.save(dispatch);

    eventBus.emit('inventory.dispatch.received', {
      dispatchId: savedDispatch.dispatchId,
      receivedBy: input.receivedBy,
    });

    return savedDispatch.toJSON();
  }
}
