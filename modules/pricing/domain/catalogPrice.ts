/**
 * Catalog price types — pricing-owned base prices for products and variants.
 *
 * All monetary amounts are integer minor units (cents). Convert to a
 * display string only at the view layer.
 */

export interface ProductBasePrice {
  productBasePriceId: string;
  productId: string;
  productVariantId?: string | null;
  currencyCode: string;
  priceCents: number;
  salePriceCents?: number | null;
  compareAtPriceCents?: number | null;
  costPriceCents?: number | null;
  taxRate?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductBasePriceCreateProps = Omit<ProductBasePrice, 'productBasePriceId' | 'createdAt' | 'updatedAt'>;
export type ProductBasePriceUpdateProps = Partial<
  Pick<ProductBasePrice, 'priceCents' | 'salePriceCents' | 'compareAtPriceCents' | 'costPriceCents' | 'taxRate'>
>;
