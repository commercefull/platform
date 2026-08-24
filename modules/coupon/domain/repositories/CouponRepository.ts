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
    usage: CouponUsage | { couponId: string; basketId?: string; customerId?: string; discountAmount: number },
  ): Promise<CouponUsage>;
  createRedemption(redemption: {
    redemptionId: string;
    couponId: string;
    orderId: string;
    customerId?: string;
    discountAmount: number;
    redeemedAt: Date;
  }): Promise<void>;
  incrementUsageCount(couponId: string): Promise<void>;
  getUsageHistory(couponId: string, limit?: number): Promise<CouponUsage[]>;
  getCustomerUsageCount(couponId: string, customerId: string): Promise<number>;
  getActiveCoupons(limit?: number): Promise<Coupon[]>;
  validateCouponCode(
    code: string,
    orderValue: number,
    customerId?: string,
  ): Promise<{ valid: boolean; coupon?: Coupon; discountAmount?: number; error?: string }>;
}
