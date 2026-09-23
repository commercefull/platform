/**
 * Product Discount Repository Port
 *
 * Domain interface for product discount data access.
 */

import type { PromotionProductDiscount } from '../../../../libs/db/types';

export interface ProductDiscountRepository {
  findDiscountsForProduct(productId: string, organizationId?: string): Promise<PromotionProductDiscount[]>;
  calculateDiscount(discount: PromotionProductDiscount, price: number, quantity?: number): number;
}
