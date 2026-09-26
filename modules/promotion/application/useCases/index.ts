/**
 * Promotion Use Cases
 * Export all use cases for the promotion domain
 */

// Promotion Management
export * from './ListPromotions';
export * from './CreatePromotion';
export * from './UpdatePromotion';
export * from './DeletePromotion';

// Promotion
export * from './ApplyPromotion';
export * from './EvaluatePromotions';

// Coupon
export * from './ValidateCoupon';
export * from './RedeemCoupon';
export * from './CreateCoupon';
export * from './ValidateCouponCode';
export * from './CalculateCouponDiscount';
export * from './CreatePromotionRecord';
export * from './ChangePromotionStatus';

// Gift Card
export * from './CheckGiftCardBalance';
export * from './RedeemGiftCard';

// Product Discount
export * from './ApplyProductDiscount';
