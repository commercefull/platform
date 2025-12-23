/**
 * Pricing Repository Interface
 */

import { PriceRule } from '../entities/PriceRule';

export interface PricingRepository {
  findById(ruleId: string): Promise<PriceRule | null>;
  findByProduct(productId: string): Promise<PriceRule[]>;
  findByCategory(categoryId: string): Promise<PriceRule[]>;
  findByCustomerGroup(groupId: string): Promise<PriceRule[]>;
  findActive(): Promise<PriceRule[]>;
  save(rule: PriceRule): Promise<PriceRule>;
  delete(ruleId: string): Promise<void>;

  // Price calculation
  calculatePrice(
    productId: string,
    basePrice: number,
    quantity: number,
    customerId?: string,
  ): Promise<{
    finalPrice: number;
    appliedRules: string[];
    discount: number;
  }>;
}
