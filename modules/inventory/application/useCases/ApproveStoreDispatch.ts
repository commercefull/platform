import { eventBus } from '../../../../libs/events/eventBus';
import { StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';

export class ApproveStoreDispatchUseCase {
  constructor(
    private readonly dispatchRepository: StoreDispatchRepository,
    private readonly inventoryRepository: any,
  ) {}

  async execute(dispatchId: string, approvedBy: string): Promise<Record<string, any>> {
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
