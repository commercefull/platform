/**
 * Redeem Coupon Use Case
 * Records coupon usage after successful order
 */

import couponRepo, { PromotionCouponUsage } from '../../repos/couponRepo';
import { ValidateCouponUseCase, ValidateCouponCommand } from './ValidateCoupon';

// ============================================================================
// Command
// ============================================================================

export class RedeemCouponCommand {
  constructor(
    public readonly code: string,
    public readonly orderId: string,
    public readonly orderTotal: number,
    public readonly discountAmount: number,
    public readonly customerId?: string,
    public readonly merchantId?: string
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface RedeemCouponResponse {
  success: boolean;
  usage?: PromotionCouponUsage;
  message?: string;
  errors?: string[];
}

// ============================================================================
// Use Case
// ============================================================================

export class RedeemCouponUseCase {
  private validateCouponUseCase = new ValidateCouponUseCase();

  async execute(command: RedeemCouponCommand): Promise<RedeemCouponResponse> {
    // Validate input
    if (!command.orderId?.trim()) {
      return { success: false, message: 'Order ID is required', errors: ['order_id_required'] };
    }

    if (command.discountAmount < 0) {
      return { success: false, message: 'Discount amount must be positive', errors: ['invalid_discount'] };
    }

    // First validate the coupon
    const validationResult = await this.validateCouponUseCase.execute(
      new ValidateCouponCommand(
        command.code,
        command.orderTotal,
        command.customerId,
        command.merchantId
      )
    );

    if (!validationResult.valid || !validationResult.coupon) {
      return {
        success: false,
        message: validationResult.message,
        errors: validationResult.errors
      };
    }

    try {
      // Record the usage
      const usage = await couponRepo.recordUsage(
        validationResult.coupon.promotionCouponId,
        command.orderId,
        command.customerId
      );

      return {
        success: true,
        usage,
        message: 'Coupon redeemed successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to redeem coupon',
        errors: ['redemption_failed']
      };
    }
  }
}

export const redeemCouponUseCase = new RedeemCouponUseCase();
