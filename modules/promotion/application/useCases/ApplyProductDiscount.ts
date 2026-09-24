 
/**
 * Apply Product Discount Use Case
 * Calculates applicable discounts for products
 */

import type { ProductDiscountRepository } from '../../domain/repositories/ProductDiscountRepository';

// ============================================================================
// Command
// ============================================================================

export interface ProductItem {
  productId: string;
  variantId?: string;
  categoryId?: string;
  priceCents: number;
  quantity: number;
}

export class ApplyProductDiscountCommand {
  constructor(
    public readonly items: ProductItem[],
    public readonly organizationId?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface DiscountedItem {
  productId: string;
  variantId?: string;
  originalPriceCents: number;
  quantity: number;
  discounts: {
    discountId: string;
    discountName: string;
    discountType: string;
    discountValue: number;
    discountAmountCents: number;
  }[];
  totalDiscountCents: number;
  finalPriceCents: number;
}

export interface ApplyProductDiscountResponse {
  success: boolean;
  items: DiscountedItem[];
  totalOriginalCents: number;
  totalDiscountCents: number;
  totalFinalCents: number;
  appliedDiscounts: string[];
  message?: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ApplyProductDiscountUseCase {
  constructor(private readonly discountRepo: ProductDiscountRepository) {}

  async execute(command: ApplyProductDiscountCommand): Promise<ApplyProductDiscountResponse> {
    if (!command.items || command.items.length === 0) {
      return {
        success: true,
        items: [],
        totalOriginalCents: 0,
        totalDiscountCents: 0,
        totalFinalCents: 0,
        appliedDiscounts: [],
        message: 'No items to process',
      };
    }

    const discountedItems: DiscountedItem[] = [];
    const appliedDiscountIds = new Set<string>();
    let totalOriginalCents = 0;
    let totalDiscountCents = 0;

    for (const item of command.items) {
      const itemTotalCents = item.priceCents * item.quantity;
      totalOriginalCents += itemTotalCents;

      // Find applicable discounts for this product
      const discounts = await this.discountRepo.findDiscountsForProduct(item.productId, command.organizationId);

      const itemDiscounts: DiscountedItem['discounts'] = [];
      let itemTotalDiscountCents = 0;

      // Apply non-stackable discounts (highest priority first)
      const nonStackable = discounts.filter(d => !d.stackable);
      const stackable = discounts.filter(d => d.stackable);

      // Apply best non-stackable discount
      if (nonStackable.length > 0) {
        const bestDiscount = nonStackable[0]; // Already sorted by priority
        const discountAmountCents = this.discountRepo.calculateDiscount(bestDiscount, item.priceCents, item.quantity);

        if (discountAmountCents > 0) {
          itemDiscounts.push({
            discountId: bestDiscount.promotionProductDiscountId,
            discountName: bestDiscount.name,
            discountType: bestDiscount.discountType,
            discountValue: Number(bestDiscount.discountValue),
            discountAmountCents,
          });
          itemTotalDiscountCents += discountAmountCents;
          appliedDiscountIds.add(bestDiscount.promotionProductDiscountId);
        }
      }

      // Apply stackable discounts
      for (const discount of stackable) {
        const discountAmountCents = this.discountRepo.calculateDiscount(discount, item.priceCents, item.quantity);

        if (discountAmountCents > 0) {
          itemDiscounts.push({
            discountId: discount.promotionProductDiscountId,
            discountName: discount.name,
            discountType: discount.discountType,
            discountValue: Number(discount.discountValue),
            discountAmountCents,
          });
          itemTotalDiscountCents += discountAmountCents;
          appliedDiscountIds.add(discount.promotionProductDiscountId);
        }
      }

      // Ensure discount doesn't exceed item total
      itemTotalDiscountCents = Math.min(itemTotalDiscountCents, itemTotalCents);
      totalDiscountCents += itemTotalDiscountCents;

      discountedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        originalPriceCents: item.priceCents,
        quantity: item.quantity,
        discounts: itemDiscounts,
        totalDiscountCents: itemTotalDiscountCents,
        finalPriceCents: Math.round(item.priceCents - itemTotalDiscountCents / item.quantity),
      });
    }

    return {
      success: true,
      items: discountedItems,
      totalOriginalCents,
      totalDiscountCents,
      totalFinalCents: totalOriginalCents - totalDiscountCents,
      appliedDiscounts: Array.from(appliedDiscountIds),
      message: totalDiscountCents > 0 ? `Applied ${appliedDiscountIds.size} discount(s)` : 'No discounts applicable',
    };
  }
}
