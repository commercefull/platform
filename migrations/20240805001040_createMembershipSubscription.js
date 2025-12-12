/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipSubscription', t => {
    t.uuid('membershipSubscriptionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('membershipPlanId').notNullable().references('membershipPlanId').inTable('membershipPlan').onDelete('RESTRICT');
    t.enum('status', ['active', 'cancelled', 'expired', 'paused', 'trial', 'pending', 'pastDue']).notNullable().defaultTo('active');
    t.string('membershipNumber', 100);
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.timestamp('trialEndDate');
    t.timestamp('nextBillingDate');
    t.timestamp('lastBillingDate');
    t.timestamp('cancelledAt');
    t.text('cancelReason');
    t.boolean('isAutoRenew').notNullable().defaultTo(true);
    t.decimal('priceOverride', 10, 2);
    t.string('billingCycleOverride', 20);
    t.uuid('paymentMethodId');
    t.text('notes');
    
    t.uuid('createdBy');
    t.index('customerId');
    t.index('membershipPlanId');
    t.index('status');
    t.index('startDate');
    t.index('endDate');
    t.index('trialEndDate');
    t.index('nextBillingDate');
    t.index('isAutoRenew');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipSubscription');
};
