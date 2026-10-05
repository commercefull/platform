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
import type { RepriceBasketUseCase } from '../../../basket/application/useCases/RepriceBasket';

export class BasketBasketSnapshotAdapter implements BasketSnapshotPort {
  constructor(
    private readonly basketRepository: BasketRepository,
    private readonly repriceBasket?: Pick<RepriceBasketUseCase, 'execute'>,
  ) {}

  async getSnapshot(basketId: string): Promise<BasketSnapshot | null> {
    const existing = await this.basketRepository.findById(basketId);
    if (!existing) return null;

    // Authoritative requote: refresh item prices against the current pricing
    // rules before the snapshot is consumed by order/payment creation.
    let reprice: Awaited<ReturnType<RepriceBasketUseCase['execute']>> | undefined;
    if (this.repriceBasket) {
      reprice = await this.repriceBasket.execute(basketId);
    }

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
      discountAmountCents: item.discountAmountCents,
      itemType: item.itemType,
      isDigital: item.isDigital,
      inventoryPolicy: (item.attributes?.inventoryPolicy as 'tracked' | 'unlimited' | 'backorderable' | undefined) ?? 'tracked',
      imageUrl: item.imageUrl,
    }));

    return {
      basketId: basket.basketId,
      storeId: basket.storeId,
      channelId: basket.channelId,
      currency: basket.currency,
      isEmpty: basket.isEmpty,
      itemCount: basket.itemCount,
      uniqueItemCount: basket.uniqueItemCount,
      subtotal: basket.subtotal,
      discountAmountCents: basket.discountAmountCents,
      total: basket.total,
      couponCode: basket.coupon?.couponCode,
      items: lineSnapshots,
      unpurchasableProductIds: reprice?.unpurchasableProductIds ?? [],
      repriced: reprice?.repriced ?? false,
      priceChanges: reprice?.changes,
    };
  }
}
