import { eventBus } from '../../../../libs/events/eventBus';
import { StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';
import { InventoryLocation } from '../../domain/entities/Inventory';
import { Inventory } from '../../domain/entities/Inventory';

interface ApproveDispatchInventoryPort {
  getLocationByStoreId(storeId: string): Promise<InventoryLocation | null>;
  findByProductAndLocation(productId: string, locationId: string, variantId?: string): Promise<Inventory | null>;
}

export class ApproveStoreDispatchUseCase {
  constructor(
    private readonly dispatchRepository: StoreDispatchRepository,
    private readonly inventoryRepository: ApproveDispatchInventoryPort,
  ) {}

  async execute(dispatchId: string, approvedBy: string): Promise<Record<string, unknown>> {
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    if (!dispatch) {
      throw new Error('Dispatch not found');
    }

    const sourceLocation = await this.inventoryRepository.getLocationByStoreId(dispatch.fromStoreId);
    if (!sourceLocation) {
      throw new Error('Source store inventory location not found');
    }

    for (const item of dispatch.items) {
      const inventory = await this.inventoryRepository.findByProductAndLocation(item.productId, sourceLocation.locationId, item.variantId);
      if (!inventory || inventory.availableQuantity < item.requestedQuantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    dispatch.approve(approvedBy);
    const savedDispatch = await this.dispatchRepository.save(dispatch);

    eventBus.emit('inventory.dispatch.approved', {
      dispatchId: savedDispatch.dispatchId,
      approvedBy,
    });

    return savedDispatch.toJSON();
  }
}
