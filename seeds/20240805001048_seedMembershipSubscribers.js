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

  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('membershipPayment').del();
  await knex('membershipSubscription').del();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
