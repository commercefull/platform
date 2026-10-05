/**
 * BasketSnapshotPort
 *
 * ACL port owned by checkout. Provides an immutable snapshot of a basket
 * and its line items without exposing basket's domain entities.
 *
 * Checkout must not hold a live basket handle — it receives a snapshot
 * that cannot be mutated.
 */

import { Money } from '../../../../libs/money';

export interface CheckoutLineSnapshot {
  productId: string;
  productVariantId?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  discountAmountCents?: number;
  itemType: string;
  isDigital: boolean;
  inventoryPolicy?: 'tracked' | 'unlimited' | 'backorderable';
  imageUrl?: string;
  taxCategoryId?: string;
  taxable?: boolean;
}

export interface BasketSnapshot {
  basketId: string;
  storeId?: string;
  channelId?: string;
  currency: string;
  isEmpty: boolean;
  itemCount: number;
  uniqueItemCount: number;
  subtotal: Money;
  discountAmountCents: number;
  total: Money;
  couponCode?: string;
  items: CheckoutLineSnapshot[];
  /**
   * Products whose price could not be re-resolved during the authoritative
   * requote — checkout must reject the order when this is non-empty.
   */
  unpurchasableProductIds?: string[];
  /** True when the requote changed at least one line price. */
  repriced?: boolean;
  /** Per-line price changes applied by the authoritative requote. */
  priceChanges?: Array<{
    basketItemId: string;
    productId: string;
    productVariantId?: string;
    previousUnitPriceCents: number;
    unitPriceCents: number;
  }>;
}

export interface BasketSnapshotPort {
  getSnapshot(basketId: string): Promise<BasketSnapshot | null>;
}
