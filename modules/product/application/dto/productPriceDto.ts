/**
 * Maps a pricing-owned ProductPriceInfo onto the product module's price DTO
 * block. All amounts are integer cents; string formatting is a view concern.
 */

import type { ProductPriceInfo } from '../ports/ProductPricingPort';

export interface ProductPriceDto {
  basePriceCents: number;
  salePriceCents: number | null;
  costPriceCents: number | null;
  compareAtPriceCents: number | null;
  effectivePriceCents: number;
  isOnSale: boolean;
  discountPercentage: number;
  currency: string;
}

export function toProductPriceDto(info: ProductPriceInfo | null | undefined): ProductPriceDto | null {
  if (!info) return null;
  const effectivePriceCents = info.salePriceCents ?? info.priceCents;
  const isOnSale = info.salePriceCents != null && info.salePriceCents < info.priceCents;
  return {
    basePriceCents: info.priceCents,
    salePriceCents: info.salePriceCents,
    costPriceCents: info.costPriceCents,
    compareAtPriceCents: info.compareAtPriceCents,
    effectivePriceCents,
    isOnSale,
    discountPercentage: isOnSale && info.priceCents > 0 ? Math.round((1 - effectivePriceCents / info.priceCents) * 100) : 0,
    currency: info.currencyCode,
  };
}

/** Empty price block for products without a catalog price yet. */
const EMPTY_PRICE_DTO: ProductPriceDto = {
  basePriceCents: 0,
  salePriceCents: null,
  costPriceCents: null,
  compareAtPriceCents: null,
  effectivePriceCents: 0,
  isOnSale: false,
  discountPercentage: 0,
  currency: 'USD',
};

export function toProductPriceDtoOrEmpty(info: ProductPriceInfo | null | undefined): ProductPriceDto {
  return toProductPriceDto(info) ?? EMPTY_PRICE_DTO;
}
