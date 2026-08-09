/**
 * TransferStock Use Case
 *
 * Transfers inventory between locations (warehouses, stores).
 */


export interface TransferStockItemInput {
  productId: string;
  variantId?: string;
  sku?: string;
  quantity: number;
}

export interface TransferStockInput {
  sourceLocationId: string;
  destinationLocationId: string;
  items: TransferStockItemInput[];
  reason?: string;
  notes?: string;
  initiatedBy?: string;
}

export interface TransferResult {
  productId: string;
  variantId?: string;
  sku?: string;
  requestedQuantity: number;
  transferredQuantity: number;
  sourceRemainingQuantity: number;
  destinationNewQuantity: number;
  success: boolean;
  error?: string;
}

export interface TransferStockOutput {
  transferId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  results: TransferResult[];
  allTransferred: boolean;
  transferredAt: string;
}

interface InventoryRecord {
  inventoryId: string;
  productId: string;
  variantId?: string;
  locationId: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
}

interface TransferStockRepositoryPort {
  findLocationById(locationId: string): Promise<{ locationId: string; name: string } | null>;
  findByProduct(productId: string, variantId: string | undefined, locationId: string): Promise<InventoryRecord | null>;
  updateQuantity(inventoryId: string, newQuantity: number): Promise<InventoryRecord>;
  create(input: {
    inventoryItemId: string;
    productId: string;
    variantId?: string;
    warehouseId: string;
    sku: string;
    quantity: number;
    reservedQuantity?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    binLocation?: string;
    costPrice?: number;
    metadata?: Record<string, unknown>;
  }): Promise<InventoryRecord>;
  recordTransaction(input: {
    transferId: string;
    type: string;
    productId: string;
    variantId?: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    reason?: string;
    notes?: string;
    initiatedBy?: string;
  }): Promise<void>;
}

export class TransferStockUseCase {
  constructor(
    private readonly inventoryRepository: TransferStockRepositoryPort,
  ) {}

  async execute(input: TransferStockInput): Promise<TransferStockOutput> {
    const transferId = this.generateTransferId();
    const results: TransferResult[] = [];
    let allTransferred = true;

    // Validate locations exist
    const sourceLocation = await this.inventoryRepository.findLocationById(input.sourceLocationId);
    const destLocation = await this.inventoryRepository.findLocationById(input.destinationLocationId);

    if (!sourceLocation) {
      throw new Error(`Source location not found: ${input.sourceLocationId}`);
    }
    if (!destLocation) {
      throw new Error(`Destination location not found: ${input.destinationLocationId}`);
    }

    for (const item of input.items) {
      try {
        // Get source inventory
        const sourceInventory = await this.inventoryRepository.findByProduct(item.productId, item.variantId, input.sourceLocationId);

        if (!sourceInventory) {
          results.push({
            productId: item.productId,
            variantId: item.variantId,
            sku: item.sku,
            requestedQuantity: item.quantity,
            transferredQuantity: 0,
            sourceRemainingQuantity: 0,
            destinationNewQuantity: 0,
            success: false,
            error: 'Product not found at source location',
          });
          allTransferred = false;
          continue;
        }

        // Check available quantity (excluding reservations)
        const availableQuantity = sourceInventory.quantity - (sourceInventory.reservedQuantity || 0);
        const transferQuantity = Math.min(item.quantity, availableQuantity);

        if (transferQuantity <= 0) {
          results.push({
            productId: item.productId,
            variantId: item.variantId,
            sku: item.sku,
            requestedQuantity: item.quantity,
            transferredQuantity: 0,
            sourceRemainingQuantity: sourceInventory.quantity,
            destinationNewQuantity: 0,
            success: false,
            error: 'Insufficient available quantity',
          });
          allTransferred = false;
          continue;
        }

        // Decrease source quantity
        const newSourceQuantity = sourceInventory.quantity - transferQuantity;
        await this.inventoryRepository.updateQuantity(sourceInventory.inventoryId, newSourceQuantity);

        // Get or create destination inventory
        const destInventory = await this.inventoryRepository.findByProduct(item.productId, item.variantId, input.destinationLocationId);

        let newDestQuantity: number;
        if (destInventory) {
          newDestQuantity = destInventory.quantity + transferQuantity;
          await this.inventoryRepository.updateQuantity(destInventory.inventoryId, newDestQuantity);
        } else {
          // Create inventory item at destination
          newDestQuantity = transferQuantity;
          const newItemId = `inv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
          await this.inventoryRepository.create({
            inventoryItemId: newItemId,
            productId: item.productId,
            variantId: item.variantId,
            warehouseId: input.destinationLocationId,
            sku: item.sku || sourceInventory.sku,
            quantity: transferQuantity,
            reservedQuantity: 0,
          });
        }

        // Record transfer transaction
        await this.inventoryRepository.recordTransaction({
          transferId,
          type: 'transfer',
          productId: item.productId,
          variantId: item.variantId,
          fromLocationId: input.sourceLocationId,
          toLocationId: input.destinationLocationId,
          quantity: transferQuantity,
          reason: input.reason,
          notes: input.notes,
          initiatedBy: input.initiatedBy,
        });

        results.push({
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          requestedQuantity: item.quantity,
          transferredQuantity: transferQuantity,
          sourceRemainingQuantity: newSourceQuantity,
          destinationNewQuantity: newDestQuantity,
          success: transferQuantity >= item.quantity,
        });

        if (transferQuantity < item.quantity) {
          allTransferred = false;
        }
      } catch (error: unknown) {
        results.push({
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          requestedQuantity: item.quantity,
          transferredQuantity: 0,
          sourceRemainingQuantity: 0,
          destinationNewQuantity: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        allTransferred = false;
      }
    }

    return {
      transferId,
      sourceLocationId: input.sourceLocationId,
      destinationLocationId: input.destinationLocationId,
      results,
      allTransferred,
      transferredAt: new Date().toISOString(),
    };
  }

  private generateTransferId(): string {
    return `tfr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
