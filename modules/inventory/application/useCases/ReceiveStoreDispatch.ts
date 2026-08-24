import { eventBus } from '../../../../libs/events/eventBus';
import { withTransaction } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { Inventory, InventoryLocation, InventoryMovement } from '../../domain/entities/Inventory';
import { StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';
import { StoreDispatchNotFoundError, InventoryLocationNotFoundError } from '../../domain/errors/InventoryErrors';

export interface ReceiveStoreDispatchInput {
  dispatchId: string;
  receivedBy: string;
  items: Array<{
    dispatchItemId: string;
    receivedQuantity: number;
  }>;
  notes?: string;
}

interface ReceiveDispatchInventoryPort {
  getLocationByStoreId(storeId: string): Promise<InventoryLocation | null>;
  findByProductAndLocation(productId: string, locationId: string, variantId?: string): Promise<Inventory | null>;
  save(inventory: Inventory): Promise<Inventory>;
  recordMovement(movement: Omit<InventoryMovement, 'movementId' | 'createdAt'>): Promise<InventoryMovement>;
}

export class ReceiveStoreDispatchUseCase {
  constructor(
    private readonly dispatchRepository: StoreDispatchRepository,
    private readonly inventoryRepository: ReceiveDispatchInventoryPort,
  ) {}

  async execute(input: ReceiveStoreDispatchInput): Promise<Record<string, unknown>> {
    const dispatch = await this.dispatchRepository.findById(input.dispatchId);
    if (!dispatch) {
      throw new StoreDispatchNotFoundError(input.dispatchId);
    }

    const destinationLocation = await this.inventoryRepository.getLocationByStoreId(dispatch.toStoreId);
    if (!destinationLocation) {
      throw new InventoryLocationNotFoundError(dispatch.toStoreId);
    }

    dispatch.markReceived(input.receivedBy, input.items, input.notes);

    await withTransaction(async () => {
      for (const item of dispatch.items) {
        if (item.receivedQuantity <= 0) {
          continue;
        }

        let inventory = await this.inventoryRepository.findByProductAndLocation(
          item.productId,
          destinationLocation.locationId,
          item.variantId,
        );
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

      await this.dispatchRepository.save(dispatch);
    });

    eventBus.emit('inventory.dispatch.received', {
      dispatchId: dispatch.dispatchId,
      receivedBy: input.receivedBy,
    });

    return dispatch.toJSON();
  }
}
