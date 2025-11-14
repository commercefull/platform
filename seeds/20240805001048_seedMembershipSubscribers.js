/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const standardPlan = await knex('membershipPlan').where({ name: 'Standard' }).first();
  const sampleCustomer = await knex('customer').where({ email: 'john.doe@example.com' }).first();
  const freeShippingBenefit = await knex('membershipBenefit').where({ name: 'Free Shipping' }).first();

  if (standardPlan && sampleCustomer && freeShippingBenefit) {
    const [subscription] = await knex('membershipSubscription')
      .insert({
        customerId: sampleCustomer.id,
        planId: standardPlan.id,
        status: 'active',
        is_auto_renew: true,
        startDate: new Date(),
        next_billing_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      })
      .returning('*');

    await knex('membershipPayment').insert({
      subscriptionId: subscription.id,
      customerId: sampleCustomer.id,
      amount: standardPlan.price,
      currency: standardPlan.currency,
      status: 'completed',
      payment_type: 'subscription',
      payment_method: 'credit_card',
      transactionId: 'txn_123456789',
    });

    await knex('membershipBenefitUsage').insert({
      subscriptionId: subscription.id,
      customerId: sampleCustomer.id,
      benefitId: freeShippingBenefit.id,
      usage_type: 'free_shipping',
      relatedEntityType: 'order',
    });

    await knex('membershipDiscountCode').insert({
      planId: standardPlan.id,
      code: 'WELCOME10',
      description: '10% off for new members',
      isActive: true,
      discountType: 'percentage',
      discountValue: 10.00,
      validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      maxUses: 100,
      uses_remaining: 100,
      first_time_only: true,
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('membershipDiscountCodeUsage').del();
  await knex('membershipDiscountCode').del();
  await knex('membershipBenefitUsage').del();
  await knex('membershipPayment').del();
  await knex('membershipSubscription').del();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
