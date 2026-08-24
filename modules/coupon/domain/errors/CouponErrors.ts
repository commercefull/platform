import { AppError } from '../../../../libs/errors';

export class CouponNotFoundError extends AppError {
  constructor(couponId: string) {
    super(`Coupon not found: ${couponId}`, 404, { code: 'coupon.not_found' });
  }
}

export class CouponCodeNotFoundError extends AppError {
  constructor(code: string) {
    super(`Coupon code not found: ${code}`, 404, { code: 'coupon.code_not_found' });
  }
}

export class CouponNotActiveError extends AppError {
  constructor(couponId: string) {
    super(`Coupon ${couponId} is not active`, 400, { code: 'coupon.not_active' });
  }
}

export class CouponExpiredError extends AppError {
  constructor(couponId: string) {
    super(`Coupon ${couponId} has expired`, 400, { code: 'coupon.expired' });
  }
}

export class CouponUsageLimitReachedError extends AppError {
  constructor(couponId: string) {
    super(`Coupon ${couponId} usage limit has been reached`, 400, { code: 'coupon.usage_limit_reached' });
  }
}

export class CouponMinOrderNotMetError extends AppError {
  constructor(minAmount: number) {
    super(`Order total must be at least ${minAmount}`, 400, { code: 'coupon.min_order_not_met' });
  }
}

export class CouponMaxUsagePerCustomerReachedError extends AppError {
  constructor(usageCount: number) {
    super(`You have already used this coupon ${usageCount} times`, 400, { code: 'coupon.max_usage_per_customer_reached' });
  }
}

export class CouponCodeAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Coupon code already exists: ${code}`, 409, { code: 'coupon.code_already_exists' });
  }
}

export class CouponValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'coupon.validation_error' });
  }
}

export class FailedToRecordCouponUsageError extends AppError {
  constructor() {
    super('Failed to record coupon usage', 500, { code: 'coupon.usage_record_failed' });
  }
}
