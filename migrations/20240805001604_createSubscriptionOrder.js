/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('subscriptionOrder', function (table) {
    table.uuid('subscriptionOrderId').primary().defaultTo(knex.raw('uuidv7()'));
    table
      .uuid('customerSubscriptionId')
      .notNullable()
      .references('customerSubscriptionId')
      .inTable('customerSubscription')
      .onDelete('CASCADE');
    table.uuid('orderId').references('orderId').inTable('order');
    table.integer('billingCycleNumber').notNullable();
    table.timestamp('periodStart').notNullable();
    table.timestamp('periodEnd').notNullable();
    table.string('status').defaultTo('pending'); // pending, processing, paid, failed, refunded, skipped
    table.decimal('subtotal', 15, 2).notNullable();
    table.decimal('discountAmount', 15, 2).defaultTo(0);
    table.decimal('taxAmount', 15, 2).defaultTo(0);
    table.decimal('shippingAmount', 15, 2).defaultTo(0);
    table.decimal('totalAmount', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.timestamp('scheduledAt');
    table.timestamp('processedAt');
    table.timestamp('paidAt');
    table.timestamp('failedAt');
    table.string('failureReason');
    table.integer('retryCount').defaultTo(0);
    table.timestamp('nextRetryAt');
    table.string('paymentIntentId');
    table.string('invoiceId');
    table.boolean('isProrated').defaultTo(false);
    table.jsonb('lineItems');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('customerSubscriptionId');
    table.index('orderId');
    table.index('status');
    table.index('scheduledAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('subscriptionOrder');
};
