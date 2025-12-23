/**
 * Apply Product Discount Use Case
 * Calculates applicable discounts for products
 */

import discountRepo from '../../repos/discountRepo';

// ============================================================================
// Command
// ============================================================================

export interface ProductItem {
  productId: string;
  variantId?: string;
  categoryId?: string;
  price: number;
  quantity: number;
}

export class ApplyProductDiscountCommand {
  constructor(
    public readonly items: ProductItem[],
    public readonly merchantId?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface DiscountedItem {
  productId: string;
  variantId?: string;
  originalPrice: number;
  quantity: number;
  discounts: {
    discountId: string;
    discountName: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
  }[];
  totalDiscount: number;
  finalPrice: number;
}

export interface ApplyProductDiscountResponse {
  success: boolean;
  items: DiscountedItem[];
  totalOriginal: number;
  totalDiscount: number;
  totalFinal: number;
  appliedDiscounts: string[];
  message?: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ApplyProductDiscountUseCase {
  async execute(command: ApplyProductDiscountCommand): Promise<ApplyProductDiscountResponse> {
    if (!command.items || command.items.length === 0) {
      return {
        success: true,
        items: [],
        totalOriginal: 0,
        totalDiscount: 0,
        totalFinal: 0,
        appliedDiscounts: [],
        message: 'No items to process',
      };
    }

    const discountedItems: DiscountedItem[] = [];
    const appliedDiscountIds = new Set<string>();
    let totalOriginal = 0;
    let totalDiscount = 0;

    for (const item of command.items) {
      const itemTotal = item.price * item.quantity;
      totalOriginal += itemTotal;

      // Find applicable discounts for this product
      const discounts = await discountRepo.findDiscountsForProduct(item.productId, command.merchantId);

      const itemDiscounts: DiscountedItem['discounts'] = [];
      let itemTotalDiscount = 0;

      // Apply non-stackable discounts (highest priority first)
      const nonStackable = discounts.filter(d => !d.stackable);
      const stackable = discounts.filter(d => d.stackable);

      // Apply best non-stackable discount
      if (nonStackable.length > 0) {
        const bestDiscount = nonStackable[0]; // Already sorted by priority
        const discountAmount = discountRepo.calculateDiscount(bestDiscount, item.price, item.quantity);

        if (discountAmount > 0) {
          itemDiscounts.push({
            discountId: bestDiscount.promotionProductDiscountId,
            discountName: bestDiscount.name,
            discountType: bestDiscount.discountType,
            discountValue: Number(bestDiscount.discountValue),
            discountAmount,
          });
          itemTotalDiscount += discountAmount;
          appliedDiscountIds.add(bestDiscount.promotionProductDiscountId);
        }
      }

      // Apply stackable discounts
      for (const discount of stackable) {
        const discountAmount = discountRepo.calculateDiscount(discount, item.price, item.quantity);

        if (discountAmount > 0) {
          itemDiscounts.push({
            discountId: discount.promotionProductDiscountId,
            discountName: discount.name,
            discountType: discount.discountType,
            discountValue: Number(discount.discountValue),
            discountAmount,
          });
          itemTotalDiscount += discountAmount;
          appliedDiscountIds.add(discount.promotionProductDiscountId);
        }
      }

      // Ensure discount doesn't exceed item total
      itemTotalDiscount = Math.min(itemTotalDiscount, itemTotal);
      totalDiscount += itemTotalDiscount;

      discountedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        originalPrice: item.price,
        quantity: item.quantity,
        discounts: itemDiscounts,
        totalDiscount: itemTotalDiscount,
        finalPrice: item.price - itemTotalDiscount / item.quantity,
      });
    }

    return {
      success: true,
      items: discountedItems,
      totalOriginal,
      totalDiscount,
      totalFinal: totalOriginal - totalDiscount,
      appliedDiscounts: Array.from(appliedDiscountIds),
      message: totalDiscount > 0 ? `Applied ${appliedDiscountIds.size} discount(s)` : 'No discounts applicable',
    };
  }
}

export const applyProductDiscountUseCase = new ApplyProductDiscountUseCase();
