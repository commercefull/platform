/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Insert default membership plans
  await knex('membership_plan').insert([
    {
      name: 'Basic',
      code: 'BASIC',
      description: 'Basic membership plan with standard benefits',
      short_description: 'Essential membership benefits',
      is_active: true,
      is_public: true,
      is_default: true,
      priority: 10,
      level: 1,
      price: 9.99,
      billing_cycle: 'monthly'
    },
    {
      name: 'Premium',
      code: 'PREMIUM',
      description: 'Premium membership with additional benefits and features',
      short_description: 'Enhanced membership with more benefits',
      is_active: true,
      is_public: true,
      is_default: false,
      priority: 20,
      level: 2,
      price: 19.99,
      billing_cycle: 'monthly'
    },
    {
      name: 'Annual Premium',
      code: 'ANNUAL_PREMIUM',
      description: 'Annual premium membership with all benefits at a discounted rate',
      short_description: 'All benefits at a yearly discount',
      is_active: true,
      is_public: true,
      is_default: false,
      priority: 30,
      level: 2,
      price: 199.99,
      billing_cycle: 'annual'
    }
  ]);

  // Insert default membership benefits
  await knex('membership_benefit').insert([
    { name: 'Member Discount', code: 'MEMBER_DISCOUNT', description: 'Discount on all purchases', short_description: 'Save on every order', is_active: true, priority: 10, benefit_type: 'discount', value_type: 'percentage', value: JSON.stringify({ percentage: 10 }) },
    { name: 'Free Shipping', code: 'FREE_SHIPPING', description: 'Free shipping on all orders', short_description: 'No shipping costs', is_active: true, priority: 20, benefit_type: 'free_shipping', value_type: 'boolean', value: JSON.stringify({ enabled: true, minimumOrderValue: 25 }) },
    { name: 'Priority Support', code: 'PRIORITY_SUPPORT', description: 'Access to priority customer support', short_description: 'Get help faster', is_active: true, priority: 30, benefit_type: 'priority_support', value_type: 'boolean', value: JSON.stringify({ enabled: true }) },
    { name: 'Double Points', code: 'DOUBLE_POINTS', description: 'Earn double loyalty points on purchases', short_description: 'Earn rewards faster', is_active: true, priority: 40, benefit_type: 'reward_points', value_type: 'fixed', value: JSON.stringify({ multiplier: 2 }) },
    { name: 'Exclusive Content', code: 'EXCLUSIVE_CONTENT', description: 'Access to exclusive member-only content', short_description: 'Members-only content', is_active: true, priority: 50, benefit_type: 'content_access', value_type: 'boolean', value: JSON.stringify({ enabled: true }) },
    { name: 'Early Access', code: 'EARLY_ACCESS', description: 'Early access to new products and sales', short_description: 'Shop before everyone else', is_active: true, priority: 60, benefit_type: 'early_access', value_type: 'fixed', value: JSON.stringify({ daysEarly: 2 }) }
  ]);

  // Link benefits to plans
  const plans = await knex('membership_plan').select('id', 'code');
  const benefits = await knex('membership_benefit').select('id', 'code');
  const planMap = plans.reduce((acc, p) => ({ ...acc, [p.code]: p.id }), {});
  const benefitMap = benefits.reduce((acc, b) => ({ ...acc, [b.code]: b.id }), {});

  await knex('membership_plan_benefit').insert([
    // Basic plan benefits
    { plan_id: planMap.BASIC, benefit_id: benefitMap.MEMBER_DISCOUNT, is_active: true, priority: 10 },
    { plan_id: planMap.BASIC, benefit_id: benefitMap.FREE_SHIPPING, is_active: true, priority: 20 },
    // Premium plan benefits
    { plan_id: planMap.PREMIUM, benefit_id: benefitMap.MEMBER_DISCOUNT, is_active: true, priority: 10 },
    { plan_id: planMap.PREMIUM, benefit_id: benefitMap.FREE_SHIPPING, is_active: true, priority: 20 },
    { plan_id: planMap.PREMIUM, benefit_id: benefitMap.PRIORITY_SUPPORT, is_active: true, priority: 30 },
    { plan_id: planMap.PREMIUM, benefit_id: benefitMap.DOUBLE_POINTS, is_active: true, priority: 40 },
    { plan_id: planMap.PREMIUM, benefit_id: benefitMap.EXCLUSIVE_CONTENT, is_active: true, priority: 50 },
    // Annual Premium plan benefits
    { plan_id: planMap.ANNUAL_PREMIUM, benefit_id: benefitMap.MEMBER_DISCOUNT, is_active: true, priority: 10 },
    { plan_id: planMap.ANNUAL_PREMIUM, benefit_id: benefitMap.FREE_SHIPPING, is_active: true, priority: 20 },
    { plan_id: planMap.ANNUAL_PREMIUM, benefit_id: benefitMap.PRIORITY_SUPPORT, is_active: true, priority: 30 },
    { plan_id: planMap.ANNUAL_PREMIUM, benefit_id: benefitMap.DOUBLE_POINTS, is_active: true, priority: 40 },
    { plan_id: planMap.ANNUAL_PREMIUM, benefit_id: benefitMap.EXCLUSIVE_CONTENT, is_active: true, priority: 50 },
    { plan_id: planMap.ANNUAL_PREMIUM, benefit_id: benefitMap.EARLY_ACCESS, is_active: true, priority: 60 }
  ]);

  // Add discount rules for membership plans
  await knex('membership_discount_rule').insert([
    {
      plan_id: planMap.BASIC,
      name: 'Basic Member Discount',
      description: '10% discount on all orders',
      is_active: true,
      priority: 10,
      discount_type: 'percentage',
      discount_value: 10,
      applies_to: 'entire_order'
    },
    {
      plan_id: planMap.PREMIUM,
      name: 'Premium Member Discount',
      description: '15% discount on all orders',
      is_active: true,
      priority: 10,
      discount_type: 'percentage',
      discount_value: 15,
      applies_to: 'entire_order'
    }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('membership_discount_rule').whereIn('name', ['Basic Member Discount', 'Premium Member Discount']).delete();
  await knex('membership_plan_benefit').delete();
  await knex('membership_benefit').delete();
  await knex('membership_plan').delete();
};
