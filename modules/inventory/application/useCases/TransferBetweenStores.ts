/**
 * TransferBetweenStores Use Case
 * 
 * Transfers inventory between store locations.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface TransferBetweenStoresInput {
  sourceStoreId: string;
  targetStoreId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  reason?: string;
  priority?: 'normal' | 'urgent' | 'low';
  requestedBy?: string;
}

export interface TransferBetweenStoresOutput {
  transferId: string;
  sourceStoreId: string;
  targetStoreId: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  itemCount: number;
  totalQuantity: number;
  estimatedArrival?: string;
  createdAt: string;
}

export class TransferBetweenStoresUseCase {
  constructor(private readonly inventoryRepository: any) {}

  async execute(input: TransferBetweenStoresInput): Promise<TransferBetweenStoresOutput> {
    if (input.sourceStoreId === input.targetStoreId) {
      throw new Error('Source and target stores must be different');
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('At least one item is required for transfer');
    }

    // Validate source store has sufficient inventory
    for (const item of input.items) {
      const available = await this.inventoryRepository.getAvailableQuantity(
        input.sourceStoreId,
        item.productId,
        item.variantId
      );

      if (available < item.quantity) {
        throw new Error(
          `Insufficient inventory for product ${item.productId}: available ${available}, requested ${item.quantity}`
        );
      }
    }

    const transferId = `xfer_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const totalQuantity = input.items.reduce((sum, item) => sum + item.quantity, 0);

    // Reserve inventory at source
    for (const item of input.items) {
      await this.inventoryRepository.reserveForTransfer(
        input.sourceStoreId,
        item.productId,
        item.variantId,
        item.quantity,
        transferId
      );
    }

    // Create transfer record
    const transfer = await this.inventoryRepository.createTransfer({
      transferId,
      sourceStoreId: input.sourceStoreId,
      targetStoreId: input.targetStoreId,
      items: input.items,
      status: 'pending',
      reason: input.reason,
      priority: input.priority || 'normal',
      requestedBy: input.requestedBy,
    });

    // Emit event
    eventBus.emit('inventory.reserved', {
      transferId,
      sourceStoreId: input.sourceStoreId,
      targetStoreId: input.targetStoreId,
      itemCount: input.items.length,
      totalQuantity,
    });

    return {
      transferId: transfer.transferId,
      sourceStoreId: transfer.sourceStoreId,
      targetStoreId: transfer.targetStoreId,
      status: transfer.status,
      itemCount: input.items.length,
      totalQuantity,
      estimatedArrival: this.calculateEstimatedArrival(input.priority),
      createdAt: transfer.createdAt.toISOString(),
    };
  }

  private calculateEstimatedArrival(priority?: string): string {
    const now = new Date();
    let daysToAdd = 3; // Default
    
    switch (priority) {
      case 'urgent':
        daysToAdd = 1;
        break;
      case 'low':
        daysToAdd = 7;
        break;
    }
    
    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString();
  }
}
