/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const standardPlan = await knex('membership_plan').where({ name: 'Standard' }).first();
  const sampleCustomer = await knex('customer').where({ email: 'john.doe@example.com' }).first();
  const freeShippingBenefit = await knex('membership_benefit').where({ name: 'Free Shipping' }).first();

  if (standardPlan && sampleCustomer && freeShippingBenefit) {
    const [subscription] = await knex('membership_subscription')
      .insert({
        customer_id: sampleCustomer.id,
        plan_id: standardPlan.id,
        status: 'active',
        is_auto_renew: true,
        start_date: new Date(),
        next_billing_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      })
      .returning('*');

    await knex('membership_payment').insert({
      subscription_id: subscription.id,
      customer_id: sampleCustomer.id,
      amount: standardPlan.price,
      currency: standardPlan.currency,
      status: 'completed',
      payment_type: 'subscription',
      payment_method: 'credit_card',
      transaction_id: 'txn_123456789',
    });

    await knex('membership_benefit_usage').insert({
      subscription_id: subscription.id,
      customer_id: sampleCustomer.id,
      benefit_id: freeShippingBenefit.id,
      usage_type: 'free_shipping',
      related_entity_type: 'order',
    });

    await knex('membership_discount_code').insert({
      plan_id: standardPlan.id,
      code: 'WELCOME10',
      description: '10% off for new members',
      is_active: true,
      discount_type: 'percentage',
      discount_value: 10.00,
      valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      max_uses: 100,
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
  await knex('membership_discount_code_usage').del();
  await knex('membership_discount_code').del();
  await knex('membership_benefit_usage').del();
  await knex('membership_payment').del();
  await knex('membership_subscription').del();
};
