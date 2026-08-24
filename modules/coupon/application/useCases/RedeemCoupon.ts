/**
 * RedeemCoupon Use Case
 *
 * Finalizes coupon redemption when order is placed.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { Coupon } from '../../domain/entities/Coupon';
import { CouponNotFoundError } from '../../domain/errors/CouponErrors';

export interface RedeemCouponRepositoryPort {
  findByCode(code: string): Promise<Coupon | null>;
  createRedemption(redemption: {
    redemptionId: string;
    couponId: string;
    orderId: string;
    customerId?: string;
    discountAmount: number;
    redeemedAt: Date;
  }): Promise<unknown>;
  incrementUsageCount(couponId: string): Promise<unknown>;
}

export interface RedeemCouponInput {
  couponCode: string;
  orderId: string;
  customerId?: string;
  discountAmount: number;
}

export interface RedeemCouponOutput {
  redeemed: boolean;
  redemptionId: string;
  couponId: string;
  redeemedAt: string;
}

export class RedeemCouponUseCase {
  constructor(private readonly couponRepository: RedeemCouponRepositoryPort) {}

  async execute(input: RedeemCouponInput): Promise<RedeemCouponOutput> {
    const coupon = await this.couponRepository.findByCode(input.couponCode);
    if (!coupon) {
      throw new CouponNotFoundError(input.couponCode);
    }

    const redemptionId = `rmp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    // Create redemption record
    await this.couponRepository.createRedemption({
      redemptionId,
      couponId: coupon.couponId,
      orderId: input.orderId,
      customerId: input.customerId,
      discountAmount: input.discountAmount,
      redeemedAt: now,
    });

    // Increment usage count
    await this.couponRepository.incrementUsageCount(coupon.couponId);

    eventBus.emit('promotion.coupon_redeemed', {
      couponId: coupon.couponId,
      couponCode: input.couponCode,
      orderId: input.orderId,
      customerId: input.customerId,
      discountAmount: input.discountAmount,
    });

    return {
      redeemed: true,
      redemptionId,
      couponId: coupon.couponId,
      redeemedAt: now.toISOString(),
    };
  }
}
