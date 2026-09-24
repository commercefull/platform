/**
 * Coupon Repository Port
 *
 * Domain interface for coupon data access.
 */

import { Coupon, CouponUsage } from '../entities/Coupon';
import { PaginatedResult, PaginationOptions } from 'libs/types/shared';

export interface CouponFilters {
  code?: string;
  isActive?: boolean;
  type?: string;
  usageType?: string;
  status?: string;
  expiresAfter?: Date;
  expiresBefore?: Date;
}

export interface CouponRepository {
  findById(couponId: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  findAll(filters?: CouponFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Coupon>>;
  save(coupon: Coupon): Promise<Coupon>;
  delete(couponId: string): Promise<void>;
  recordUsage(
    usage: CouponUsage | { couponId: string; basketId?: string; customerId?: string; discountAmountCents: number },
  ): Promise<CouponUsage>;
  createRedemption(redemption: {
    redemptionId: string;
    couponId: string;
    orderId: string;
    customerId?: string;
    /** Discount amount in integer cents. */
    discountAmountCents: number;
    redeemedAt: Date;
  }): Promise<void>;
  incrementUsageCount(couponId: string): Promise<void>;
  getUsageHistory(couponId: string, limit?: number): Promise<CouponUsage[]>;
  getCustomerUsageCount(couponId: string, customerId: string): Promise<number>;
  getActiveCoupons(limit?: number): Promise<Coupon[]>;
  validateCouponCode(
    code: string,
    orderValueCents: number,
    customerId?: string,
  ): Promise<{ valid: boolean; coupon?: Coupon; discountAmountCents?: number; error?: string }>;
}
