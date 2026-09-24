/**
 * ProductPricePort
 *
 * ACL port owned by basket. Resolves the sellable unit price for a
 * product/variant in basket's vocabulary — integer cents plus currency.
 * The pricing module provides the implementation; basket never accepts
 * a client-supplied price.
 */
export interface ResolvedProductPrice {
  /** Sellable unit price in integer cents. */
  unitPriceCents: number;
  currency: string;
}

export interface ProductPricePort {
  /**
   * Resolve the sellable unit price for a product/variant, or null when
   * the product has no catalog price.
   */
  getPrice(
    productId: string,
    productVariantId?: string,
    currencyCode?: string,
    quantity?: number,
  ): Promise<ResolvedProductPrice | null>;
}
