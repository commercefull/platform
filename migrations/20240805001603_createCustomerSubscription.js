/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerSubscription', function (table) {
    table.uuid('customerSubscriptionId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('subscriptionNumber').unique();
    table.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    table.uuid('subscriptionPlanId').notNullable().references('subscriptionPlanId').inTable('subscriptionPlan');
    table.uuid('subscriptionProductId').references('subscriptionProductId').inTable('subscriptionProduct');
    table.uuid('productVariantId').references('productVariantId').inTable('productVariant');
    table.string('status').defaultTo('pending'); // pending, trialing, active, paused, past_due, cancelled, expired
    table.integer('quantity').defaultTo(1);
    table.decimal('unitPrice', 15, 2).notNullable();
    table.decimal('discountAmount', 15, 2).defaultTo(0);
    table.decimal('taxAmount', 15, 2).defaultTo(0);
    table.decimal('totalPrice', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.string('billingInterval').notNullable();
    table.integer('billingIntervalCount').defaultTo(1);
    table.timestamp('trialStartAt');
    table.timestamp('trialEndAt');
    table.timestamp('currentPeriodStart');
    table.timestamp('currentPeriodEnd');
    table.timestamp('nextBillingAt');
    table.timestamp('cancelledAt');
    table.string('cancellationReason');
    table.string('cancelledBy'); // customer, admin, system
    table.boolean('cancelAtPeriodEnd').defaultTo(false);
    table.timestamp('pausedAt');
    table.timestamp('resumeAt');
    table.string('pauseReason');
    table.integer('pauseCount').defaultTo(0);
    table.integer('skipCount').defaultTo(0);
    table.integer('billingCycleCount').defaultTo(0);
    table.integer('contractCyclesRemaining');
    table.uuid('shippingAddressId');
    table.uuid('billingAddressId');
    table.string('paymentMethodId');
    table.string('externalSubscriptionId'); // Stripe/payment provider ID
    table.decimal('lifetimeValue', 15, 2).defaultTo(0);
    table.integer('failedPaymentCount').defaultTo(0);
    table.timestamp('lastPaymentAt');
    table.timestamp('lastPaymentFailedAt');
    table.jsonb('customizations'); // Product customizations
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('customerId');
    table.index('subscriptionPlanId');
    table.index('status');
    table.index('nextBillingAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('customerSubscription');
};
