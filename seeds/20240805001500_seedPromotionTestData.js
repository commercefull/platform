/**
 * Seed file for promotion test data
 * Creates test promotions, coupons, discounts, and gift cards
 */

// Fixed UUIDs for consistent testing
const SEEDED_PROMOTION_ID = '01935f00-0000-7000-8000-000000000001';
const SEEDED_PROMOTION_CART_ID = '01935f00-0000-7000-8000-000000000002';
const SEEDED_COUPON_ID = '01935f00-0000-7000-8000-000000000010';
const SEEDED_COUPON_PERCENTAGE_ID = '01935f00-0000-7000-8000-000000000011';
const SEEDED_COUPON_EXPIRED_ID = '01935f00-0000-7000-8000-000000000012';
const SEEDED_PRODUCT_DISCOUNT_ID = '01935f00-0000-7000-8000-000000000020';
const SEEDED_GIFT_CARD_ID = '01935f00-0000-7000-8000-000000000030';
const SEEDED_GIFT_CARD_DEPLETED_ID = '01935f00-0000-7000-8000-000000000031';

// Reference IDs from other seeds
const SEEDED_MERCHANT_ID = '01935e00-0000-7000-8000-000000000001';
const SEEDED_CUSTOMER_ID = '01935e00-0000-7000-8000-000000000100';

exports.seed = async function(knex) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
  const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  // Clean up existing test data
  await knex('promotionCouponUsage').del();
  await knex('promotionCoupon').del();
  await knex('promotionProductDiscountItem').del();
  await knex('promotionProductDiscountCustomerGroup').del();
  await knex('promotionProductDiscount').del();
  await knex('promotionGiftCardTransaction').del();
  await knex('promotionGiftCard').del();
  await knex('promotionUsage').del();
  await knex('promotionAction').del();
  await knex('promotionRule').del();
  await knex('promotion').del();

  // Seed promotions
  await knex('promotion').insert([
    {
      promotionId: SEEDED_PROMOTION_ID,
      name: 'Test Product Promotion',
      description: 'A test promotion for products',
      status: 'active',
      scope: 'product',
      priority: 10,
      startDate: now,
      endDate: futureDate,
      isActive: true,
      isExclusive: false,
      maxUsage: 1000,
      usageCount: 0,
      maxUsagePerCustomer: 5,
      minOrderAmount: 10.00,
      maxDiscountAmount: 100.00,
      merchantId: null,
      isGlobal: true,
      createdAt: now,
      updatedAt: now
    },
    {
      promotionId: SEEDED_PROMOTION_CART_ID,
      name: 'Test Cart Promotion',
      description: 'A test promotion for cart',
      status: 'active',
      scope: 'cart',
      priority: 5,
      startDate: now,
      endDate: futureDate,
      isActive: true,
      isExclusive: false,
      maxUsage: 500,
      usageCount: 0,
      maxUsagePerCustomer: 3,
      minOrderAmount: 50.00,
      maxDiscountAmount: 50.00,
      merchantId: null,
      isGlobal: true,
      createdAt: now,
      updatedAt: now
    }
  ]);

  // Seed promotion rules
  await knex('promotionRule').insert([
    {
      promotionId: SEEDED_PROMOTION_ID,
      name: 'Minimum cart total',
      description: 'Requires minimum cart total of $10',
      condition: 'all',
      operator: 'and',
      value: JSON.stringify({ type: 'cartTotal', operator: 'gte', amount: 10 }),
      isRequired: true,
      ruleGroup: 'default',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      promotionId: SEEDED_PROMOTION_CART_ID,
      name: 'Minimum cart total for cart promo',
      description: 'Requires minimum cart total of $50',
      condition: 'all',
      operator: 'and',
      value: JSON.stringify({ type: 'cartTotal', operator: 'gte', amount: 50 }),
      isRequired: true,
      ruleGroup: 'default',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now
    }
  ]);

  // Seed promotion actions
  await knex('promotionAction').insert([
    {
      promotionId: SEEDED_PROMOTION_ID,
      name: 'Product Discount',
      description: '10% off products',
      actionType: 'discount',
      value: JSON.stringify({ type: 'percentage', amount: 10 }),
      targetType: 'product',
      targetIds: null,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      promotionId: SEEDED_PROMOTION_CART_ID,
      name: 'Cart Discount',
      description: '$5 off cart',
      actionType: 'discount',
      value: JSON.stringify({ type: 'fixed', amount: 5 }),
      targetType: 'cart',
      targetIds: null,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now
    }
  ]);

  // Seed coupons
  await knex('promotionCoupon').insert([
    {
      promotionCouponId: SEEDED_COUPON_ID,
      code: 'TESTFIXED10',
      promotionId: SEEDED_PROMOTION_ID,
      name: 'Test Fixed Amount Coupon',
      description: '$10 off your order',
      type: 'fixedAmount',
      discountAmount: 10.00,
      currencyCode: 'USD',
      minOrderAmount: 25.00,
      maxDiscountAmount: null,
      startDate: now,
      endDate: futureDate,
      isActive: true,
      isOneTimeUse: false,
      maxUsage: 100,
      usageCount: 0,
      maxUsagePerCustomer: 3,
      generationMethod: 'manual',
      isReferral: false,
      referrerId: null,
      isPublic: true,
      merchantId: null,
      createdAt: now,
      updatedAt: now
    },
    {
      promotionCouponId: SEEDED_COUPON_PERCENTAGE_ID,
      code: 'TESTPERCENT15',
      promotionId: SEEDED_PROMOTION_ID,
      name: 'Test Percentage Coupon',
      description: '15% off your order',
      type: 'percentage',
      discountAmount: 15.00,
      currencyCode: 'USD',
      minOrderAmount: 50.00,
      maxDiscountAmount: 100.00,
      startDate: now,
      endDate: futureDate,
      isActive: true,
      isOneTimeUse: false,
      maxUsage: 200,
      usageCount: 0,
      maxUsagePerCustomer: 2,
      generationMethod: 'manual',
      isReferral: false,
      referrerId: null,
      isPublic: true,
      merchantId: null,
      createdAt: now,
      updatedAt: now
    },
    {
      promotionCouponId: SEEDED_COUPON_EXPIRED_ID,
      code: 'EXPIRED20',
      promotionId: null,
      name: 'Expired Coupon',
      description: 'This coupon has expired',
      type: 'percentage',
      discountAmount: 20.00,
      currencyCode: 'USD',
      minOrderAmount: null,
      maxDiscountAmount: null,
      startDate: pastDate,
      endDate: new Date(pastDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after past date
      isActive: false,
      isOneTimeUse: false,
      maxUsage: 50,
      usageCount: 50,
      maxUsagePerCustomer: 1,
      generationMethod: 'manual',
      isReferral: false,
      referrerId: null,
      isPublic: false,
      merchantId: null,
      createdAt: pastDate,
      updatedAt: pastDate
    }
  ]);

  // Seed product discounts
  await knex('promotionProductDiscount').insert([
    {
      promotionProductDiscountId: SEEDED_PRODUCT_DISCOUNT_ID,
      promotionId: SEEDED_PROMOTION_ID,
      name: 'Test Product Discount',
      description: '10% off selected products',
      discountType: 'percentage',
      discountValue: 10.00,
      currencyCode: 'USD',
      startDate: now,
      endDate: futureDate,
      isActive: true,
      priority: 5,
      appliesTo: 'all_products',
      minimumQuantity: 1,
      maximumQuantity: null,
      minimumAmount: null,
      maximumDiscountAmount: 50.00,
      stackable: false,
      displayOnProductPage: true,
      displayInListing: true,
      badgeText: '10% OFF',
      badgeStyle: JSON.stringify({ backgroundColor: '#ff0000', color: '#ffffff' }),
      merchantId: null,
      createdAt: now,
      updatedAt: now
    }
  ]);

  // Seed gift cards
  await knex('promotionGiftCard').insert([
    {
      promotionGiftCardId: SEEDED_GIFT_CARD_ID,
      code: 'GIFT-TEST-0001',
      type: 'standard',
      initialBalance: 100.00,
      currentBalance: 100.00,
      currency: 'USD',
      status: 'active',
      purchasedBy: null,
      purchaseOrderId: null,
      recipientEmail: 'test@example.com',
      recipientName: 'Test User',
      personalMessage: 'Happy testing!',
      deliveryDate: null,
      isDelivered: true,
      deliveredAt: now,
      deliveryMethod: 'email',
      assignedTo: null,
      assignedAt: null,
      activatedAt: now,
      expiresAt: futureDate,
      lastUsedAt: null,
      usageCount: 0,
      totalRedeemed: 0,
      isReloadable: true,
      minReloadAmount: 10.00,
      maxReloadAmount: 500.00,
      maxBalance: 1000.00,
      restrictions: null,
      metadata: null,
      createdAt: now,
      updatedAt: now
    },
    {
      promotionGiftCardId: SEEDED_GIFT_CARD_DEPLETED_ID,
      code: 'GIFT-TEST-0002',
      type: 'standard',
      initialBalance: 50.00,
      currentBalance: 0,
      currency: 'USD',
      status: 'depleted',
      purchasedBy: null,
      purchaseOrderId: null,
      recipientEmail: 'depleted@example.com',
      recipientName: 'Depleted User',
      personalMessage: null,
      deliveryDate: null,
      isDelivered: true,
      deliveredAt: pastDate,
      deliveryMethod: 'email',
      assignedTo: null,
      assignedAt: null,
      activatedAt: pastDate,
      expiresAt: futureDate,
      lastUsedAt: now,
      usageCount: 1,
      totalRedeemed: 50.00,
      isReloadable: false,
      minReloadAmount: null,
      maxReloadAmount: null,
      maxBalance: null,
      restrictions: null,
      metadata: null,
      createdAt: pastDate,
      updatedAt: now
    }
  ]);

  // Seed gift card transaction for depleted card
  await knex('promotionGiftCardTransaction').insert([
    {
      promotionGiftCardId: SEEDED_GIFT_CARD_DEPLETED_ID,
      type: 'redemption',
      amount: -50.00,
      balanceBefore: 50.00,
      balanceAfter: 0,
      currency: 'USD',
      orderId: null,
      customerId: null,
      performedBy: null,
      performedByType: 'system',
      notes: 'Test redemption',
      referenceNumber: 'GCT-TEST-001',
      metadata: null,
      createdAt: now
    }
  ]);

  
};

// Export IDs for use in tests
module.exports.SEEDED_PROMOTION_ID = SEEDED_PROMOTION_ID;
module.exports.SEEDED_PROMOTION_CART_ID = SEEDED_PROMOTION_CART_ID;
module.exports.SEEDED_COUPON_ID = SEEDED_COUPON_ID;
module.exports.SEEDED_COUPON_PERCENTAGE_ID = SEEDED_COUPON_PERCENTAGE_ID;
module.exports.SEEDED_COUPON_EXPIRED_ID = SEEDED_COUPON_EXPIRED_ID;
module.exports.SEEDED_PRODUCT_DISCOUNT_ID = SEEDED_PRODUCT_DISCOUNT_ID;
module.exports.SEEDED_GIFT_CARD_ID = SEEDED_GIFT_CARD_ID;
module.exports.SEEDED_GIFT_CARD_DEPLETED_ID = SEEDED_GIFT_CARD_DEPLETED_ID;
