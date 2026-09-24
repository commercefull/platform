
// Seeded promotion test data IDs (from seeds/20240805001500_seedPromotionTestData.js)
export const SEEDED_PROMOTION_ID = '01935f00-0000-7000-8000-000000000001';
export const SEEDED_PROMOTION_CART_ID = '01935f00-0000-7000-8000-000000000002';
export const SEEDED_COUPON_ID = '01935f00-0000-7000-8000-000000000010';
export const SEEDED_COUPON_PERCENTAGE_ID = '01935f00-0000-7000-8000-000000000011';
export const SEEDED_COUPON_EXPIRED_ID = '01935f00-0000-7000-8000-000000000012';
export const SEEDED_PRODUCT_DISCOUNT_ID = '01935f00-0000-7000-8000-000000000020';
export const SEEDED_GIFT_CARD_ID = '01935f00-0000-7000-8000-000000000030';
export const SEEDED_GIFT_CARD_DEPLETED_ID = '01935f00-0000-7000-8000-000000000031';

// Common test data for promotions
export const testPromotion = {
  name: 'Test Promotion',
  description: 'Test promotion for integration tests',
  status: 'active',
  scope: 'global',
  priority: 1,
  startDate: new Date(new Date().getTime() - 86400000).toISOString(), // Yesterday
  endDate: new Date(new Date().getTime() + 86400000).toISOString(), // Tomorrow
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmountCents: 5000,
  maxDiscountAmountCents: 10000,
};

// Common test data for coupons (matching new schema)
export const testCoupon = {
  code: `TEST${Math.floor(Math.random() * 10000)}`,
  name: 'Test Coupon',
  description: 'Test coupon for integration tests',
  type: 'percentage',
  discountAmountCents: 15,
  currencyCode: 'USD',
  minOrderAmountCents: 2500,
  maxDiscountAmountCents: 5000,
  startDate: new Date(new Date().getTime() - 86400000).toISOString(),
  endDate: new Date(new Date().getTime() + 86400000).toISOString(),
  maxUsage: 100,
  maxUsagePerCustomer: 1,
  isActive: true,
  isOneTimeUse: false,
  generationMethod: 'manual',
  isReferral: false,
  isPublic: true,
};

// Seeded coupon codes for testing
export const SEEDED_COUPON_CODE_FIXED = 'TESTFIXED10';
export const SEEDED_COUPON_CODE_PERCENTAGE = 'TESTPERCENT15';
export const SEEDED_COUPON_CODE_EXPIRED = 'EXPIRED20';
export const SEEDED_GIFT_CARD_CODE = 'GIFT-TEST-0001';

// Seeded checkout basket with one item (seeds/20240805002001_seedIntegrationTestData.js)
export const SEEDED_CART_ID = '00000000-0000-0000-0000-000000002003';

// Seeded productCategory + product used by promotion tests (seeds/20240805000208, 20240805001059)
export const SEEDED_PRODUCT_CATEGORY_ID = 'c0000000-0000-0000-0000-000000000010';
export const SEEDED_PRODUCT_ID = '00000000-0000-0000-0000-000000000001';
