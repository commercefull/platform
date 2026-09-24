/**
 * Product Discount Repository Port
 *
 * Domain interface for product discount data access.
 */

/**
 * Record type matching the `promotionProductDiscount` database schema.
 */
export interface PromotionProductDiscount {
  promotionProductDiscountId: string;
  promotionId: string | null;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: string;
  currencyCode: string | null;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  priority: number;
  appliesTo: string;
  minimumQuantity: number | null;
  maximumQuantity: number | null;
  minimumAmountCents: number | null;
  maximumDiscountAmountCents: number | null;
  stackable: boolean;
  displayOnProductPage: boolean;
  displayInListing: boolean;
  badgeText: string | null;
  badgeStyle: unknown | null;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDiscountRepository {
  findDiscountsForProduct(productId: string, organizationId?: string): Promise<PromotionProductDiscount[]>;
  calculateDiscount(discount: PromotionProductDiscount, price: number, quantity?: number): number;
}
