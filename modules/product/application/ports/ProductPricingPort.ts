/**
 * ProductPricingPort — consumer-owned port for product catalog prices.
 *
 * The product module owns this contract; the pricing module provides the
 * implementation through an ACL adapter. All monetary amounts are integer
 * cents — the product module never stores or formats prices itself.
 */

export interface ProductPriceInfo {
  productBasePriceId: string;
  productId: string;
  productVariantId: string | null;
  currencyCode: string;
  priceCents: number;
  salePriceCents: number | null;
  compareAtPriceCents: number | null;
  costPriceCents: number | null;
  updatedAt: Date;
}

export interface SetProductBasePriceInput {
  productId: string;
  productVariantId?: string | null;
  currencyCode: string;
  priceCents: number;
  salePriceCents?: number | null;
  compareAtPriceCents?: number | null;
  costPriceCents?: number | null;
  taxRate?: number | null;
}

export interface ProductPricingPort {
  /** Effective base price for a product (variant row wins over product row). */
  getBasePrice(productId: string, productVariantId?: string | null, currencyCode?: string): Promise<ProductPriceInfo | null>;
  /** Product-level base prices for a set of products (list enrichment). */
  getBasePrices(productIds: string[], currencyCode?: string): Promise<ProductPriceInfo[]>;
  /** All base price rows for a product (product + variant level). */
  listProductPrices(productId: string): Promise<ProductPriceInfo[]>;
  /** Create or update the base price for a product/variant in a currency. */
  setBasePrice(input: SetProductBasePriceInput): Promise<ProductPriceInfo>;
  /** Remove all base prices for a product (used when the product is deleted). */
  deletePricesForProduct(productId: string): Promise<void>;
}
