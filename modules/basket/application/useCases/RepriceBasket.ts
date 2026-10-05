/**
 * RepriceBasket Use Case
 *
 * Re-resolves every basket item's unit price through the pricing module with
 * the basket's authoritative context (store, channel, currency, quantity) and
 * persists the updated prices. Used at checkout boundaries so orders are
 * always built from current prices rather than the snapshot taken when the
 * item was added.
 *
 * Items whose price can no longer be resolved are reported as unpurchasable
 * and left untouched — the caller decides whether to reject checkout.
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { BasketNotFoundError } from '../../domain/errors/BasketErrors';
import type { ProductPricePort } from '../ports/ProductPricePort';
import { Money } from '../../../../libs/money';

export interface RepriceChange {
  basketItemId: string;
  productId: string;
  productVariantId?: string;
  previousUnitPriceCents: number;
  unitPriceCents: number;
}

export interface RepriceBasketResult {
  basketId: string;
  repriced: boolean;
  changes: RepriceChange[];
  /** Products whose price could not be resolved — not purchasable. */
  unpurchasableProductIds: string[];
  subtotalCents: number;
  discountAmountCents: number;
  totalCents: number;
  currency: string;
}

export class RepriceBasketUseCase {
  constructor(
    private readonly basketRepository: BasketRepository,
    private readonly productPricePort: ProductPricePort,
  ) {}

  async execute(basketId: string): Promise<RepriceBasketResult> {
    const basket = await this.basketRepository.findById(basketId);
    if (!basket) {
      throw new BasketNotFoundError(basketId);
    }

    const changes: RepriceChange[] = [];
    const unpurchasableProductIds: string[] = [];

    for (const item of basket.items) {
      const price = await this.productPricePort.getPrice(item.productId, item.productVariantId, basket.currency, item.quantity, {
        storeId: basket.storeId,
        channelId: basket.channelId,
      });

      if (!price) {
        unpurchasableProductIds.push(item.productId);
        continue;
      }

      if (price.unitPriceCents === item.unitPrice.cents && price.currency === item.unitPrice.currency) {
        continue;
      }

      const previousUnitPriceCents = item.unitPrice.cents;
      item.updateUnitPrice(Money.fromCents(price.unitPriceCents, price.currency));
      await this.basketRepository.updateItem(item);
      changes.push({
        basketItemId: item.basketItemId,
        productId: item.productId,
        productVariantId: item.productVariantId,
        previousUnitPriceCents,
        unitPriceCents: price.unitPriceCents,
      });
    }

    // The basket-level coupon discount tracks the repriced subtotal.
    basket.refreshCouponDiscount();
    await this.basketRepository.save(basket);

    return {
      basketId: basket.basketId,
      repriced: changes.length > 0,
      changes,
      unpurchasableProductIds,
      subtotalCents: basket.subtotal.cents,
      discountAmountCents: basket.discountAmountCents,
      totalCents: basket.total.cents,
      currency: basket.currency,
    };
  }
}
