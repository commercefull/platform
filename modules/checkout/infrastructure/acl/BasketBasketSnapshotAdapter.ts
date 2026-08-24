/**
 * BasketBasketSnapshotAdapter
 *
 * ACL adapter implementing checkout's BasketSnapshotPort.
 * Translates basket's domain entities into checkout's CheckoutLineSnapshot[].
 *
 * Only this adapter may import from basket's public API.
 */

import { BasketSnapshotPort, BasketSnapshot, CheckoutLineSnapshot } from '../../application/ports/BasketSnapshotPort';
import { BasketRepository } from '../../../basket/domain/repositories/BasketRepository';

export class BasketBasketSnapshotAdapter implements BasketSnapshotPort {
  constructor(private readonly basketRepository: BasketRepository) {}

  async getSnapshot(basketId: string): Promise<BasketSnapshot | null> {
    const basket = await this.basketRepository.findById(basketId);
    if (!basket) return null;

    const items = await this.basketRepository.getItems(basketId);

    const lineSnapshots: CheckoutLineSnapshot[] = items.map(item => ({
      productId: item.productId,
      productVariantId: item.productVariantId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      itemType: item.itemType,
      isDigital: item.isDigital,
      imageUrl: item.imageUrl,
    }));

    return {
      basketId: basket.basketId,
      currency: basket.currency,
      isEmpty: basket.isEmpty,
      itemCount: basket.itemCount,
      uniqueItemCount: basket.uniqueItemCount,
      subtotal: basket.subtotal,
      discountAmount: basket.discountAmount,
      total: basket.total,
      couponCode: basket.coupon?.couponCode,
      items: lineSnapshots,
    };
  }
}
