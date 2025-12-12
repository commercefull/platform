/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('subscriptionPause', function(table) {
    table.uuid('subscriptionPauseId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('customerSubscriptionId').notNullable().references('customerSubscriptionId').inTable('customerSubscription').onDelete('CASCADE');
    table.string('status').defaultTo('active'); // active, resumed, expired, cancelled
    table.timestamp('pausedAt').notNullable();
    table.timestamp('scheduledResumeAt');
    table.timestamp('actualResumeAt');
    table.string('reason');
    table.text('customerNote');
    table.string('pausedBy'); // customer, admin, system
    table.string('resumedBy');
    table.integer('pauseDays');
    table.integer('billingCyclesSkipped').defaultTo(0);
    table.decimal('creditAmount', 15, 2).defaultTo(0);
    table.boolean('creditApplied').defaultTo(false);
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index('customerSubscriptionId');
    table.index('status');
    table.index('scheduledResumeAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('subscriptionPause');
};
