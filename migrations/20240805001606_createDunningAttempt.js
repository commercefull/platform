/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('dunningAttempt', function(table) {
    table.uuid('dunningAttemptId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('customerSubscriptionId').notNullable().references('customerSubscriptionId').inTable('customerSubscription').onDelete('CASCADE');
    table.uuid('subscriptionOrderId').references('subscriptionOrderId').inTable('subscriptionOrder');
    table.integer('attemptNumber').notNullable();
    table.string('status').defaultTo('pending'); // pending, processing, success, failed, skipped
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.timestamp('scheduledAt').notNullable();
    table.timestamp('attemptedAt');
    table.string('paymentMethodId');
    table.string('paymentIntentId');
    table.string('failureCode');
    table.string('failureMessage');
    table.boolean('emailSent').defaultTo(false);
    table.timestamp('emailSentAt');
    table.string('emailType'); // payment_failed, payment_retry, final_notice
    table.boolean('smsSent').defaultTo(false);
    table.timestamp('smsSentAt');
    table.string('action'); // retry, update_payment, cancel
    table.string('actionTakenBy'); // customer, admin, system
    table.timestamp('actionTakenAt');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index('customerSubscriptionId');
    table.index('subscriptionOrderId');
    table.index('status');
    table.index('scheduledAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('dunningAttempt');
};
