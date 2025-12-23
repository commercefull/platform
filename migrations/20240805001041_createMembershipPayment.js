/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipPayment', t => {
    t.uuid('membershipPaymentId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('subscriptionId').notNullable().references('membershipSubscriptionId').inTable('membershipSubscription').onDelete('CASCADE');
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.decimal('amount', 10, 2).notNullable();
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.timestamp('paymentDate').notNullable().defaultTo(knex.fn.now());
    t.enum('status', ['pending', 'completed', 'failed', 'refunded', 'partiallyRefunded']).notNullable().defaultTo('pending');
    t.enum('paymentType', ['subscription', 'setupFee', 'manual', 'refund']).notNullable();
    t.string('paymentMethod', 50);
    t.string('transactionId', 255);
    t.timestamp('billingPeriodStart');
    t.timestamp('billingPeriodEnd');

    t.text('notes');
    t.index('subscriptionId');
    t.index('customerId');
    t.index('paymentDate');
    t.index('status');
    t.index('paymentType');
    t.index('transactionId');
    t.index('billingPeriodStart');
    t.index('billingPeriodEnd');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipPayment');
};
