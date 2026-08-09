/**
 * ReceiveGoods Use Case
 *
 * Records receipt of goods from a purchase order.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ReceivedItem {
  productId: string;
  variantId?: string;
  quantityReceived: number;
  quantityDamaged?: number;
  notes?: string;
}

export interface ReceiveGoodsInput {
  purchaseOrderId: string;
  receivedItems: ReceivedItem[];
  receivedBy: string;
  warehouseId: string;
  notes?: string;
}

export interface ReceiveGoodsOutput {
  receivingId: string;
  purchaseOrderId: string;
  itemsReceived: number;
  itemsDamaged: number;
  status: string;
  receivedAt: string;
}

interface PurchaseOrderItem {
  quantity: number;
}

interface PurchaseOrderRecord {
  status: string;
  items: PurchaseOrderItem[];
}

interface PurchaseOrderRepoPort {
  findById(id: string): Promise<PurchaseOrderRecord | null>;
  update(id: string, data: Record<string, unknown>): Promise<void>;
}

interface ReceivingRepoPort {
  create(data: Record<string, unknown>): Promise<void>;
}

interface InventoryRepoPort {
  adjustStock(params: {
    productId: string;
    variantId?: string;
    locationId: string;
    adjustment: number;
    reason: string;
    reference: string;
  }): Promise<void>;
}

export class ReceiveGoodsUseCase {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepoPort,
    private readonly receivingRepository: ReceivingRepoPort,
    private readonly inventoryRepository: InventoryRepoPort,
  ) {}

  async execute(input: ReceiveGoodsInput): Promise<ReceiveGoodsOutput> {
    const po = await this.purchaseOrderRepository.findById(input.purchaseOrderId);
    if (!po) {
      throw new Error(`Purchase order not found: ${input.purchaseOrderId}`);
    }

    if (!['submitted', 'partial_received'].includes(po.status)) {
      throw new Error(`Cannot receive goods for PO with status: ${po.status}`);
    }

    const receivingId = `rcv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    let totalReceived = 0;
    let totalDamaged = 0;

    // Process each received item
    for (const item of input.receivedItems) {
      totalReceived += item.quantityReceived;
      totalDamaged += item.quantityDamaged || 0;

      // Update inventory
      const goodQuantity = item.quantityReceived - (item.quantityDamaged || 0);
      if (goodQuantity > 0) {
        await this.inventoryRepository.adjustStock({
          productId: item.productId,
          variantId: item.variantId,
          locationId: input.warehouseId,
          adjustment: goodQuantity,
          reason: 'purchase_order_receipt',
          reference: input.purchaseOrderId,
        });
      }
    }

    // Create receiving record
    await this.receivingRepository.create({
      receivingId,
      purchaseOrderId: input.purchaseOrderId,
      items: input.receivedItems,
      warehouseId: input.warehouseId,
      receivedBy: input.receivedBy,
      receivedAt: now,
      notes: input.notes,
    });

    // Update PO status
    const allReceived = this.checkAllReceived(po.items, input.receivedItems);
    await this.purchaseOrderRepository.update(input.purchaseOrderId, {
      status: allReceived ? 'received' : 'partial_received',
      lastReceivedAt: now,
    });

    eventBus.emit('receiving.completed', {
      receivingId,
      purchaseOrderId: input.purchaseOrderId,
      itemsReceived: totalReceived,
    });

    return {
      receivingId,
      purchaseOrderId: input.purchaseOrderId,
      itemsReceived: totalReceived,
      itemsDamaged: totalDamaged,
      status: allReceived ? 'complete' : 'partial',
      receivedAt: now.toISOString(),
    };
  }

  private checkAllReceived(poItems: PurchaseOrderItem[], receivedItems: ReceivedItem[]): boolean {
    // Simplified check - in reality would track cumulative receipts
    const orderedQty = poItems.reduce((sum: number, item: PurchaseOrderItem) => sum + item.quantity, 0);
    const receivedQty = receivedItems.reduce((sum, item) => sum + item.quantityReceived, 0);
    return receivedQty >= orderedQty;
  }
}
