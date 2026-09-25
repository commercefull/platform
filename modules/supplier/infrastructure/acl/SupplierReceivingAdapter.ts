/**
 * SupplierReceivingAdapter
 *
 * ACL adapter implementing ReceiveGoodsUseCase's ReceivingRepoPort.
 * Persists a receiving record plus per-line receiving items in the
 * supplierReceivingRecord / supplierReceivingItem tables.
 */

import type { SupplierPurchaseOrderRepo, SupplierPurchaseOrderItem } from '../repositories/purchaseOrderRepo';
import type { SupplierReceivingRecordRepo } from '../repositories/receivingRecordRepo';
import type { SupplierReceivingItemRepo } from '../repositories/receivingItemRepo';

interface ReceiveGoodsItem {
  productId: string;
  variantId?: string;
  quantityReceived: number;
  quantityDamaged?: number;
  notes?: string;
}

interface ReceivingCreateData {
  receivingId: string;
  purchaseOrderId: string;
  items: ReceiveGoodsItem[];
  warehouseId: string;
  receivedBy: string;
  receivedAt: Date;
  notes?: string;
}

export class SupplierReceivingAdapter {
  constructor(
    private readonly deps: {
      purchaseOrders: Pick<SupplierPurchaseOrderRepo, 'findById' | 'findItemsByOrderId'>;
      receivingRecords: Pick<SupplierReceivingRecordRepo, 'create'>;
      receivingItems: Pick<SupplierReceivingItemRepo, 'create'>;
    },
  ) {}

  async create(raw: Record<string, unknown>): Promise<void> {
    const data = raw as unknown as ReceivingCreateData;
    const { purchaseOrders, receivingRecords, receivingItems } = this.deps;

    const po = await purchaseOrders.findById(data.purchaseOrderId);
    const poItems: SupplierPurchaseOrderItem[] = po ? await purchaseOrders.findItemsByOrderId(data.purchaseOrderId) : [];

    const hasDamage = data.items.some(i => (i.quantityDamaged ?? 0) > 0);
    const record = await receivingRecords.create({
      supplierPurchaseOrderId: data.purchaseOrderId,
      distributionWarehouseId: po?.distributionWarehouseId ?? data.warehouseId,
      supplierId: po?.supplierId ?? 'unknown',
      status: 'completed',
      receivedDate: data.receivedAt.toISOString(),
      notes: data.notes,
      discrepancies: hasDamage,
      completedAt: data.receivedAt.toISOString(),
    });

    for (const item of data.items) {
      const poItem = poItems.find(
        p => p.productId === item.productId && (item.variantId === undefined || p.productVariantId === item.variantId),
      );
      const damaged = item.quantityDamaged ?? 0;
      await receivingItems.create({
        supplierReceivingRecordId: record.supplierReceivingRecordId,
        supplierPurchaseOrderItemId: poItem?.supplierPurchaseOrderItemId,
        productId: item.productId,
        productVariantId: item.variantId,
        sku: poItem?.sku ?? '',
        name: poItem?.name ?? item.productId,
        expectedQuantity: poItem?.quantity,
        receivedQuantity: item.quantityReceived - damaged,
        rejectedQuantity: damaged,
        status: damaged > 0 && damaged < item.quantityReceived ? 'partial' : damaged >= item.quantityReceived ? 'rejected' : 'received',
        inspectionNotes: item.notes,
        processedBy: data.receivedBy,
        processedAt: data.receivedAt.toISOString(),
      });
    }
  }
}
