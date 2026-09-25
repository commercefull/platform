/**
 * SupplierInventoryAdapter
 *
 * ACL adapter implementing ReceiveGoodsUseCase's InventoryRepoPort.
 * Translates goods receipt into inventoryLocation stock adjustments via the
 * inventory module's stock repository — creating the location row when the
 * product has no stock record at the receiving warehouse yet.
 */

import type { InventoryDataRepository } from '../../../inventory/infrastructure';

type StockRepo = Pick<
  typeof InventoryDataRepository.stock,
  'findLocationsByProductId' | 'createLocation' | 'adjustQuantity' | 'createTransaction' | 'findTransactionTypeByCode'
>;

export class SupplierInventoryAdapter {
  constructor(private readonly stock: StockRepo) {}

  async adjustStock(params: {
    productId: string;
    variantId?: string;
    locationId: string;
    adjustment: number;
    reason: string;
    reference: string;
  }): Promise<void> {
    const locations = await this.stock.findLocationsByProductId(params.productId);
    let location = locations.find(
      l => l.distributionWarehouseId === params.locationId && (l.productVariantId ?? undefined) === params.variantId,
    );

    if (!location) {
      location = await this.stock.createLocation({
        distributionWarehouseId: params.locationId,
        productId: params.productId,
        productVariantId: params.variantId,
        sku: params.productId,
        quantity: 0,
        status: 'available',
      });
    }

    const updated = await this.stock.adjustQuantity(location.inventoryLocationId, params.adjustment, params.reason);

    const transactionType =
      (await this.stock.findTransactionTypeByCode('RECEIVED')) ??
      (await this.stock.findTransactionTypeByCode('ADJUST_UP'));
    if (transactionType) {
      await this.stock.createTransaction({
        typeId: transactionType.inventoryTransactionTypeId,
        distributionWarehouseId: params.locationId,
        distributionWarehouseBinId: location.distributionWarehouseBinId ?? undefined,
        productId: params.productId,
        productVariantId: params.variantId,
        sku: location.sku,
        quantity: params.adjustment,
        previousQuantity: location.quantity,
        newQuantity: updated.quantity,
        referenceType: 'purchase_order',
        referenceId: params.reference,
        reason: params.reason,
      });
    }
  }
}
