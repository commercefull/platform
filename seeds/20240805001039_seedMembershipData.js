/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Insert default membership plans
  await knex('membershipPlan').insert([
    {
      name: 'Basic',
      code: 'BASIC',
      description: 'Basic membership plan with standard benefits',
      shortDescription: 'Essential membership benefits',
      isActive: true,
      isPublic: true,
      isDefault: true,
      priority: 10,
      level: 1,
      price: 9.99,
      billingCycle: 'monthly',
      billingPeriod: 1,
      autoRenew: true,
    },
    {
      name: 'Premium',
      code: 'PREMIUM',
      description: 'Premium membership with additional benefits and features',
      shortDescription: 'Enhanced membership with more benefits',
      isActive: true,
      isPublic: true,
      isDefault: false,
      priority: 20,
      level: 2,
      price: 19.99,
      billingCycle: 'monthly',
      billingPeriod: 1,
      autoRenew: true,
    },
    {
      name: 'Annual Premium',
      code: 'ANNUAL_PREMIUM',
      description: 'Annual premium membership with all benefits at a discounted rate',
      shortDescription: 'All benefits at a yearly discount',
      isActive: true,
      isPublic: true,
      isDefault: false,
      priority: 30,
      level: 2,
      price: 199.99,
      billingCycle: 'annual',
      billingPeriod: 1,
      autoRenew: true,
    },
  ]);

  // Insert default membership benefits
  await knex('membershipBenefit').insert([
    {
      name: 'Member Discount',
      code: 'MEMBER_DISCOUNT',
      description: 'Discount on all purchases',
      shortDescription: 'Save on every order',
      isActive: true,
      priority: 10,
      benefitType: 'discount',
      valueType: 'percentage',
      value: JSON.stringify({ percentage: 10 }),
    },
    {
      name: 'Free Shipping',
      code: 'FREE_SHIPPING',
      description: 'Free shipping on all orders',
      shortDescription: 'No shipping costs',
      isActive: true,
      priority: 20,
      benefitType: 'freeShipping',
      valueType: 'boolean',
      value: JSON.stringify({ enabled: true, minimumOrderValue: 25 }),
    },
    {
      name: 'Priority Support',
      code: 'PRIORITY_SUPPORT',
      description: 'Access to priority customer support',
      shortDescription: 'Get help faster',
      isActive: true,
      priority: 30,
      benefitType: 'prioritySupport',
      valueType: 'boolean',
      value: JSON.stringify({ enabled: true }),
    },
    {
      name: 'Double Points',
      code: 'DOUBLE_POINTS',
      description: 'Earn double loyalty points on purchases',
      shortDescription: 'Earn rewards faster',
      isActive: true,
      priority: 40,
      benefitType: 'rewardPoints',
      valueType: 'fixed',
      value: JSON.stringify({ multiplier: 2 }),
    },
    {
      name: 'Exclusive Content',
      code: 'EXCLUSIVE_CONTENT',
      description: 'Access to exclusive member-only content',
      shortDescription: 'Members-only content',
      isActive: true,
      priority: 50,
      benefitType: 'contentAccess',
      valueType: 'boolean',
      value: JSON.stringify({ enabled: true }),
    },
    {
      name: 'Early Access',
      code: 'EARLY_ACCESS',
      description: 'Early access to new products and sales',
      shortDescription: 'Shop before everyone else',
      isActive: true,
      priority: 60,
      benefitType: 'earlyAccess',
      valueType: 'fixed',
      value: JSON.stringify({ daysEarly: 2 }),
    },
  ]);

  // Link benefits to plans
  const plans = await knex('membershipPlan').select('membershipPlanId', 'code');
  const benefits = await knex('membershipBenefit').select('membershipBenefitId', 'code');
  const planMap = plans.reduce((acc, p) => ({ ...acc, [p.code]: p.membershipPlanId }), {});
  const benefitMap = benefits.reduce((acc, b) => ({ ...acc, [b.code]: b.membershipBenefitId }), {});

  await knex('membershipPlanBenefit').insert([
    // Basic plan benefits
    { planId: planMap.BASIC, benefitId: benefitMap.MEMBER_DISCOUNT, isActive: true, priority: 10 },
    { planId: planMap.BASIC, benefitId: benefitMap.FREE_SHIPPING, isActive: true, priority: 20 },
    // Premium plan benefits
    { planId: planMap.PREMIUM, benefitId: benefitMap.MEMBER_DISCOUNT, isActive: true, priority: 10 },
    { planId: planMap.PREMIUM, benefitId: benefitMap.FREE_SHIPPING, isActive: true, priority: 20 },
    { planId: planMap.PREMIUM, benefitId: benefitMap.PRIORITY_SUPPORT, isActive: true, priority: 30 },
    { planId: planMap.PREMIUM, benefitId: benefitMap.DOUBLE_POINTS, isActive: true, priority: 40 },
    { planId: planMap.PREMIUM, benefitId: benefitMap.EXCLUSIVE_CONTENT, isActive: true, priority: 50 },
    // Annual Premium plan benefits
    { planId: planMap.ANNUAL_PREMIUM, benefitId: benefitMap.MEMBER_DISCOUNT, isActive: true, priority: 10 },
    { planId: planMap.ANNUAL_PREMIUM, benefitId: benefitMap.FREE_SHIPPING, isActive: true, priority: 20 },
    { planId: planMap.ANNUAL_PREMIUM, benefitId: benefitMap.PRIORITY_SUPPORT, isActive: true, priority: 30 },
    { planId: planMap.ANNUAL_PREMIUM, benefitId: benefitMap.DOUBLE_POINTS, isActive: true, priority: 40 },
    { planId: planMap.ANNUAL_PREMIUM, benefitId: benefitMap.EXCLUSIVE_CONTENT, isActive: true, priority: 50 },
    { planId: planMap.ANNUAL_PREMIUM, benefitId: benefitMap.EARLY_ACCESS, isActive: true, priority: 60 },
  ]);

  // Add discount rules for membership plans
  await knex('membershipDiscountRule').insert([
    {
      planId: planMap.BASIC,
      name: 'Basic Member Discount',
      description: '10% discount on all orders',
      isActive: true,
      priority: 10,
      discountType: 'percentage',
      discountValue: 10,
      appliesTo: 'entireOrder',
    },
    {
      planId: planMap.PREMIUM,
      name: 'Premium Member Discount',
      description: '15% discount on all orders',
      isActive: true,
      priority: 10,
      discountType: 'percentage',
      discountValue: 15,
      appliesTo: 'entireOrder',
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('membershipDiscountRule').whereIn('name', ['Basic Member Discount', 'Premium Member Discount']).delete();
  await knex('membershipPlanBenefit').delete();
  await knex('membershipBenefit').delete();
  await knex('membershipPlan').delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
