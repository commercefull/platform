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
  discountAmount?: number;
  itemType: string;
  isDigital: boolean;
  imageUrl?: string;
}

export interface BasketSnapshot {
  basketId: string;
  currency: string;
  isEmpty: boolean;
  itemCount: number;
  uniqueItemCount: number;
  subtotal: Money;
  discountAmount: number;
  total: Money;
  couponCode?: string;
  items: CheckoutLineSnapshot[];
}

export interface BasketSnapshotPort {
  getSnapshot(basketId: string): Promise<BasketSnapshot | null>;
}
