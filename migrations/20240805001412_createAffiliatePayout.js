/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('affiliatePayout', function(table) {
    table.uuid('affiliatePayoutId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('affiliateId').notNullable().references('affiliateId').inTable('affiliate').onDelete('CASCADE');
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.string('paymentMethod').notNullable().checkIn(['paypal', 'bank_transfer', 'check', 'store_credit']);
    table.string('status').defaultTo('pending').checkIn(['pending', 'processing', 'completed', 'failed', 'cancelled']);
    table.string('paypalEmail');
    table.string('paypalTransactionId');
    table.jsonb('bankDetails');
    table.string('bankReference');
    table.string('checkNumber');
    table.string('storeCreditCode');
    table.integer('commissionsCount').defaultTo(0);
    table.string('periodStart');
    table.string('periodEnd');
    table.text('notes');
    table.string('failureReason');
    table.timestamp('processedAt');
    table.uuid('processedBy');
    table.timestamp('completedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('affiliateId');
    table.index('status');
    table.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('affiliatePayout');
};
