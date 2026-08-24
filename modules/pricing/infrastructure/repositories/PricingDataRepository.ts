/**
 * Consolidated Pricing Data Repository
 *
 * Merges pricingPriceListRepo, customerPriceRepo, productTierPriceRepo,
 * and productCurrencyPriceRepo into a single aggregate-aligned repository.
 *
 * Aggregate: Pricing Data (price lists, customer prices, tier prices, product currency prices)
 */

import priceListRepo from './pricingPriceListRepo';
import customerPriceRepo from './customerPriceRepo';
import productTierPriceRepo from './productTierPriceRepo';
import { ProductCurrencyPriceRepo } from './productCurrencyPriceRepo';

// Re-export types for backward compatibility
export type { PriceList, PriceListCreateParams, PriceListUpdateParams } from './pricingPriceListRepo';
export type { CustomerPriceList, CustomerPrice, TierPrice } from '../../domain/pricingRule';

const productCurrencyPriceRepoInstance = new ProductCurrencyPriceRepo();

class PricingDataRepository {
  // Price Lists
  readonly priceLists = priceListRepo;
  // Customer Prices
  readonly customerPrices = customerPriceRepo;
  // Tier Prices
  readonly tierPrices = productTierPriceRepo;
  // Product Currency Prices
  readonly productCurrencyPrices = productCurrencyPriceRepoInstance;

  // Delegate commonly used methods directly
  async findPriceListById(id: string) {
    return priceListRepo.findById(id);
  }
  async findAllPriceLists(activeOnly?: boolean) {
    return priceListRepo.findAll(activeOnly);
  }
}

export default new PricingDataRepository();
