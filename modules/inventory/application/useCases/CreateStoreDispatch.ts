import { eventBus } from '../../../../libs/events/eventBus';
import { generateUUID } from '../../../../libs/uuid';
import { StoreDispatch } from '../../domain/entities/StoreDispatch';
import { StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';

export interface CreateStoreDispatchInput {
  fromStoreId: string;
  toStoreId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    sku?: string;
    productName?: string;
    notes?: string;
  }>;
  notes?: string;
  requestedBy: string;
}

export class CreateStoreDispatchUseCase {
  constructor(
    private readonly dispatchRepository: StoreDispatchRepository,
    private readonly inventoryRepository: any,
  ) {}

  async execute(input: CreateStoreDispatchInput): Promise<Record<string, any>> {
    if (input.fromStoreId === input.toStoreId) {
      throw new Error('Source and destination stores must be different');
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('At least one dispatch item is required');
    }

    const sourceLocation = await this.inventoryRepository.getLocationByStoreId(input.fromStoreId);
    const destinationLocation = await this.inventoryRepository.getLocationByStoreId(input.toStoreId);

    if (!sourceLocation) {
      throw new Error('Source store inventory location not found');
    }

    if (!destinationLocation) {
      throw new Error('Destination store inventory location not found');
    }

    for (const item of input.items) {
      const inventory = await this.inventoryRepository.findByProductAndLocation(item.productId, sourceLocation.locationId, item.variantId);
      if (!inventory || inventory.availableQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    const dispatch = StoreDispatch.create({
      dispatchId: generateUUID(),
      fromStoreId: input.fromStoreId,
      toStoreId: input.toStoreId,
      dispatchNumber: this.generateDispatchNumber(),
      items: input.items.map(item => ({
        dispatchItemId: generateUUID(),
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        requestedQuantity: item.quantity,
        notes: item.notes,
      })),
      requestedBy: input.requestedBy,
      notes: input.notes,
    });

    const savedDispatch = await this.dispatchRepository.save(dispatch);

    eventBus.emit('inventory.dispatch.created', {
      dispatchId: savedDispatch.dispatchId,
      dispatchNumber: savedDispatch.dispatchNumber,
      fromStoreId: savedDispatch.fromStoreId,
      toStoreId: savedDispatch.toStoreId,
      requestedBy: savedDispatch.requestedBy,
    });

    return savedDispatch.toJSON();
  }

  private generateDispatchNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DSP-${timestamp}-${random}`;
  }
}
