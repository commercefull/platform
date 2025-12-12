/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('subscriptionProduct', function(table) {
    table.uuid('subscriptionProductId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    table.boolean('isSubscriptionOnly').defaultTo(false);
    table.boolean('allowOneTimePurchase').defaultTo(true);
    table.integer('minSubscriptionLength');
    table.integer('maxSubscriptionLength');
    table.integer('trialDays').defaultTo(0);
    table.boolean('trialRequiresPayment').defaultTo(false);
    table.string('billingAnchor').defaultTo('subscription_start'); // subscription_start, month_start, specific_day
    table.integer('billingAnchorDay');
    table.boolean('prorateOnChange').defaultTo(true);
    table.boolean('allowPause').defaultTo(true);
    table.integer('maxPauseDays');
    table.integer('maxPausesPerYear');
    table.boolean('allowSkip').defaultTo(true);
    table.integer('maxSkipsPerYear');
    table.boolean('allowEarlyCancel').defaultTo(true);
    table.integer('cancelNoticeDays').defaultTo(0);
    table.decimal('earlyTerminationFee', 15, 2);
    table.boolean('autoRenew').defaultTo(true);
    table.integer('renewalReminderDays').defaultTo(7);
    table.jsonb('metadata');
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.unique('productId');
    table.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('subscriptionProduct');
};
