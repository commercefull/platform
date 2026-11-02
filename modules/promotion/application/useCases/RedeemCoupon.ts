/**
 * Redeem Coupon Use Case
 * Records coupon usage after successful order
 */

import type { PromotionCouponUsage, CouponRepository } from '../../domain/repositories/CouponRepository';
import { ValidateCouponUseCase, ValidateCouponCommand } from './ValidateCoupon';
export interface RedeemCouponCommandProps {
  code: string;
  orderId: string;
  orderTotalCents: number;
  discountAmountCents: number;
  customerId?: string;
  organizationId?: string;
}

// ============================================================================
// Command
// ============================================================================

export class RedeemCouponCommand {
  public readonly code: string;
  public readonly orderId: string;
  public readonly orderTotalCents: number;
  public readonly discountAmountCents: number;
  public readonly customerId?: string;
  public readonly organizationId?: string;

  constructor(props: RedeemCouponCommandProps) {
    this.code = props.code;
    this.orderId = props.orderId;
    this.orderTotalCents = props.orderTotalCents;
    this.discountAmountCents = props.discountAmountCents;
    this.customerId = props.customerId;
    this.organizationId = props.organizationId;
  }
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
  private readonly validateCouponUseCase: ValidateCouponUseCase;

  constructor(private readonly couponRepo: CouponRepository) {
    this.validateCouponUseCase = new ValidateCouponUseCase(couponRepo);
  }

  async execute(command: RedeemCouponCommand): Promise<RedeemCouponResponse> {
    // Validate input
    if (!command.orderId?.trim()) {
      return { success: false, message: 'Order ID is required', errors: ['order_id_required'] };
    }

    if (command.discountAmountCents < 0) {
      return { success: false, message: 'Discount amount must be positive', errors: ['invalid_discount'] };
    }

    // First validate the coupon
    const validationResult = await this.validateCouponUseCase.execute(
      new ValidateCouponCommand(command.code, command.orderTotalCents, command.customerId, command.organizationId),
    );

    if (!validationResult.valid || !validationResult.coupon) {
      return {
        success: false,
        message: validationResult.message,
        errors: validationResult.errors,
      };
    }

    try {
      // Record the usage
      const usage = await this.couponRepo.recordUsage(
        validationResult.coupon.promotionCouponId,
        command.orderId,
        command.customerId,
        command.discountAmountCents,
      );

      return {
        success: true,
        usage,
        message: 'Coupon redeemed successfully',
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: (error as Error).message || 'Failed to redeem coupon',
        errors: ['redemption_failed'],
      };
    }
  }
}
