/**
 * TaxableBasketPort
 *
 * ACL port owned by tax. Provides read-only access to basket data
 * needed for tax calculation — items and subtotal.
 */

export interface TaxableBasketItem {
  productId: string;
  quantity: number;
  priceCents: number;
}

export interface TaxableBasket {
  basketId: string;
  items: TaxableBasketItem[];
  subtotalCents: number;
}

export interface TaxableBasketPort {
  findById(basketId: string): Promise<TaxableBasket | null>;
}
