/**
 * Pricing Data Query Port
 *
 * Read-side repository contract for catalog prices, tier prices, and
 * customer price lists used by the pricing calculation pipeline.
 * Implemented by `infrastructure/repositories/PricingDataRepository`
 * and injected at the composition root (`application/wired.ts`).
 *
 * All monetary amounts are integer cents.
 */

import { ProductBasePrice } from '../catalogPrice';
import { CustomerPrice, CustomerPriceList, TierPrice } from '../pricingRule';

export interface PricingDataQueryPort {
  /** Effective catalog price — variant-level row wins over product-level. */
  findEffectiveBasePrice(productId: string, variantId?: string, currencyCode?: string): Promise<ProductBasePrice | null>;

  /** Tier-price override for the requested quantity (integer cents). */
  findApplicableTier(
    productId: string,
    quantity: number,
    variantId?: string,
    customerGroupId?: string,
  ): Promise<TierPrice | null>;

  /** Price lists applicable to a customer and their groups, priority-ordered. */
  findPriceListsForCustomer(customerId: string, customerGroupIds?: string[]): Promise<CustomerPriceList[]>;

  /** Customer price entries for a product within the given price lists. */
  findPricesForProduct(productId: string, variantId: string | undefined, priceListIds: string[]): Promise<CustomerPrice[]>;

  /** Price for a product within an explicit price list (merchant quote tooling). Integer cents. */
  findPriceListItem(priceListId: string, productId: string, variantId?: string): Promise<{ priceCents: number } | null>;
}
