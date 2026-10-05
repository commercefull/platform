/**
 * RedeemCoupon Use Case
 *
 * Finalizes coupon redemption when order is placed.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { generateUUID } from '../../../../libs/uuid';
import { Coupon } from '../../domain/entities/Coupon';
import { CouponNotFoundError } from '../../domain/errors/CouponErrors';

export interface RedeemCouponRepositoryPort {
  findByCode(code: string): Promise<Coupon | null>;
  createRedemption(redemption: {
    redemptionId: string;
    couponId: string;
    orderId: string;
    customerId?: string;
    discountAmountCents: number;
    currencyCode?: string;
    redeemedAt: Date;
    /** Resolves true when the row was inserted; false on a concurrent duplicate. */
  }): Promise<boolean | void>;
  /** Existing redemption for (coupon, order) — idempotent-retry guard. */
  findRedemptionByOrder?(couponId: string, orderId: string): Promise<{ redemptionId: string; redeemedAt: Date } | null>;
  incrementUsageCount(couponId: string): Promise<unknown>;
}

export interface RedeemCouponInput {
  couponCode: string;
  orderId: string;
  customerId?: string;
  discountAmountCents: number;
  currencyCode?: string;
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

    // Idempotent: a retried checkout completion must not double-count usage.
    const existing = await this.couponRepository.findRedemptionByOrder?.(coupon.couponId, input.orderId);
    if (existing) {
      return {
        redeemed: true,
        redemptionId: existing.redemptionId,
        couponId: coupon.couponId,
        redeemedAt: existing.redeemedAt.toISOString(),
      };
    }

    const redemptionId = generateUUID();
    const now = new Date();

    // Create redemption record; a concurrent retry may already hold the row.
    const inserted = await this.couponRepository.createRedemption({
      redemptionId,
      couponId: coupon.couponId,
      orderId: input.orderId,
      customerId: input.customerId,
      discountAmountCents: input.discountAmountCents,
      currencyCode: input.currencyCode,
      redeemedAt: now,
    });

    if (inserted === false) {
      const winner = await this.couponRepository.findRedemptionByOrder?.(coupon.couponId, input.orderId);
      if (winner) {
        return {
          redeemed: true,
          redemptionId: winner.redemptionId,
          couponId: coupon.couponId,
          redeemedAt: winner.redeemedAt.toISOString(),
        };
      }
    }

    // Increment usage count
    await this.couponRepository.incrementUsageCount(coupon.couponId);

    eventBus.emit('promotion.coupon_redeemed', {
      couponId: coupon.couponId,
      couponCode: input.couponCode,
      orderId: input.orderId,
      customerId: input.customerId,
      discountAmountCents: input.discountAmountCents,
    });

    return {
      redeemed: true,
      redemptionId,
      couponId: coupon.couponId,
      redeemedAt: now.toISOString(),
    };
  }
}
