/**
 * Membership Ops Test Data Seed
 * Seeds a membership plan and an active membership subscription for
 * customer@example.com, used by membershipOps integration tests.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const PLAN_ID = '0193f000-0000-7000-8000-000000000001';
const SUBSCRIPTION_ID = '0193f001-0000-7000-8000-000000000001';

exports.seed = async function (knex) {
  const hasPlan = await knex.schema.hasTable('membershipPlan');
  const hasSubscription = await knex.schema.hasTable('membershipSubscription');
  if (!hasPlan || !hasSubscription) {
    return;
  }

  const testCustomer = await knex('customer').where({ email: 'customer@example.com' }).first('customerId');
  if (!testCustomer) {
    return;
  }

  const now = new Date();
  const nextBilling = new Date(now);
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  await knex('membershipSubscription').where('membershipSubscriptionId', SUBSCRIPTION_ID).del();
  await knex('membershipPlan').where('membershipPlanId', PLAN_ID).del();

  await knex('membershipPlan').insert({
    membershipPlanId: PLAN_ID,
    name: 'Ops Plan',
    code: 'OPS_PLAN',
    description: 'Plan for membership ops tests',
    isActive: true,
    isPublic: true,
    isDefault: false,
    level: 1,
    priceCents: 999,
    currencyCode: 'USD',
    billingCycle: 'monthly',
    billingPeriod: 1,
    autoRenew: true,
    createdAt: now,
    updatedAt: now,
  });

  await knex('membershipSubscription').insert({
    membershipSubscriptionId: SUBSCRIPTION_ID,
    customerId: testCustomer.customerId,
    membershipPlanId: PLAN_ID,
    status: 'active',
    membershipNumber: 'OPS-MEM-0001',
    startDate: now,
    nextBillingDate: nextBilling,
    isAutoRenew: true,
    createdAt: now,
    updatedAt: now,
  });

  // Legacy membership.test.ts fixtures: tier (plan), benefit + plan link, user membership (subscription)
  const LEGACY_TIER_ID = '0193f002-0000-7000-8000-000000000001';
  const LEGACY_BENEFIT_ID = '0193f003-0000-7000-8000-000000000001';
  const LEGACY_PLAN_BENEFIT_ID = '0193f004-0000-7000-8000-000000000001';
  const LEGACY_MEMBERSHIP_ID = '0193f005-0000-7000-8000-000000000001';

  const hasBenefit = await knex.schema.hasTable('membershipBenefit');
  const hasPlanBenefit = await knex.schema.hasTable('membershipPlanBenefit');
  if (!hasBenefit || !hasPlanBenefit) {
    return;
  }

  await knex('membershipSubscription').where('membershipSubscriptionId', LEGACY_MEMBERSHIP_ID).del();
  await knex('membershipPlanBenefit').where('membershipPlanBenefitId', LEGACY_PLAN_BENEFIT_ID).del();
  await knex('membershipBenefit').where('membershipBenefitId', LEGACY_BENEFIT_ID).del();
  await knex('membershipPlan').where('membershipPlanId', LEGACY_TIER_ID).del();

  await knex('membershipPlan').insert({
    membershipPlanId: LEGACY_TIER_ID,
    name: 'Test Tier',
    code: 'TEST_TIER',
    description: 'Test tier for integration tests',
    isActive: true,
    isPublic: true,
    isDefault: false,
    level: 2,
    priceCents: 1999,
    currencyCode: 'USD',
    billingCycle: 'monthly',
    billingPeriod: 1,
    autoRenew: true,
    createdAt: now,
    updatedAt: now,
  });

  await knex('membershipBenefit').insert({
    membershipBenefitId: LEGACY_BENEFIT_ID,
    name: 'Test Benefit',
    code: 'TEST_BENEFIT',
    description: 'Test benefit for integration tests',
    benefitType: 'discount',
    valueType: 'percentage',
    value: JSON.stringify({ percentage: 10 }),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await knex('membershipPlanBenefit').insert({
    membershipPlanBenefitId: LEGACY_PLAN_BENEFIT_ID,
    planId: LEGACY_TIER_ID,
    benefitId: LEGACY_BENEFIT_ID,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const nextYear = new Date(now);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  await knex('membershipSubscription').insert({
    membershipSubscriptionId: LEGACY_MEMBERSHIP_ID,
    customerId: testCustomer.customerId,
    membershipPlanId: LEGACY_TIER_ID,
    status: 'active',
    membershipNumber: 'TEST-MEM-0001',
    startDate: now,
    endDate: nextYear,
    isAutoRenew: true,
    createdAt: now,
    updatedAt: now,
  });
};
