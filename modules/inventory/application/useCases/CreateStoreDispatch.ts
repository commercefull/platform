import { eventBus } from '../../../../libs/events/eventBus';
import { generateUUID } from '../../../../libs/uuid';
import { StoreDispatch } from '../../domain/entities/StoreDispatch';
import { StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';
import { InventoryLocation, Inventory } from '../../domain/entities/Inventory';
import { InventoryLocationNotFoundError, InsufficientStockError, InventoryValidationError } from '../../domain/errors/InventoryErrors';

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

interface CreateDispatchInventoryPort {
  getLocationByStoreId(storeId: string): Promise<InventoryLocation | null>;
  findByProductAndLocation(productId: string, locationId: string, variantId?: string): Promise<Inventory | null>;
}

export class CreateStoreDispatchUseCase {
  constructor(
    private readonly dispatchRepository: StoreDispatchRepository,
    private readonly inventoryRepository: CreateDispatchInventoryPort,
  ) {}

  async execute(input: CreateStoreDispatchInput): Promise<Record<string, unknown>> {
    if (input.fromStoreId === input.toStoreId) {
      throw new InventoryValidationError('Source and destination stores must be different');
    }

    if (!input.items || input.items.length === 0) {
      throw new InventoryValidationError('At least one dispatch item is required');
    }

    const sourceLocation = await this.inventoryRepository.getLocationByStoreId(input.fromStoreId);
    const destinationLocation = await this.inventoryRepository.getLocationByStoreId(input.toStoreId);

    if (!sourceLocation) {
      throw new InventoryLocationNotFoundError(input.fromStoreId);
    }

    if (!destinationLocation) {
      throw new InventoryLocationNotFoundError(input.toStoreId);
    }

    for (const item of input.items) {
      const inventory = await this.inventoryRepository.findByProductAndLocation(item.productId, sourceLocation.locationId, item.variantId);
      if (!inventory || inventory.availableQuantity < item.quantity) {
        throw new InsufficientStockError(item.productId, item.quantity, inventory?.availableQuantity ?? 0);
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
